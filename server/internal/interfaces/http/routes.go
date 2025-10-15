package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/easyspace-ai/luckdb/server/internal/container"
	"github.com/easyspace-ai/luckdb/server/internal/mcp"
)

// SetupRoutes 设置所有API路由
func SetupRoutes(router *gin.Engine, cont *container.Container) {
	// API v1路由组
	v1 := router.Group("/api/v1")

	// 监控端点（无需认证）
	setupMonitoringRoutes(v1, cont)

	// 认证相关路由（无需JWT中间件）
	setupAuthRoutes(v1, cont)

	// 需要JWT认证的路由组
	authRequired := v1.Group("")
	authRequired.Use(JWTAuthMiddleware(cont.AuthService()))
	{
		// 用户相关路由
		setupUserRoutes(authRequired, cont)

		// 用户配置路由
		setupUserConfigRoutes(authRequired, cont)

		// 空间相关路由
		setupSpaceRoutes(authRequired, cont)

		// Base相关路由
		setupBaseRoutes(authRequired, cont)

		// 表格相关路由
		setupTableRoutes(authRequired, cont)

		// 字段相关路由
		setupFieldRoutes(authRequired, cont)

		// 记录相关路由
		setupRecordRoutes(authRequired, cont)

		// 视图相关路由
		setupViewRoutes(authRequired, cont)

		// MCP Token管理路由 ✨
		setupMCPTokenRoutes(authRequired, cont)
	}

	// WebSocket 路由（需要认证）✨
	setupWebSocketRoutes(router, cont)

	// MCP路由（集成到主服务）
	setupMCPRoutes(router, cont)
}

// setupMCPRoutes 设置MCP路由
func setupMCPRoutes(router *gin.Engine, cont *container.Container) {
	// 获取MCP服务器实例（如果存在）
	mcpServerInterface := cont.MCPServer()
	if mcpServerInterface == nil {
		// MCP未启用，跳过路由注册
		return
	}

	// 类型断言
	mcpServer, ok := mcpServerInterface.(*mcp.Server)
	if !ok {
		return
	}

	handler := NewMCPHandler(mcpServer)

	// MCP路由组
	mcp := router.Group("/mcp")
	{
		// HTTP JSON-RPC endpoint
		mcp.POST("", handler.HandleHTTPRequest)
		mcp.POST("/messages", handler.HandleHTTPRequest) // 兼容路径

		// SSE endpoint
		mcp.GET("/sse", handler.HandleSSE)
		mcp.POST("/sse", handler.HandleSSEMessage)

		// 健康检查
		mcp.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"server":  "EasyDB MCP Server",
				"version": "2.0.0",
			})
		})
	}
}

// setupUserConfigRoutes 设置用户配置路由
func setupUserConfigRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewUserConfigHandler(cont.UserConfigService())

	// 用户配置路由
	userConfig := rg.Group("/user")
	{
		userConfig.GET("/config", handler.GetUserConfig)
		userConfig.PUT("/config", handler.UpdateUserConfig)
	}
}

// setupSpaceRoutes 设置空间路由
func setupSpaceRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewSpaceHandler(cont.SpaceService())
	collabHandler := NewCollaboratorHandler(cont.CollaboratorService())

	// 空间路由
	spaces := rg.Group("/spaces")
	{
		spaces.POST("", handler.CreateSpace)
		spaces.GET("", handler.ListSpaces)
		spaces.GET("/:spaceId", handler.GetSpace)
		spaces.PATCH("/:spaceId", handler.UpdateSpace) // ✅ 部分更新使用PATCH
		spaces.DELETE("/:spaceId", handler.DeleteSpace)

		// Space协作者管理 ✨
		spaces.GET("/:spaceId/collaborators", collabHandler.ListSpaceCollaborators)
		spaces.POST("/:spaceId/collaborators", collabHandler.AddSpaceCollaborator)
		spaces.PATCH("/:spaceId/collaborators/:collaboratorId", collabHandler.UpdateSpaceCollaborator)
		spaces.DELETE("/:spaceId/collaborators/:collaboratorId", collabHandler.RemoveSpaceCollaborator)
	}
}

