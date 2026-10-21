// Email delivery for feedback: plain SMTP over implicit TLS built on node's socket modules.
// No mail library — the runtime image is already heavy and feedback is a few messages a month.
// Mirrors notify/feishu.ts: forward one feedback, attach the local screenshot when there is one,
// delete the file on success, keep it and fail loudly (the sweep retries) on transient errors.
import tls from "node:tls";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.ts";
import { sql } from "../db.ts";

const SCREENSHOT_GIVE_UP_MS = 24 * 3600_000;

export const emailFeedbackEnabled = () =>
  !!(process.env.FEEDBACK_EMAIL_TO && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

/** One complete SMTP reply: the status line plus any 25x-continuation lines above it. */
type Reply = { code: number; text: string };

/** Minimal implicit-TLS SMTP session good enough for one message: greeting, EHLO, AUTH LOGIN, MAIL, RCPT, DATA. */
class SmtpSession {
  private socket: tls.TLSSocket;
  private buffer = "";
  private pending: ((r: Reply) => void) | null = null;

  private constructor(socket: tls.TLSSocket) {
    this.socket = socket;
    socket.setEncoding("utf8");
    socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      let end: number;
      while ((end = this.buffer.indexOf("\r\n")) !== -1) {
        const line = this.buffer.slice(0, end);
        this.buffer = this.buffer.slice(end + 2);
        const match = /^(\d{3})([- ]) ?(.*)$/.exec(line);
        if (!match) continue;
        if (match[2] === "-") continue; // multiline continuation; the final line carries the status
        const resolver = this.pending;
        this.pending = null;
        resolver?.({ code: Number(match[1]), text: match[3] });
      }
    });
    socket.on("error", () => this.fail("connection error"));
    socket.on("close", () => this.fail("connection closed"));
  }

  private fail(why: string): void {
    const resolver = this.pending;
    this.pending = null;
    resolver?.({ code: 0, text: why });
  }

  static connect(host: string, port: number): Promise<SmtpSession> {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({ host, port, servername: host, timeout: 15_000 }, () =>
        resolve(new SmtpSession(socket)));
      socket.once("error", reject);
      socket.once("timeout", () => { socket.destroy(); reject(new Error("smtp connect timeout")); });
    });
  }

  reply(): Promise<Reply> {
    return new Promise((resolve, reject) => {
      this.pending = resolve;
      setTimeout(() => { if (this.pending === resolve) { this.pending = null; reject(new Error("smtp reply timeout")); } }, 20_000);
    });
  }

  async cmd(line: string): Promise<Reply> {
    this.socket.write(line + "\r\n");
    return this.reply();
  }

  end(): void {
    this.socket.end();
  }
}

const b64 = (s: string | Buffer): string => Buffer.from(s).toString("base64");

/** Send one message with an optional attachment. SMTP_USER is both envelope sender and From. */
async function smtpSend(to: string, subject: string, text: string, attach: { filename: string; mime: string; data: Buffer } | null): Promise<void> {
  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const s = await SmtpSession.connect(host, port);
  try {
    const greeting = await s.reply(); // server speaks first: 220 greeting
    if (greeting.code !== 220) throw new Error(`smtp greeting: ${greeting.code} ${greeting.text}`);
    const ehloHost = process.env.SMTP_EHLO_NAME || "edu.comniuer.cn";
    for (const [line, ok] of [
      [`EHLO ${ehloHost}`, 250],
      ["AUTH LOGIN", 334],
      [b64(user), 334],
      [b64(pass), 235],
      [`MAIL FROM:<${user}>`, 250],
      [`RCPT TO:<${to}>`, 250],
      ["DATA", 354],
    ] as const) {
      const r = await s.cmd(line);
      if (r.code !== ok) throw new Error(`smtp ${line.split(" ")[0]}: ${r.code} ${r.text}`);
    }
    const boundary = `edu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const head = [
      `From: =?UTF-8?B?${b64("教育资讯反馈")}?= <${user}>`,
      `To: <${to}>`,
      `Subject: =?UTF-8?B?${b64(subject)}?=`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      "This is a multipart message in MIME format.",
    ].join("\r\n");
    const textPart = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="utf-8"',
      "Content-Transfer-Encoding: base64",
      "",
      b64(text),
    ].join("\r\n");
    const parts = [textPart];
    if (attach) {
      parts.push([
        `--${boundary}`,
        `Content-Type: ${attach.mime}; name="${attach.filename}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${attach.filename}"`,
        "",
        attach.data.toString("base64").replace(/(.{76})/g, "$1\r\n"),
      ].join("\r\n"));
    }
    const body = [head, ...parts, `--${boundary}--`, ""].join("\r\n");
    const dotStuffed = body.replace(/(^|\r\n)\./g, "$1..");
    const r = await s.cmd(dotStuffed + "\r\n.");
    if (r.code !== 250) throw new Error(`smtp data: ${r.code} ${r.text}`);
  } finally {
    s.end();
  }
}

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
};

export async function forwardFeedbackToEmail(id: number): Promise<"sent" | "disabled"> {
  if (!emailFeedbackEnabled()) return "disabled";
  const [fb] = await sql<{ id: number; content: string; email: string | null; note: string | null; page_url: string | null; screenshot_key: string | null; created_at: Date }[]>`
    SELECT id, content, email, note, page_url, screenshot_key, created_at FROM feedback WHERE id = ${id} AND forwarded_at IS NULL`;
  if (!fb) return "disabled";
  try {
    let attach: { filename: string; mime: string; data: Buffer } | null = null;
    const key = fb.screenshot_key;
    if (key?.startsWith("local:")) {
      const file = path.join(config.dataDir, "feedback-screenshots", key.slice("local:".length));
      const data = await readFile(file).catch(() => null);
      if (!data) {
        await sql`UPDATE feedback SET screenshot_key = 'gone:missing' WHERE id = ${fb.id}`;
      } else if (Date.now() - fb.created_at.getTime() < SCREENSHOT_GIVE_UP_MS) {
        const ext = path.extname(file).slice(1).toLowerCase();
        const mime = MIME_BY_EXT[ext];
        if (mime) attach = { filename: `feedback-${fb.id}.${ext}`, mime, data };
      }
    }
    const lines = [
      fb.content,
      "",
      `页面：${fb.page_url ?? "—"}`,
      `反馈人邮箱：${fb.email ?? "（未留）"}`,
      fb.note ? `备注：${fb.note}` : null,
      attach ? "" : "（无截图或截图未能附带）",
    ].filter((l): l is string => l !== null);
    await smtpSend(process.env.FEEDBACK_EMAIL_TO!, `教育资讯反馈 #${fb.id}`, lines.join("\n"), attach);
    await sql`UPDATE feedback SET forwarded_at = now(), forward_error = NULL WHERE id = ${fb.id}`;
    if (attach) await unlink(path.join(config.dataDir, "feedback-screenshots", key!.slice("local:".length))).catch(() => {});
    if (attach) await sql`UPDATE feedback SET screenshot_key = 'email:sent' WHERE id = ${fb.id}`;
    return "sent";
  } catch (error) {
    await sql`UPDATE feedback SET forward_error = ${String(error instanceof Error ? error.message : error).slice(0, 300)} WHERE id = ${id}`;
    throw error;
  }
}
