#!/usr/bin/env bash
# AIHOT 模型消费明细查询（只读，不动任何数据）
# 用法: ./usage.sh [趋势天数=14] [明细条数=20]
# 数据来源: receipt_attempts 表（AIHOT 每次付费调用都会记账，含 token/费用/耗时/错误）

set -euo pipefail
cd "$(dirname "$0")"

DAYS="${1:-14}"
LIMIT="${2:-20}"

run_sql() {
  docker compose exec -T db psql -U aihot -d aihot -v ON_ERROR_STOP=1 -P pager=off -c "$1"
}

echo "==================== ① 消费总览（按时段） ===================="
run_sql "
SELECT '今日'  AS 统计范围,
       count(*) AS 调用次数,
       count(*) FILTER (WHERE status='failed') AS 失败,
       coalesce(sum((usage->>'prompt_tokens')::bigint),0) AS 输入tokens,
       coalesce(sum((usage->>'completion_tokens')::bigint),0) AS 输出tokens,
       coalesce(round(sum(cost)::numeric,4),0) AS 费用
FROM receipt_attempts
WHERE started_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai'
UNION ALL
SELECT '近7天', count(*), count(*) FILTER (WHERE status='failed'),
       coalesce(sum((usage->>'prompt_tokens')::bigint),0),
       coalesce(sum((usage->>'completion_tokens')::bigint),0),
       coalesce(round(sum(cost)::numeric,4),0)
FROM receipt_attempts
WHERE started_at >= now() - interval '7 days'
UNION ALL
SELECT '本月', count(*), count(*) FILTER (WHERE status='failed'),
       coalesce(sum((usage->>'prompt_tokens')::bigint),0),
       coalesce(sum((usage->>'completion_tokens')::bigint),0),
       coalesce(round(sum(cost)::numeric,4),0)
FROM receipt_attempts
WHERE started_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai'
UNION ALL
SELECT '累计', count(*), count(*) FILTER (WHERE status='failed'),
       coalesce(sum((usage->>'prompt_tokens')::bigint),0),
       coalesce(sum((usage->>'completion_tokens')::bigint),0),
       coalesce(round(sum(cost)::numeric,4),0)
FROM receipt_attempts;"

echo "==================== ② 本月各服务×模型明细 ===================="
run_sql "
SELECT service AS 服务, coalesce(model,'-') AS 模型,
       count(*) AS 调用, count(*) FILTER (WHERE status='failed') AS 失败,
       coalesce(sum((usage->>'prompt_tokens')::bigint),0) AS 输入tokens,
       coalesce(sum((usage->>'completion_tokens')::bigint),0) AS 输出tokens,
       coalesce(round(sum(cost)::numeric,4),0) AS 费用
FROM receipt_attempts
WHERE started_at >= date_trunc('month', now() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai'
GROUP BY 1,2
ORDER BY 调用 DESC;"

echo "==================== ③ 近 ${DAYS} 天每日趋势 ===================="
run_sql "
SELECT to_char(d.day, 'YYYY-MM-DD') AS 日期,
       count(a.id) AS 调用,
       count(*) FILTER (WHERE a.status='failed') AS 失败,
       coalesce(sum((a.usage->>'prompt_tokens')::bigint),0) AS 输入tokens,
       coalesce(sum((a.usage->>'completion_tokens')::bigint),0) AS 输出tokens,
       coalesce(round(sum(a.cost)::numeric,4),0) AS 费用
FROM generate_series(
       (current_date - (${DAYS}::int - 1))::date,
       current_date,
       interval '1 day') AS d(day)
LEFT JOIN receipt_attempts a
       ON date_trunc('day', a.started_at AT TIME ZONE 'Asia/Shanghai')::date = d.day
GROUP BY d.day ORDER BY d.day;"

echo "==================== ④ 最近 ${LIMIT} 次调用明细 ===================="
run_sql "
SELECT to_char(a.started_at AT TIME ZONE 'Asia/Shanghai','MM-DD HH24:MI') AS 时间,
       a.service AS 服务, coalesce(a.model,'-') AS 模型, r.purpose AS 用途,
       a.status AS 状态,
       coalesce((a.usage->>'prompt_tokens')::bigint,0) AS 输入,
       coalesce((a.usage->>'completion_tokens')::bigint,0) AS 输出,
       coalesce(a.cost::text,'-') AS 费用,
       a.latency_ms AS 耗时ms,
       left(coalesce(a.error,''),50) AS 错误
FROM receipt_attempts a
JOIN receipts r ON r.id = a.receipt_id
ORDER BY a.started_at DESC
LIMIT ${LIMIT};"

echo "说明: 费用为 AIHOT 回执记录的 actual/estimated 成本，与阿里云/DeepSeek 官方账单可能有微小出入；"
echo "      阿里云权威用量看百炼控制台-业务观测，DeepSeek 看 platform.deepseek.com/usage。"
