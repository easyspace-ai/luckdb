package commands

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/spf13/cobra"

	"github.com/easyspace-ai/luckdb/server/internal/config"
	"github.com/easyspace-ai/luckdb/server/internal/container"
	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/entity"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

var (
	// Token 命令参数
	tokenName      string
	tokenUserID    string
	tokenScopes    []string
	tokenExpiresIn string
)

// NewTokenCmd 创建Token管理命令
func NewTokenCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "token",
		Short: "MCP Token 管理",
		Long:  "管理 MCP API Tokens",
	}

	cmd.AddCommand(newTokenCreateCmd())
	cmd.AddCommand(newTokenListCmd())
	cmd.AddCommand(newTokenRevokeCmd())

	return cmd
}

// newTokenCreateCmd 创建Token命令
func newTokenCreateCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "create",
		Short: "创建新的 MCP Token",
		Long: `创建新的 MCP API Token

示例：
  # 创建一个永不过期的Token
  easydb-mcp token create --name="my-ai-app" --user-id="usr_xxx"

  # 创建一个30天后过期的Token
  easydb-mcp token create --name="temp-token" --user-id="usr_xxx" --expires-in="720h"

  # 创建一个有限权限的Token
  easydb-mcp token create --name="readonly" --user-id="usr_xxx" --scopes="tool:list*,tool:get*"
`,
		RunE: runTokenCreate,
	}

	cmd.Flags().StringVarP(&tokenName, "name", "n", "", "Token名称（必填）")
	cmd.Flags().StringVarP(&tokenUserID, "user-id", "u", "", "用户ID（必填）")
	cmd.Flags().StringArrayVarP(&tokenScopes, "scopes", "s", []string{"*"}, "权限范围")
	cmd.Flags().StringVarP(&tokenExpiresIn, "expires-in", "e", "", "过期时间（如 24h, 30d）")

	cmd.MarkFlagRequired("name")
	cmd.MarkFlagRequired("user-id")

	return cmd
}

// newTokenListCmd 列出Token命令
func newTokenListCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list",
		Short: "列出用户的所有 MCP Tokens",
		Long: `列出指定用户的所有 MCP API Tokens

示例：
  easydb-mcp token list --user-id="usr_xxx"
`,
		RunE: runTokenList,
	}

	cmd.Flags().StringVarP(&tokenUserID, "user-id", "u", "", "用户ID（必填）")
	cmd.MarkFlagRequired("user-id")

	return cmd
}

// newTokenRevokeCmd 撤销Token命令
func newTokenRevokeCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "revoke [token_id]",
		Short: "撤销 MCP Token",
		Args:  cobra.ExactArgs(1),
		Long: `撤销指定的 MCP API Token

示例：
  easydb-mcp token revoke tok_xxx
`,
		RunE: runTokenRevoke,
	}

	return cmd
}

// initLogger 初始化日志
func initLogger() error {
	loggerConfig := logger.LoggerConfig{
		Level:      "info",
		Format:     "json",
		OutputPath: "stdout",
	}
	return logger.Init(loggerConfig)
}

// runTokenCreate 执行创建Token
func runTokenCreate(cmd *cobra.Command, args []string) error {
	// 初始化日志
	if err := initLogger(); err != nil {
		return fmt.Errorf("初始化日志失败: %w", err)
	}

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 创建容器
	cont := container.NewContainer(cfg)
	if err := cont.Initialize(); err != nil {
		return fmt.Errorf("初始化容器失败: %w", err)
	}
	defer cont.Close()

	ctx := context.Background()

	// 生成随机Token
	token, err := generateRandomToken(32)
	if err != nil {
		return fmt.Errorf("生成Token失败: %w", err)
	}

	// 解析过期时间
	var expiresAt *time.Time
	if tokenExpiresIn != "" {
		duration, err := time.ParseDuration(tokenExpiresIn)
		if err != nil {
			return fmt.Errorf("无效的过期时间格式: %w", err)
		}
		exp := time.Now().Add(duration)
		expiresAt = &exp
	}

	// 创建Token实体
	mcpToken := entity.NewMCPTokenForCreate(
		"tok_"+uuid.New().String()[:16],
		tokenUserID,
		token, // 使用明文token
		tokenName,
		"",   // description
		true, // isActive
		tokenScopes,
		expiresAt,
	)

	// 保存到数据库
	if err := cont.MCPTokenRepo().Create(ctx, mcpToken); err != nil {
		return fmt.Errorf("保存Token失败: %w", err)
	}

	// 输出结果
	fmt.Println("✅ MCP Token 创建成功")
	fmt.Println()
	fmt.Printf("Token ID:     %s\n", mcpToken.ID())
	fmt.Printf("Token:        %s\n", token)
	fmt.Printf("Name:         %s\n", mcpToken.Name())
	fmt.Printf("User ID:      %s\n", mcpToken.UserID())
	fmt.Printf("Scopes:       %v\n", mcpToken.Scopes())
	if mcpToken.ExpiresAt() != nil {
		fmt.Printf("Expires At:   %s\n", mcpToken.ExpiresAt().Format(time.RFC3339))
	} else {
		fmt.Printf("Expires At:   Never\n")
	}
	fmt.Println()
	fmt.Println("⚠️  请妥善保存此 Token，它只会显示一次！")
	fmt.Println()
	fmt.Println("使用方法：")
	fmt.Println("  1. 环境变量： export EASYDB_TOKEN=" + token)
	fmt.Println("  2. HTTP Header: Authorization: Bearer " + token)

	logger.Info("MCP Token created",
		logger.String("token_id", mcpToken.ID()),
		logger.String("user_id", tokenUserID),
	)

	return nil
}

