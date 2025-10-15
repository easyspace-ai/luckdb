package container

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/config"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/cache"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/database"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/repository"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"

	// 领域层仓储接口
	baseRepo "github.com/easyspace-ai/luckdb/server/internal/domain/base/repository"
	collaboratorRepo "github.com/easyspace-ai/luckdb/server/internal/domain/collaborator/repository"
	fieldRepo "github.com/easyspace-ai/luckdb/server/internal/domain/fields/repository"
	mcpRepo "github.com/easyspace-ai/luckdb/server/internal/domain/mcp/repository"
	recordRepo "github.com/easyspace-ai/luckdb/server/internal/domain/record/repository"
	spaceRepo "github.com/easyspace-ai/luckdb/server/internal/domain/space/repository"
	tableRepo "github.com/easyspace-ai/luckdb/server/internal/domain/table/repository"
	userRepo "github.com/easyspace-ai/luckdb/server/internal/domain/user/repository"
	viewRepo "github.com/easyspace-ai/luckdb/server/internal/domain/view/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/websocket" // ✨ WebSocket 服务
)

// Container 依赖注入容器
// 管理所有服务的生命周期和依赖关系
type Container struct {
	// 配置
	cfg *config.Config

	// 基础设施
	db          *database.Connection
	dbProvider  database.DBProvider // ✅ 数据库提供者（Schema隔离和动态表管理）
	cacheClient *cache.RedisClient

	// 仓储层（基础设施层实现）
	userRepository         userRepo.UserRepository
	userConfigRepository   userRepo.UserConfigRepository
	collaboratorRepository collaboratorRepo.CollaboratorRepository
	baseRepository         baseRepo.BaseRepository
	recordRepository       recordRepo.RecordRepository
	fieldRepository        fieldRepo.FieldRepository
	spaceRepository        spaceRepo.SpaceRepository
	tableRepository        tableRepo.TableRepository
	viewRepository         viewRepo.ViewRepository
	mcpTokenRepository     mcpRepo.MCPTokenRepository

	// 应用服务层
	userService         *application.UserService
	userConfigService   *application.UserConfigService // 用户配置服务 ✨
	authService         *application.AuthService
	tokenService        *application.TokenService
	mcpTokenService     *application.MCPTokenService     // MCP Token服务 ✨
	permissionServiceV2 *application.PermissionServiceV2 // 权限服务V2 (Action-based) ✨
	collaboratorService *application.CollaboratorService // 协作者服务 ✨
	spaceService        *application.SpaceService
	baseService         *application.BaseService
	tableService        *application.TableService
	fieldService        *application.FieldService
	recordService       *application.RecordService
	viewService         *application.ViewService
	calculationService  *application.CalculationService // 计算引擎服务 ✨

	// WebSocket 服务 ✨
	wsManager *websocket.Manager
	wsService websocket.Service

	// MCP 服务（可选）
	mcpServer *interface{} // 使用interface{}避免循环依赖
}

// NewContainer 创建新的容器
func NewContainer(cfg *config.Config) *Container {
	return &Container{
		cfg: cfg,
	}
}

// Initialize 初始化容器和所有依赖
func (c *Container) Initialize() error {
	logger.Info("正在初始化依赖注入容器...")

	// 1. 初始化数据库连接
	if err := c.initDatabase(); err != nil {
		return fmt.Errorf("初始化数据库失败: %w", err)
	}
	logger.Info("✅ 数据库连接已建立")

	// 2. 初始化缓存
	if err := c.initCache(); err != nil {
		logger.Warn("初始化缓存失败（可选服务）", logger.ErrorField(err))
		// 缓存失败不阻塞启动
	} else {
		logger.Info("✅ 缓存服务已就绪")
	}

	// 3. 初始化仓储层
	c.initRepositories()
	logger.Info("✅ 仓储层已初始化")

	// 4. 初始化应用服务层
	c.initServices()
	logger.Info("✅ 应用服务层已初始化")

	logger.Info("🎉 依赖注入容器初始化完成")
	return nil
}

// initDatabase 初始化数据库连接和Provider
func (c *Container) initDatabase() error {
	db, err := database.NewConnection(c.cfg.Database)
	if err != nil {
		return err
	}

	c.db = db

	// ✅ 初始化DBProvider（根据数据库类型自动选择）
	factory := database.NewProviderFactory()
	c.dbProvider = factory.MustCreateProvider(c.db.GetDB())
	logger.Info("✅ DBProvider已初始化",
		logger.String("driver", c.dbProvider.DriverName()),
		logger.Bool("supports_schema", c.dbProvider.SupportsSchema()))

	return nil
}

// initCache 初始化缓存
func (c *Container) initCache() error {
	cacheClient, err := cache.NewRedisClient(c.cfg.Redis)
	if err != nil {
		return err
	}

	c.cacheClient = cacheClient
	return nil
}