// setupBaseRoutes 设置Base路由（对齐原版）
func setupBaseRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewBaseHandler(cont.BaseService(), cont.TableService())
	collabHandler := NewCollaboratorHandler(cont.CollaboratorService())

	// Space下的Base
	spaces := rg.Group("/spaces")
	{
		spaces.POST("/:spaceId/bases", handler.CreateBase)
		spaces.GET("/:spaceId/bases", handler.ListBases)
	}

	// Base路由
	bases := rg.Group("/bases")
	{
		bases.GET("/:baseId", handler.GetBase)
		bases.PATCH("/:baseId", handler.UpdateBase)
		bases.DELETE("/:baseId", handler.DeleteBase)

		// Base子资源
		// Note: GET /:baseId/tables 由TableHandler处理（避免重复注册）
		bases.POST("/:baseId/duplicate", handler.DuplicateBase)
		bases.GET("/:baseId/permission", handler.GetBasePermission)

		// Base协作者管理 ✨
		bases.GET("/:baseId/collaborators", collabHandler.ListBaseCollaborators)
		bases.POST("/:baseId/collaborators", collabHandler.AddBaseCollaborator)
		bases.PATCH("/:baseId/collaborators/:collaboratorId", collabHandler.UpdateBaseCollaborator)
		bases.DELETE("/:baseId/collaborators/:collaboratorId", collabHandler.RemoveBaseCollaborator)
	}
}

// setupTableRoutes 设置表格路由
func setupTableRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewTableHandler(cont.TableService())

	// Base下的表格
	bases := rg.Group("/bases")
	{
		bases.GET("/:baseId/tables", handler.ListTables)
		bases.POST("/:baseId/tables", handler.CreateTable)
	}

	// 表格路由
	tables := rg.Group("/tables")
	{
		tables.GET("/:tableId", handler.GetTable)
		tables.PATCH("/:tableId", handler.UpdateTable) // ✅ 部分更新使用PATCH
		tables.DELETE("/:tableId", handler.DeleteTable)

		// 表管理路由
		tables.PUT("/:tableId/rename", handler.RenameTable)          // 重命名表
		tables.POST("/:tableId/duplicate", handler.DuplicateTable)   // 复制表
		tables.GET("/:tableId/usage", handler.GetTableUsage)         // 获取表用量
		tables.GET("/:tableId/menu", handler.GetTableManagementMenu) // 获取表管理菜单
	}
}

// setupFieldRoutes 设置字段路由
func setupFieldRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewFieldHandler(cont.FieldService())

	// 表格下的字段
	tables := rg.Group("/tables")
	{
		tables.GET("/:tableId/fields", handler.ListFields)
		tables.POST("/:tableId/fields", handler.CreateField)
	}

	// 字段路由
	fields := rg.Group("/fields")
	{
		fields.GET("/:fieldId", handler.GetField)
		fields.PATCH("/:fieldId", handler.UpdateField) // ✅ 部分更新使用PATCH
		fields.DELETE("/:fieldId", handler.DeleteField)
	}
}

// setupRecordRoutes 设置记录路由
func setupRecordRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewRecordHandler(
		cont.RecordService(),
		cont.FieldService(),       // ✅ 添加
		cont.CalculationService(), // ✅ 添加
		cont.RecordRepository(),   // ✅ 添加
	)

	// 表格下的记录（对齐 Teable 架构：所有记录操作都需要 tableId）
	tables := rg.Group("/tables")
	{
		// 列表和创建
		tables.GET("/:tableId/records", handler.ListRecords)
		tables.POST("/:tableId/records", handler.CreateRecord)
		tables.POST("/:tableId/records/batch", handler.BatchCreateRecords)

		// 单条记录操作（需要 tableId 和 recordId）
		tables.GET("/:tableId/records/:recordId", handler.GetRecord)
		tables.PATCH("/:tableId/records/:recordId", handler.UpdateRecord) // ✅ 对齐 Teable
		tables.DELETE("/:tableId/records/:recordId", handler.DeleteRecord)

		// 批量操作
		tables.PATCH("/:tableId/records/batch", handler.BatchUpdateRecords)
		tables.DELETE("/:tableId/records/batch", handler.BatchDeleteRecords)
	}

	// 记录路由（保留旧路由以兼容，但标记为废弃）
	// ⚠️ 废弃：建议使用 /api/v1/tables/:tableId/records/:recordId
	records := rg.Group("/records")
	{
		records.GET("/:recordId", handler.GetRecord)
		records.PATCH("/:recordId", handler.UpdateRecord)
		records.DELETE("/:recordId", handler.DeleteRecord)
		records.PATCH("/batch", handler.BatchUpdateRecords)
		records.DELETE("/batch", handler.BatchDeleteRecords)
	}
}

