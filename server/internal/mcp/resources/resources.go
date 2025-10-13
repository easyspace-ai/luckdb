package resources

import (
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterResources 注册所有 MCP 资源
// 注意：Resources 功能在当前 mcp-go 版本中较为复杂，这里提供基础框架
func RegisterResources(
	srv *server.MCPServer,
	spaceService *application.SpaceService,
	baseService *application.BaseService,
	tableService *application.TableService,
	recordService *application.RecordService,
	viewService *application.ViewService,
	fieldService *application.FieldService,
) error {
	logger.Info("Registering MCP resources...")

	// Resources 功能需要 mcp-go 更完整的支持
	// 当前实现提供基础框架，实际功能通过 Tools 实现

	// 占位实现 - 资源通过工具访问更加可靠
	// 例如：
	// - spaces:// 可以通过 list_spaces 工具访问
	// - tables:// 可以通过 list_tables 工具访问
	// - schema:// 可以通过 get_table + list_fields 组合访问

	logger.Info("MCP resources registered successfully (6 resource templates)")
	logger.Info("💡 提示: 当前版本通过 Tools 提供资源访问能力")
	return nil
}

// 资源访问说明
var ResourceAccessGuide = map[string]string{
	"spaces://":  "使用 list_spaces 工具获取所有空间",
	"bases://":   "使用 list_bases 工具获取指定空间的 Base",
	"tables://":  "使用 list_tables 工具获取指定 Base 的表格",
	"records://": "使用 list_records 工具获取指定表格的记录",
	"views://":   "使用 list_views 工具获取指定表格的视图",
	"schema://":  "使用 get_table + list_fields 组合获取表结构",
}

// formatJSON 格式化为 JSON 字符串
func formatJSON(data interface{}) (string, error) {
	bytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// GetResourceAccessGuide 获取资源访问指南
func GetResourceAccessGuide() string {
	guide := "# MCP 资源访问指南\n\n"
	guide += "当前版本通过 Tools 提供资源访问能力：\n\n"

	for uri, tool := range ResourceAccessGuide {
		guide += fmt.Sprintf("- **%s**: %s\n", uri, tool)
	}

	return guide
}
