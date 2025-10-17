# MCP Server 2.0

LuckDB的Model Context Protocol (MCP)服务器实现，版本2.0引入了现代化的架构设计。

## 特性

- 🚀 **高性能缓存系统** - 内存缓存支持，可配置TTL
- 📊 **完整的监控和指标** - 实时性能监控和统计
- 🛡️ **智能限流保护** - Token桶算法，按用户限流
- 🔌 **灵活的中间件架构** - 易于扩展和定制
- 📝 **详细的日志记录** - 完整的请求追踪
- 🔄 **自动恢复机制** - Panic捕获和优雅降级
- ⚙️ **灵活的配置系统** - 支持动态配置
- 📈 **RESTful监控API** - 实时查看服务器状态

## 快速开始

### 1. 基本配置

在 `config.yaml` 中添加MCP配置：

```yaml
mcp:
  default_user_id: "default-user"
  
  http:
    enabled: true
    port: 3001
    host: "0.0.0.0"
    cors_origins:
      - "*"
  
  features:
    enable_tools: true
    enable_resources: true
    enable_prompts: true
  
  cache:
    enabled: true
    default_ttl: 5m
    cleanup_interval: 10m
    cacheable_tools:
      list_spaces: 2m
      get_space: 5m
      list_bases: 2m
      get_base: 5m
  
  monitoring:
    enabled: true
    enable_metrics: true
    slow_query_threshold: 1s
  
  rate_limit:
    enabled: true
    requests_per_minute: 100
    burst_size: 10
    cleanup_interval: 1m
  
  performance:
    max_concurrent_calls: 100
    call_timeout: 30s
  
  logging:
    enabled: true
    log_tool_calls: true
```

### 2. 启动服务器

#### HTTP模式（推荐）

```bash
luckdb mcp serve --transport=http
```

#### Stdio模式（Claude Desktop）

```bash
luckdb mcp serve --transport=stdio
```

### 3. 访问监控API

#### 健康检查
```bash
curl http://localhost:3001/mcp/ping
```

#### 查看统计信息
```bash
curl http://localhost:3001/mcp/stats
```

响应示例：
```json
{
  "status": "ok",
  "data": {
    "version": "2.0.0",
    "transport": "http",
    "tools": {
      "total": 35,
      "registered": ["list_spaces", "get_space", ...]
    },
    "cache": {
      "entries": 150,
      "hits": 1250,
      "misses": 350,
      "hit_rate": 78.125
    },
    "rate_limit": {
      "active_users": 15
    },
    "metrics": {
      "total_requests": 1600,
      "total_errors": 25,
      "error_rate": 1.56,
      "uptime": "2h30m15s"
    },
    "top_tools": [...],
    "top_users": [...],
    "slowest_tools": [...]
  }
}
```

#### 查看详细指标
```bash
curl http://localhost:3001/mcp/metrics
```

## 架构

### 目录结构

```
server/internal/mcp/
├── cache/              # 缓存系统
│   └── cache.go
├── metrics/            # 指标收集
│   └── metrics.go
├── middleware/         # 中间件
│   ├── cache.go
│   ├── context.go
│   ├── middleware.go
│   ├── monitoring.go
│   └── ratelimit.go
├── registry/           # 工具注册器
│   └── registry.go
├── tools/              # MCP工具实现
├── resources/          # MCP资源
├── prompts/            # MCP提示
├── commands/           # CLI命令
├── transport/          # 传输层
├── auth.go             # 认证
├── config.go           # 配置
├── context.go          # 上下文
├── server.go           # 主服务器
└── README.md
```

### 中间件链

请求处理流程：

```
Client Request
    ↓
MCP Handler
    ↓
Middleware Chain:
  1. Recovery       ← Panic捕获
  2. Logging        ← 日志记录
  3. Validation     ← 参数验证
  4. RateLimit      ← 限流控制
  5. Monitoring     ← 指标收集
  6. Timing         ← 性能监控
  7. Cache          ← 缓存处理
    ↓
Tool Handler
    ↓
Service Layer
    ↓
Response
```

## 核心组件

### 1. 缓存系统 (cache/)

**特性**：
- 内存缓存实现
- 自动过期清理
- 可配置TTL
- 线程安全
- 缓存统计

**使用示例**：
```go
cache := cache.NewMemoryCache(10 * time.Minute)
cache.Set(ctx, "key", value, 5*time.Minute)
value, found := cache.Get(ctx, "key")
```

### 2. 指标收集 (metrics/)

**特性**：
- 工具调用统计
- 用户使用统计
- 性能指标
- Top N查询
- 实时统计

**使用示例**：
```go
collector := metrics.NewCollector()
collector.RecordToolCall("list_spaces", "user123", 100*time.Millisecond, true)
summary := collector.GetSummary()
topTools := collector.GetTopTools(10)
```

### 3. 中间件系统 (middleware/)

**特性**：
- 灵活的中间件链
- 7个内置中间件
- 易于扩展
- 可配置顺序