// setupUserRoutes 设置用户路由
func setupUserRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewUserHandler(cont.UserService())

	users := rg.Group("/users")
	{
		users.POST("", handler.CreateUser)                   // 创建用户
		users.GET("/:id", handler.GetUser)                   // 获取用户信息
		users.PATCH("/:id", handler.UpdateUser)              // ✅ 部分更新使用PATCH
		users.DELETE("/:id", handler.DeleteUser)             // 删除用户
		users.GET("", handler.ListUsers)                     // 用户列表
		users.PATCH("/:id/password", handler.ChangePassword) // ✅ 修改密码用PATCH
	}
}

// setupAuthRoutes 设置认证路由
func setupAuthRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewAuthHandler(cont.AuthService())

	auth := rg.Group("/auth")
	{
		auth.POST("/register", handler.Register)    // 注册
		auth.POST("/login", handler.Login)          // 登录
		auth.POST("/logout", handler.Logout)        // 登出
		auth.POST("/refresh", handler.RefreshToken) // 刷新Token
		auth.GET("/me", handler.GetCurrentUser)     // 获取当前用户信息
	}
}

// setupViewRoutes 设置视图路由
func setupViewRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewViewHandler(cont.ViewService())

	// 表格下的视图
	tables := rg.Group("/tables")
	{
		tables.GET("/:tableId/views", handler.ListViews)        // 获取表格的所有视图
		tables.POST("/:tableId/views", handler.CreateView)      // 创建视图
		tables.GET("/:tableId/views/count", handler.CountViews) // 统计视图数量
	}

	// 视图路由
	views := rg.Group("/views")
	{
		// 基本操作
		views.GET("/:viewId", handler.GetView)       // 获取视图详情
		views.PATCH("/:viewId", handler.UpdateView)  // ✅ 部分更新使用PATCH
		views.DELETE("/:viewId", handler.DeleteView) // 删除视图

		// 视图配置（这些是完整替换特定字段，用PATCH更合理）
		views.PATCH("/:viewId/filter", handler.UpdateViewFilter)          // ✅ 更新过滤器
		views.PATCH("/:viewId/sort", handler.UpdateViewSort)              // ✅ 更新排序
		views.PATCH("/:viewId/group", handler.UpdateViewGroup)            // ✅ 更新分组
		views.PATCH("/:viewId/column-meta", handler.UpdateViewColumnMeta) // ✅ 更新列配置
		views.PATCH("/:viewId/options", handler.UpdateViewOptions)        // ✅ 更新选项
		views.PATCH("/:viewId/order", handler.UpdateViewOrder)            // ✅ 更新排序位置

		// 分享功能
		views.POST("/:viewId/enable-share", handler.EnableShare)        // 启用分享
		views.POST("/:viewId/disable-share", handler.DisableShare)      // 禁用分享
		views.POST("/:viewId/refresh-share-id", handler.RefreshShareID) // 刷新分享ID
		views.PATCH("/:viewId/share-meta", handler.UpdateShareMeta)     // ✅ 更新分享元数据

		// 锁定功能
		views.POST("/:viewId/lock", handler.LockView)     // 锁定视图
		views.POST("/:viewId/unlock", handler.UnlockView) // 解锁视图

		// 复制功能
		views.POST("/:viewId/duplicate", handler.DuplicateView) // 复制视图
	}

	// 分享视图访问
	share := rg.Group("/share")
	{
		share.GET("/views/:shareId", handler.GetViewByShareID) // 通过分享ID获取视图
	}
}

// setupMCPTokenRoutes 设置MCP Token管理路由
func setupMCPTokenRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewMCPTokenHandler(cont.MCPTokenService())

	// MCP Token路由
	tokens := rg.Group("/mcp-tokens")
	{
		tokens.POST("", handler.CreateToken)       // 创建Token
		tokens.GET("", handler.ListTokens)         // 列出Token
		tokens.GET("/:id", handler.GetToken)       // 获取Token详情
		tokens.PATCH("/:id", handler.UpdateToken)  // 更新Token
		tokens.DELETE("/:id", handler.DeleteToken) // 删除Token
	}
}

// setupWebSocketRoutes 设置WebSocket路由 ✨
func setupWebSocketRoutes(router *gin.Engine, cont *container.Container) {
	handler := NewWebSocketHandler(cont.WebSocketManager(), cont.AuthService())

	// WebSocket 路由
	router.GET("/ws", handler.HandleWebSocket) // WebSocket 连接入口
}

// setupMonitoringRoutes 设置监控路由
func setupMonitoringRoutes(rg *gin.RouterGroup, cont *container.Container) {
	handler := NewMonitoringHandler(cont.DB())

	monitoring := rg.Group("/monitoring")
	{
		monitoring.GET("/db-stats", handler.GetDBStats)
	}
}
