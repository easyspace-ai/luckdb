#!/bin/bash

# LuckDB MCP Server 启动脚本 (用于 Cursor)
# 这个脚本确保 MCP 服务器以正确的配置启动

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🚀 启动 LuckDB MCP Server for Cursor..."
echo "📁 项目根目录: $PROJECT_ROOT"

# 检查 MCP 服务器二进制文件是否存在
MCP_SERVER_BIN="$PROJECT_ROOT/server/bin/mcp-server"
if [ ! -f "$MCP_SERVER_BIN" ]; then
    echo "❌ MCP 服务器二进制文件不存在: $MCP_SERVER_BIN"
    echo "🔨 正在构建 MCP 服务器..."
    
    cd "$PROJECT_ROOT/server"
    go build -o bin/mcp-server ./cmd/mcp-server
    
    if [ $? -eq 0 ]; then
        echo "✅ MCP 服务器构建成功"
    else
        echo "❌ MCP 服务器构建失败"
        exit 1
    fi
fi

# 检查配置文件是否存在
CONFIG_FILE="$PROJECT_ROOT/server/config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在: $CONFIG_FILE"
    echo "📋 使用默认配置..."
    
    # 创建默认配置
    cat > "$CONFIG_FILE" << EOF
# LuckDB MCP Server 配置
server:
  host: "0.0.0.0"
  port: 8081
  read_timeout: 30s
  write_timeout: 30s
  idle_timeout: 120s
  enable_cors: true
  enable_debug: false

mcp:
  enabled: true
  server:
    host: "0.0.0.0"
    port: 8081
    read_timeout: 30s
    write_timeout: 30s
    idle_timeout: 120s
    enable_cors: true
    enable_debug: false
  auth:
    api_key:
      enabled: true
      key_length: 32
      secret_length: 64
      default_ttl: 8760h
      max_ttl: 87600h
      header: "X-MCP-API-Key"
      format: "key_id:key_secret"
    jwt:
      enabled: true
      header: "Authorization"
      prefix: "Bearer "
      secret: "your-secret-key"
      issuer: "luckdb-mcp"
      audience: "mcp-client"
      access_token_ttl: 1h
      refresh_token_ttl: 24h
    session:
      enabled: true
      cookie_name: "mcp_session"
      secure: true
      http_only: true
      same_site: "strict"
      max_age: 24h
  tools:
    enabled: true
    query_records:
      enabled: true
      max_limit: 1000
      default_limit: 100
    search_records:
      enabled: true
      max_limit: 500
      default_limit: 50
    create_record:
      enabled: true
    update_record:
      enabled: true
    delete_record:
      enabled: true
    get_table_schema:
      enabled: true
    list_tables:
      enabled: true
      max_limit: 1000
      default_limit: 100
  resources:
    enabled: true
    table_schema:
      enabled: true
    table_data:
      enabled: true
    table_metadata:
      enabled: true
  prompts:
    enabled: true
    analyze_data:
      enabled: true
    query_data:
      enabled: true
    analyze_schema:
      enabled: true
  rate_limit:
    enabled: true
    requests_per_minute: 100
    burst_size: 20
  security:
    enabled: true
    max_request_size: 1048576
    timeout: 30s
EOF
    echo "✅ 默认配置文件已创建"
fi

# 设置环境变量
export LUCKDB_CONFIG_PATH="$CONFIG_FILE"
export LUCKDB_LOG_LEVEL="info"

echo "🔧 配置信息:"
echo "   - 配置文件: $CONFIG_FILE"
echo "   - 服务器二进制: $MCP_SERVER_BIN"
echo "   - 工作目录: $PROJECT_ROOT"

# 启动 MCP 服务器
echo "🎯 启动 MCP 服务器..."
cd "$PROJECT_ROOT"

# 使用 stdio 模式启动，这是 MCP 客户端期望的
echo "🎯 启动 MCP 服务器 (stdio 模式)..."
exec "$MCP_SERVER_BIN" --stdio