**创建自定义中间件**：
```go
func CustomMiddleware() middleware.Middleware {
    return middleware.MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next middleware.ToolHandler) (*mcp.CallToolResult, error) {
        // 前置处理
        logger.Info("Before")
        
        // 调用下一个
        result, err := next(ctx, req)
        
        // 后置处理
        logger.Info("After")
        
        return result, err
    })
}
```

### 4. 工具注册器 (registry/)

**特性**：
- 统一的工具管理
- 线程安全
- 批量注册
- 构建器模式

**使用示例**：
```go
// 使用构建器
tool := registry.NewToolBuilder("my_tool").
    WithDescription("My custom tool").
    WithStringArg("name", mcp.Required()).
    WithHandler(myHandler).
    Build()

registry.Register(tool)
```

## 配置选项

### 缓存配置

```yaml
cache:
  enabled: true                    # 启用缓存
  default_ttl: 5m                  # 默认TTL
  cleanup_interval: 10m            # 清理间隔
  cacheable_tools:                 # 可缓存工具
    tool_name: ttl
```

### 监控配置

```yaml
monitoring:
  enabled: true                    # 启用监控
  enable_metrics: true             # 启用指标收集
  slow_query_threshold: 1s         # 慢查询阈值
```

### 限流配置

```yaml
rate_limit:
  enabled: true                    # 启用限流
  requests_per_minute: 100         # 每分钟请求数
  burst_size: 10                   # 突发大小
  cleanup_interval: 1m             # 清理间隔
```

### 性能配置

```yaml
performance:
  max_concurrent_calls: 100        # 最大并发
  call_timeout: 30s                # 调用超时
```

## API端点

| 端点 | 方法 | 描述 |
|-----|------|------|
| `/mcp/ping` | GET | 健康检查 |
| `/mcp/stats` | GET | 完整统计信息 |
| `/mcp/metrics` | GET | 详细指标数据 |
| `/mcp` | POST | MCP JSON-RPC |
| `/mcp/sse` | GET | SSE连接 |
| `/mcp/sse` | POST | SSE消息 |

## 最佳实践

### 1. 缓存策略

✅ **推荐**：
- 只缓存幂等的读操作
- 设置合理的TTL（不要太长）
- 监控缓存命中率

❌ **避免**：
- 缓存写操作
- 缓存用户敏感数据
- 设置过长的TTL

### 2. 限流设置

✅ **推荐**：
- 根据服务器容量设置
- 为不同场景设置不同限制
- 监控限流触发情况

### 3. 监控告警

✅ **推荐**：
- 定期查看指标数据
- 设置慢查询阈值
- 监控错误率
- 追踪资源使用

### 4. 中间件顺序

推荐的中间件顺序（已默认配置）：
1. Recovery（最外层，捕获panic）
2. Logging（记录所有请求）
3. Validation（早期验证）
4. RateLimit（保护资源）
5. Monitoring（收集指标）
6. Timing（性能监控）
7. Cache（最内层，接近数据）

## 性能优化建议

1. **启用缓存** - 对频繁访问的数据
2. **合理限流** - 保护服务不被压垮
3. **监控慢查询** - 及时发现性能问题
4. **定期清理** - 避免内存泄漏
5. **调整并发数** - 根据服务器能力

## 故障排查

### 缓存不生效

1. 检查配置：`cache.enabled = true`
2. 检查工具是否在 `cacheable_tools` 中
3. 查看缓存统计：`GET /mcp/stats`

### 请求被限流

1. 检查限流配置
2. 查看限流统计：`GET /mcp/stats`
3. 调整 `requests_per_minute` 和 `burst_size`

### 性能问题

1. 查看慢查询日志
2. 检查 `/mcp/stats` 中的 `slowest_tools`
3. 调整 `slow_query_threshold`
4. 增加缓存TTL

## 升级指南

从MCP 1.0升级到2.0：

1. **向后兼容** - 无需修改现有代码
2. **添加配置** - 在config.yaml中添加新配置项
3. **重启服务** - 新功能自动生效
4. **监控检查** - 访问 `/mcp/stats` 验证

## 开发指南

### 添加新工具

```go
func RegisterMyTools(srv *server.MCPServer, service MyService) error {
    return srv.AddTool(
        mcp.NewTool(
            "my_tool",
            mcp.WithDescription("My tool description"),
            mcp.WithString("arg1", mcp.Required()),
        ),
        func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
            // 实现逻辑
            return tools.ToToolResult(data, err)
        },
    )
}
```

### 添加新中间件

```go
func MyMiddleware() middleware.Middleware {
    return middleware.MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next middleware.ToolHandler) (*mcp.CallToolResult, error) {
        // 实现逻辑
        return next(ctx, req)
    })
}
```

## 测试

```bash
# 运行测试
go test ./server/internal/mcp/...

# 性能测试
go test -bench=. ./server/internal/mcp/...
```

## 相关文档

- [MCP协议规范](https://spec.modelcontextprotocol.io/)
- [优化报告](/book/ai-reports/optimization/2025-10-17_optimize_mcp_server_architecture.md)
- [配置参考](/server/config.yaml.example)

## 许可证

MIT License

## 贡献

欢迎贡献！请遵循项目的代码规范。

## 支持

如有问题，请提交Issue或联系维护者。

