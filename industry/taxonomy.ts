// 教育资讯行业的分类体系：类别、标签词表、机构（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

export const CATEGORIES = [
  { key: "policy", label: "政策与法规", feedLabel: "政策与法规", section: "政策与法规", guide: "中央和地方政府发布的教育政策、法规、规章和规范性文件。包括招生入学政策、双减与作业管理、民办教育规范、校外培训监管、教师编制与职称等。" },
  { key: "exam", label: "考试与招生", feedLabel: "考试与招生", section: "考试与招生", guide: "中考、高考、学业水平考试、研究生考试的报名通知、时间安排、分数线、招生计划与录取动态。各级招生考试机构发布的通知归此类。" },
  { key: "school", label: "学校与学位", feedLabel: "学校与学位", section: "学校与学位", guide: "学校建设、学位供给、新校开办、集团化办学、校园安全整改等学校层面的实质性进展。" },
  { key: "data", label: "数据与报告", feedLabel: "数据与报告", section: "数据与报告", guide: "教育统计数据、学业质量监测、调研报告和教育行业研究。有具体数据的研究报告归此类。" },
  { key: "tech", label: "教育与科技", feedLabel: "教育与科技", section: "教育与科技", guide: "教育数字化平台、智慧课堂、AI 学习产品、在线学习工具的产品迭代与规模化应用。" },
  { key: "case", label: "案例与观点", section: "案例与观点", guide: "教学案例、办学经验、教育时评和专家访谈。重点是分析和判断，而非具体事件报道。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "policy", tag: "政策法规", unit: "项新政策" };

export const PLAIN_TERMS: readonly string[] = ["json", "ai", "gpa", "ap", "ib"];

export const ITEM_TYPES = ["policy_release", "exam_event", "data_report", "school_project", "product_update", "case_study", "opinion_analysis"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

export const CATEGORY_TAGS = [
  "政策法规", "考试招生", "学校学位", "数据报告", "教育科技", "案例观点", "行业动态", "其他",
] as const;

export const TOPIC_TAGS = [
  "广东", "深圳", "广州", "全国", "宝安",
  "中考", "小升初", "幼升小", "高考", "小学", "初中", "高中", "学前教育",
  "校外培训", "教师发展", "心理健康", "教育数字化",
] as const;

export const ENTITY_TAGS = ["教育部", "广东省教育厅", "广东省教育考试院", "深圳市教育局", "广州市教育局", "深圳市招生考试办公室", "中国教育报", "华南师范大学"] as const;

export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "政策": "政策法规", "法规": "政策法规", "监管": "政策法规", "标准": "政策法规", "办法": "政策法规", "通知": "政策法规",
  "报名": "考试招生", "招生": "考试招生", "中考": "考试招生", "高考": "考试招生", "分数线": "考试招生", "录取": "考试招生",
  "学位": "学校学位", "新校": "学校学位", "建校": "学校学位", "改扩建": "学校学位", "集团化": "学校学位",
  "统计": "数据报告", "数据": "数据报告", "报告": "数据报告", "监测": "数据报告", "调研": "数据报告",
  "数字化": "教育科技", "平台": "教育科技", "智慧": "教育科技", "产品": "教育科技", "工具": "教育科技",
  "案例": "案例观点", "复盘": "案例观点", "观点": "案例观点", "访谈": "案例观点", "分析": "案例观点",
  "行业": "行业动态", "动态": "行业动态",
};

// ── 教育机构与主体 ──────────────────────────────────────────────────────────────────────

export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  "moe": { name: "教育部", displayTag: "教育部", aliases: ["教育部", "教育部教育考试院"], otherNames: ["国家教育部"] },
  "gd-edu": { name: "广东省教育厅", displayTag: "广东省教育厅", aliases: ["省教育厅", "广东省教育厅"], otherNames: ["广东教育"] },
  "gd-eea": { name: "广东省教育考试院", displayTag: "广东省教育考试院", aliases: ["省考试院", "广东省教育考试院"], otherNames: ["广东考试院"] },
  "sz-edu": { name: "深圳市教育局", displayTag: "深圳市教育局", aliases: ["深圳市教育局", "市教育局"], otherNames: ["深圳教育"] },
  "gz-edu": { name: "广州市教育局", displayTag: "广州市教育局", aliases: ["广州市教育局", "广州市教育"], otherNames: ["广州教育"] },
  "sz-zkb": { name: "深圳市招生考试办公室", displayTag: "深圳市招考办", aliases: ["深圳市招考办", "深圳招考办", "深圳市招生考试办公室"], otherNames: ["深圳市中考中招"] },
  "jyb": { name: "中国教育报", displayTag: "中国教育报", aliases: ["中国教育报", "中国教育新闻网"], otherNames: ["jyb"] },
  "scnu": { name: "华南师范大学", displayTag: "华南师范大学", aliases: ["华南师范大学", "华师"], otherNames: ["华南师大"] },
};

export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "moe", name: "教育部", patterns: [/教育部|教育部教育考试院|neea/i] },
  { id: "gd-edu", name: "广东省教育厅", patterns: [/广东省?教育厅/i] },
  { id: "gd-eea", name: "广东省教育考试院", patterns: [/广东省?教育考试院/i] },
  { id: "sz-edu", name: "深圳市教育局", patterns: [/深圳市?教育局/i] },
  { id: "gz-edu", name: "广州市教育局", patterns: [/广州市?教育局/i] },
  { id: "sz-zkb", name: "深圳市招生考试办公室", patterns: [/深圳市?招生考试办公室|深圳市?招考办/i] },
  { id: "jyb", name: "中国教育报", patterns: [/中国教育报|中国教育新闻网/i] },
  { id: "scnu", name: "华南师范大学", patterns: [/华南师范|华师/i] },
];

export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "moe", domains: ["moe.gov.cn", "neea.edu.cn"] },
  { entityId: "gd-edu", domains: ["edu.gd.gov.cn"] },
  { entityId: "gd-eea", domains: ["eea.gd.gov.cn"] },
  { entityId: "sz-edu", domains: ["szeb.sz.gov.cn"] },
  { entityId: "gz-edu", domains: ["jyj.gz.gov.cn"] },
  { entityId: "sz-zkb", domains: ["szzkb.com"] },
  { entityId: "jyb", domains: ["jyb.cn"] },
];

export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [];