// runTokenList 执行列出Token
func runTokenList(cmd *cobra.Command, args []string) error {
	// 初始化日志
	if err := initLogger(); err != nil {
		return fmt.Errorf("初始化日志失败: %w", err)
	}

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 创建容器
	cont := container.NewContainer(cfg)
	if err := cont.Initialize(); err != nil {
		return fmt.Errorf("初始化容器失败: %w", err)
	}
	defer cont.Close()

	ctx := context.Background()

	// 查询用户的Token
	tokens, err := cont.MCPTokenRepo().FindByUserID(ctx, tokenUserID)
	if err != nil {
		return fmt.Errorf("查询Token失败: %w", err)
	}

	if len(tokens) == 0 {
		fmt.Printf("用户 %s 没有任何 MCP Token\n", tokenUserID)
		return nil
	}

	// 输出Token列表
	fmt.Printf("用户 %s 的 MCP Tokens（共 %d 个）:\n\n", tokenUserID, len(tokens))

	for i, token := range tokens {
		status := "✅ Active"
		if token.IsExpired() {
			status = "❌ Expired"
		}

		fmt.Printf("%d. %s (%s)\n", i+1, token.Name(), status)
		fmt.Printf("   ID:         %s\n", token.ID())
		fmt.Printf("   Scopes:     %v\n", token.Scopes())
		fmt.Printf("   Created:    %s\n", token.CreatedAt().Format(time.RFC3339))
		if token.ExpiresAt() != nil {
			fmt.Printf("   Expires:    %s\n", token.ExpiresAt().Format(time.RFC3339))
		} else {
			fmt.Printf("   Expires:    Never\n")
		}
		if token.LastUsedAt() != nil {
			fmt.Printf("   Last Used:  %s\n", token.LastUsedAt().Format(time.RFC3339))
		}
		fmt.Println()
	}

	return nil
}

// runTokenRevoke 执行撤销Token
func runTokenRevoke(cmd *cobra.Command, args []string) error {
	tokenID := args[0]

	// 初始化日志
	if err := initLogger(); err != nil {
		return fmt.Errorf("初始化日志失败: %w", err)
	}

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 创建容器
	cont := container.NewContainer(cfg)
	if err := cont.Initialize(); err != nil {
		return fmt.Errorf("初始化容器失败: %w", err)
	}
	defer cont.Close()

	ctx := context.Background()

	// 查找Token
	token, err := cont.MCPTokenRepo().FindByID(ctx, tokenID)
	if err != nil {
		return fmt.Errorf("查询Token失败: %w", err)
	}

	if token == nil {
		return fmt.Errorf("Token不存在: %s", tokenID)
	}

	// 撤销Token
	token.Revoke()
	if err := cont.MCPTokenRepo().Update(ctx, token); err != nil {
		return fmt.Errorf("撤销Token失败: %w", err)
	}

	fmt.Printf("✅ Token 已撤销: %s (%s)\n", token.ID(), token.Name())

	logger.Info("MCP Token revoked",
		logger.String("token_id", tokenID),
	)

	return nil
}

// generateRandomToken 生成随机Token
func generateRandomToken(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// hashToken 计算Token的SHA256哈希
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
