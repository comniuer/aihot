// 住房租赁行业的分类体系：类别、标签词表、企业（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

export const CATEGORIES = [
  { key: "policy", label: "政策与标准", feedLabel: "政策与标准", section: "政策与标准", guide: "中央和地方政府发布的住房租赁政策、法规、标准和规范文件。包括保租房管理办法、租金监管、租购同权、保障性租赁住房政策等。" },
  { key: "market", label: "市场与资本", feedLabel: "市场与资本", section: "市场与资本", guide: "住房租赁领域的投融资、收并购、REITs发行、上市和资本市场动态。融资消息归此类，而非行业动态。" },
  { key: "operation", label: "运营与数据", feedLabel: "运营与数据", section: "运营与数据", guide: "租金水平、入住率、供需数据、市场规模报告和运营指标。有具体数据的研究报告归此类。" },
  { key: "land", label: "土地与项目", feedLabel: "土地与项目", section: "土地与项目", guide: "租赁住房用地成交、项目签约、开工和开业信息。包括集租房用地、保租房项目和人才公寓建设进展。" },
  { key: "tech", label: "技术与产品", feedLabel: "技术与产品", section: "技术与产品", guide: "数字化运营平台、智能家居、租房产品迭代和技术应用。企业发布新功能或数字化系统归此类。" },
  { key: "case", label: "案例与观点", section: "案例与观点", guide: "深度案例分析、运营复盘、行业观点和专家访谈。重点是分析和判断，而非具体事件报道。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "policy", tag: "政策法规", unit: "项新政策" };

export const PLAIN_TERMS: readonly string[] = ["reits", "json", "ipo", "ceo", "tods"];

export const ITEM_TYPES = ["policy_release", "market_event", "data_report", "land_transaction", "product_update", "case_study", "opinion_analysis"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

export const CATEGORY_TAGS = [
  "政策法规", "市场资本", "运营数据", "土地项目", "技术产品", "案例观点", "行业动态", "其他",
] as const;

export const TOPIC_TAGS = [
  "上海", "杭州", "南京", "成都", "武汉", "长沙", "合肥", "无锡", "常州",
  "长租公寓", "保租房", "人才公寓", "集租房", "青年公寓",
  "REITs", "收并购", "租金", "入住率", "土地供应", "数字化",
] as const;

export const ENTITY_TAGS = ["万科泊寓", "龙湖冠寓", "自如", "相寓", "魔方公寓", "建信住房", "招商蛇口", "旭辉瓴寓", "贝壳", "克而瑞"] as const;

export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "政策": "政策法规", "法规": "政策法规", "监管": "政策法规", "标准": "政策法规", "办法": "政策法规", "通知": "政策法规",
  "融资": "市场资本", "投资": "市场资本", "收购": "市场资本", "并购": "市场资本", "上市": "市场资本",
  "租金报告": "运营数据", "数据": "运营数据", "报告": "运营数据", "入住率": "运营数据",
  "用地": "土地项目", "成交": "土地项目", "开工": "土地项目", "开业": "土地项目", "签约": "土地项目",
  "产品": "技术产品", "系统": "技术产品", "平台": "技术产品", "智能": "技术产品",
  "案例": "案例观点", "复盘": "案例观点", "观点": "案例观点", "访谈": "案例观点", "分析": "案例观点",
  "行业": "行业动态", "动态": "行业动态",
};

// ── 企业与主体 ──────────────────────────────────────────────────────────────────────────

export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  "vanke-bohu": { name: "万科泊寓", displayTag: "万科泊寓", aliases: ["泊寓", "万科"], otherNames: ["万科物流"] },
  "longfor-guanyu": { name: "龙湖冠寓", displayTag: "龙湖冠寓", aliases: ["冠寓", "龙湖"], otherNames: ["龙湖集团"] },
  "ziroom": { name: "自如", displayTag: "自如", aliases: ["自如", "Ziroom"], otherNames: ["自如集团"] },
  "xiangyu": { name: "相寓", displayTag: "相寓", aliases: ["相寓"], otherNames: ["我爱我家"] },
  "mofang": { name: "魔方公寓", displayTag: "魔方公寓", aliases: ["魔方", "魔方生活"], otherNames: ["魔方生活服务集团"] },
  "jianxin": { name: "建信住房", displayTag: "建信住房", aliases: ["建信住房"], otherNames: ["建设银行住房租赁"] },
  "cmg": { name: "招商蛇口", displayTag: "招商蛇口", aliases: ["招商蛇口", "招商"], otherNames: ["招商局蛇口工业区"] },
  "cifi-lingyu": { name: "旭辉瓴寓", displayTag: "旭辉瓴寓", aliases: ["瓴寓", "旭辉"], otherNames: ["旭辉领寓"] },
  "ke": { name: "贝壳", displayTag: "贝壳", aliases: ["贝壳", "贝壳找房"], otherNames: ["贝壳研究院", "链家"] },
  "cric": { name: "克而瑞", displayTag: "克而瑞", aliases: ["克而瑞", "CRIC"], otherNames: ["易居企业集团"] },
};

export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "vanke-bohu", name: "万科泊寓", patterns: [/泊寓|万科.*公寓/i, /bohuyu/i] },
  { id: "longfor-guanyu", name: "龙湖冠寓", patterns: [/冠寓|龙湖.*公寓/i, /longfor/i] },
  { id: "ziroom", name: "自如", patterns: [/自如|ziroom/i] },
  { id: "xiangyu", name: "相寓", patterns: [/相寓/i] },
  { id: "mofang", name: "魔方公寓", patterns: [/魔方.*公寓|魔方生活/i, /mofang/i] },
  { id: "jianxin", name: "建信住房", patterns: [/建信住房|建信.*租赁/i] },
  { id: "cmg", name: "招商蛇口", patterns: [/招商蛇口|招商.*租赁/i] },
  { id: "cifi-lingyu", name: "旭辉瓴寓", patterns: [/瓴寓|旭辉.*公寓/i, /领寓/i] },
  { id: "ke", name: "贝壳", patterns: [/贝壳|链家|ke\.com/i] },
  { id: "cric", name: "克而瑞", patterns: [/克而瑞|cric/i] },
];

export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "vanke-bohu", domains: ["bohuyu.com"] },
  { entityId: "longfor-guanyu", domains: ["longfor.com"] },
  { entityId: "ziroom", domains: ["ziroom.com"] },
  { entityId: "ke", domains: ["research.ke.com"] },
];

export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [];