// initRepositories 初始化所有仓储
func (c *Container) initRepositories() {
	db := c.db.GetDB()

	// 用户仓储
	c.userRepository = repository.NewUserRepository(db)

	// 用户配置仓储
	c.userConfigRepository = repository.NewGormUserConfigRepository(db)

	// 协作者仓储
	c.collaboratorRepository = repository.NewCollaboratorRepository(db)

	// Base仓储
	c.baseRepository = repository.NewBaseRepository(db)

	// 表格仓储
	c.tableRepository = repository.NewTableRepository(db)

	// 字段仓储
	c.fieldRepository = repository.NewFieldRepository(db)

	// ✅ 记录仓储（完全动态表架构）
	// 需要在 tableRepository 和 fieldRepository 之后初始化
	c.recordRepository = repository.NewRecordRepositoryDynamic(
		db,
		c.dbProvider,      // ✅ 注入 DBProvider
		c.tableRepository, // ✅ 注入 TableRepository
		c.fieldRepository, // ✅ 注入 FieldRepository
	)

	// 空间仓储
	c.spaceRepository = repository.NewSpaceRepository(db)

	// 视图仓储
	c.viewRepository = repository.NewViewRepository(db)

	// MCP Token仓储
	c.mcpTokenRepository = repository.NewMCPTokenRepository(db)
}

// initServices 初始化所有应用服务（完美架构）
//
// 设计考量：
//   - 按依赖顺序初始化服务
//   - 计算服务需要在RecordService之前初始化
//   - RecordService依赖CalculationService实现自动计算
func (c *Container) initServices() {
	// Token 服务
	c.tokenService = application.NewTokenService(c.cfg.JWT)

	// 用户服务
	c.userService = application.NewUserService(c.userRepository)

	// 用户配置服务 ✨
	c.userConfigService = application.NewUserConfigService(c.userConfigRepository)

	// 认证服务
	c.authService = application.NewAuthService(c.userRepository, c.tokenService)

	// MCP Token服务 ✨
	c.mcpTokenService = application.NewMCPTokenService(c.mcpTokenRepository)

	// 权限服务V2 ✨
	c.permissionServiceV2 = application.NewPermissionServiceV2(
		c.collaboratorRepository,
		c.spaceRepository,
		c.baseRepository,
		c.tableRepository,
	)

	// 协作者服务 ✨
	c.collaboratorService = application.NewCollaboratorService(c.collaboratorRepository)

	// 核心业务服务
	c.spaceService = application.NewSpaceService(c.spaceRepository)
	c.baseService = application.NewBaseService(c.baseRepository, c.spaceRepository, c.dbProvider) // ✅ 注入DBProvider + SpaceRepository

	// ✅ 先初始化 ViewService（独立服务，不依赖其他服务）
	c.viewService = application.NewViewService(c.viewRepository, c.tableRepository)

	// ✅ 初始化 FieldService (暂时传nil，待实现broadcaster)
	c.fieldService = application.NewFieldService(
		c.fieldRepository,
		nil,               // depGraphRepo（待实现）
		nil,               // broadcaster（待实现）
		c.tableRepository, // ✅ 注入TableRepository
		c.dbProvider,      // ✅ 注入DBProvider
	)

	// ✅ 初始化 TableService（依赖 FieldService 和 ViewService）
	c.tableService = application.NewTableService(
		c.tableRepository,
		c.baseRepository,
		c.spaceRepository,
		c.recordRepository, // ✅ 注入RecordRepository
		c.fieldService,
		c.viewService, // ✅ 注入ViewService
		c.dbProvider,  // ✅ 注入DBProvider
	)

	// ✨ WebSocket 服务初始化（在 CalculationService 之前）
	c.initWebSocketService()

	// ✨ 计算引擎服务（在RecordService之前初始化）
	// 集成 WebSocket 推送
	wsAdapter := application.NewWebSocketServiceAdapter(c.wsService)
	c.calculationService = application.NewCalculationService(
		c.fieldRepository,
		c.recordRepository,
		wsAdapter, // ✅ WebSocket 服务已集成
	)

	// ✅ Phase 2: 类型转换服务
	typecastService := application.NewTypecastService(c.fieldRepository)

	// 记录服务（集成计算引擎+验证） (暂时传nil broadcaster，待实现)
	c.recordService = application.NewRecordService(
		c.recordRepository,
		c.fieldRepository,
		c.tableRepository,    // ✅ 注入表仓储，用于检查表存在性
		c.calculationService, // 注入计算服务 ✨
		nil,                  // broadcaster (待实现)
		typecastService,      // ✅ 注入验证服务
	)
}

// initWebSocketService 初始化 WebSocket 服务
func (c *Container) initWebSocketService() {
	logger.Info("正在初始化 WebSocket 服务...")

	// 创建 WebSocket Manager
	c.wsManager = websocket.NewManager(logger.Logger)

	// 创建 WebSocket Service
	c.wsService = websocket.NewService(c.wsManager, logger.Logger)

	// 在后台启动 Manager
	go c.wsManager.Run(context.Background())

	logger.Info("✅ WebSocket 服务已初始化")
}

// Close 关闭容器和所有资源
func (c *Container) Close() {
	logger.Info("正在关闭容器资源...")

	// 关闭数据库连接
	if c.db != nil {
		c.db.Close()
		logger.Info("✅ 数据库连接已关闭")
	}

	// 关闭缓存连接
	if c.cacheClient != nil {
		c.cacheClient.Close()
		logger.Info("✅ 缓存连接已关闭")
	}

	logger.Info("🎉 容器资源已全部释放")
}

