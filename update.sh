#!/bin/bash
# 住房租赁观察 - 一键更新脚本
# 用法: ./update.sh          # 普通更新（保留数据）
#       ./update.sh --clean  # 删库重建（清除所有数据，重新导入信源）
# 功能: 释放内存 → 拉取代码 → 检查Swap → 构建 → 启动 → 验证

CLEAN_MODE=false
[ "$1" = "--clean" ] && CLEAN_MODE=true

set -e
cd /home/martin/agent/aihot

echo "===== 1. 停容器、释放内存 ====="
if [ "$CLEAN_MODE" = true ]; then
    echo "（--clean 模式：删除数据库，重新导入信源）"
    docker compose down -v 2>/dev/null || true
else
    docker compose down 2>/dev/null || true
fi
docker image prune -f 2>/dev/null || true
echo "当前内存: $(free -h | awk '/Mem:/ {print "总量:"$2" 已用:"$3" 可用:"$7}')"

echo ""
echo "===== 2. 拉取最新代码 ====="
git pull origin main || {
    echo "⚠️ git pull 失败（GitHub 访问超时，阿里云 ECS 常见）"
    echo "请先在本地 git push 到 GitHub，再在 ECS 手动执行:"
    echo "  git fetch origin && git reset --hard origin/main"
    echo "成功后重新运行 ./update.sh"
    exit 1
}

echo ""
echo "===== 3. 检查 Swap ====="
SWAP_TOTAL=$(free -m | awk '/Swap:/ {print $2}')
if [ "$SWAP_TOTAL" -lt 1000 ] 2>/dev/null || [ -z "$SWAP_TOTAL" ]; then
    echo "Swap 不足，正在创建 2G..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile 2>/dev/null || true
    # 写入 fstab 持久化（重启不丢失）
    grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✓ Swap 已启用: $(free -h | awk '/Swap:/ {print $2}')"
else
    echo "✓ Swap 正常: ${SWAP_TOTAL}MB"
fi

echo ""
echo "===== 4. 构建镜像 ====="
docker compose build --build-arg NPM_REGISTRY=https://registry.npmmirror.com

echo ""
echo "===== 5. 启动容器 ====="
docker compose up -d

echo ""
echo "===== 6. 等待服务就绪 ====="
for i in $(seq 1 15); do
    sleep 2
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo "000")
    if [ "$HTTP" = "200" ]; then
        echo "✓ 服务就绪 (${i}x2秒)"
        break
    fi
    echo "  等待中... HTTP=$HTTP (${i}/15)"
done

echo ""
echo "===== 7. 验证 ====="
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || docker compose ps
echo ""
TITLE=$(curl -s https://aihot.comniuer.cn 2>/dev/null | grep -o '<title>[^<]*</title>' || echo "无法访问")
echo "页面标题: $TITLE"
echo ""
echo "===== 更新完成 ====="
echo "访问: https://aihot.comniuer.cn"
echo "后台: https://aihot.comniuer.cn/admin"
