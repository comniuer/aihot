# -*- coding: utf-8 -*-
"""worker 节流落地：查重启策略 -> 必要时改 compose 为 unless-stopped -> 装每小时 cron"""
import subprocess, sys, re

BASE = "/home/martin/agent/aihot"

def sh(title, *cmd, show=True, ok=0):
    r = subprocess.run(cmd, capture_output=True)
    out = ((r.stdout or b"") + (r.stderr or b"")).decode("utf-8", errors="replace").strip()
    if show:
        print(f"--- {title} ---\n{out[:1200]}")
    if r.returncode not in (0, ok) and ok != 1:
        pass
    return out

# 1. worker 服务在 compose 里的重启策略与内存上限
comp = sh("compose worker 段", "grep", "-n", "-A8", "worker:", f"{BASE}/docker-compose.yml")

# 2. 重启策略改为 unless-stopped（仅当是 always 时）
s = open(f"{BASE}/docker-compose.yml", encoding="utf-8").read()
m = re.search(r"(worker:\n(?:.*\n)*?    restart: )always", s)
if m:
    s = s[:m.start()] + m.group(1) + "unless-stopped" + s[m.end():]
    open(f"{BASE}/docker-compose.yml", "w", encoding="utf-8", newline="").write(s)
    sh("重启策略已改", "grep", "-A8", "worker:", f"{BASE}/docker-compose.yml")
else:
    print("worker restart 策略无需修改（非 always）")

# 3. 安装每小时 cron（每小时第 17 分启动，跑 10 分钟后停；幂等：先删旧行再加）
CRON_LINE = "17 * * * * cd /home/martin/agent/aihot && docker compose start worker >> /home/martin/agent/aihot/worker-throttle.log 2>&1 && sleep 600 && docker compose stop worker >> /home/martin/agent/aihot/worker-throttle.log 2>&1 # aihot-worker-throttle"
cur = sh("当前 crontab", "crontab", "-l")
lines = [l for l in cur.splitlines() if "aihot-worker-throttle" not in l]
lines.append(CRON_LINE)
p = subprocess.run(["crontab", "-"], input="\n".join(lines) + "\n", capture_output=True, text=True)
print("crontab 安装:", "OK" if p.returncode == 0 else p.stderr)
sh("确认 crontab", "crontab", "-l")
print("THROTTLE_DONE")