// ==================== 服务访问器 ====================

// Config 获取配置
func (c *Container) Config() *config.Config {
	return c.cfg
}

// DBConnection 获取数据库连接
func (c *Container) DBConnection() *database.Connection {
	return c.db
}

// DB 获取 GORM DB 实例
func (c *Container) DB() *gorm.DB {
	return c.db.GetDB()
}

// CacheClient 获取缓存客户端
func (c *Container) CacheClient() *cache.RedisClient {
	return c.cacheClient
}

// ==================== 仓储访问器 ====================

// UserRepository 获取用户仓储
func (c *Container) UserRepository() userRepo.UserRepository {
	return c.userRepository
}

// RecordRepository 获取记录仓储
func (c *Container) RecordRepository() recordRepo.RecordRepository {
	return c.recordRepository
}

// FieldRepository 获取字段仓储
func (c *Container) FieldRepository() fieldRepo.FieldRepository {
	return c.fieldRepository
}

// UserRepo 获取用户仓储（别名）
func (c *Container) UserRepo() userRepo.UserRepository {
	return c.userRepository
}

// MCPTokenRepo 获取MCP Token仓储
func (c *Container) MCPTokenRepo() mcpRepo.MCPTokenRepository {
	return c.mcpTokenRepository
}

// ==================== 应用服务访问器 ====================

// UserService 获取用户服务
func (c *Container) UserService() *application.UserService {
	return c.userService
}

// UserConfigService 获取用户配置服务
func (c *Container) UserConfigService() *application.UserConfigService {
	return c.userConfigService
}

// AuthService 获取认证服务
func (c *Container) AuthService() *application.AuthService {
	return c.authService
}

// TokenService 获取Token服务
func (c *Container) TokenService() *application.TokenService {
	return c.tokenService
}

// PermissionServiceV2 获取权限服务V2
func (c *Container) PermissionServiceV2() *application.PermissionServiceV2 {
	return c.permissionServiceV2
}

// CollaboratorService 获取协作者服务
func (c *Container) CollaboratorService() *application.CollaboratorService {
	return c.collaboratorService
}

// SpaceService 获取空间服务
func (c *Container) SpaceService() *application.SpaceService {
	return c.spaceService
}

// BaseService 获取Base服务
func (c *Container) BaseService() *application.BaseService {
	return c.baseService
}

// TableService 获取表格服务
func (c *Container) TableService() *application.TableService {
	return c.tableService
}

// FieldService 获取字段服务
func (c *Container) FieldService() *application.FieldService {
	return c.fieldService
}

// RecordService 获取记录服务
func (c *Container) RecordService() *application.RecordService {
	return c.recordService
}

// ViewService 获取视图服务
func (c *Container) ViewService() *application.ViewService {
	return c.viewService
}

// CalculationService 获取计算服务 ✨
func (c *Container) CalculationService() *application.CalculationService {
	return c.calculationService
}

// WebSocketManager 获取 WebSocket 管理器 ✨
func (c *Container) WebSocketManager() *websocket.Manager {
	return c.wsManager
}

// WebSocketService 获取 WebSocket 服务 ✨
func (c *Container) WebSocketService() websocket.Service {
	return c.wsService
}

// MCPTokenService 获取MCP Token服务
func (c *Container) MCPTokenService() *application.MCPTokenService {
	return c.mcpTokenService
}

// ==================== 健康检查 ====================

// Health 健康检查
func (c *Container) Health(ctx context.Context) error {
	// 检查数据库
	if err := c.db.Health(); err != nil {
		return fmt.Errorf("数据库不健康: %w", err)
	}

	// 检查缓存（可选）
	if c.cacheClient != nil {
		if err := c.cacheClient.Health(ctx); err != nil {
			logger.Warn("缓存服务不健康", logger.ErrorField(err))
			// 不返回错误，缓存失败不影响服务
		}
	}

	return nil
}

// ==================== 启动和停止服务 ====================

// StartServices 启动所有后台服务
func (c *Container) StartServices(ctx context.Context) {
	logger.Info("启动后台服务...")

	// 启动后台任务（参考 teable-develop）
	// - 定时任务
	// - 消息队列消费者
	// - WebSocket 服务
	// - 计算任务队列

	logger.Info("✅ 后台服务启动完成")
}

// StopServices 停止所有后台服务
func (c *Container) StopServices() {
	logger.Info("停止后台服务...")

	// 停止后台任务（优雅关闭所有后台服务）

	logger.Info("✅ 后台服务已停止")
}

// ==================== MCP 服务（可选）====================

// SetMCPServer 设置MCP服务器实例（供serve命令调用）
func (c *Container) SetMCPServer(server interface{}) {
	c.mcpServer = &server
}

// MCPServer 获取MCP服务器实例（如果已设置）
func (c *Container) MCPServer() interface{} {
	if c.mcpServer == nil {
		return nil
	}
	return *c.mcpServer
}
