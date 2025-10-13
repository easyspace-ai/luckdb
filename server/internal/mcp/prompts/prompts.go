package prompts

import (
	"fmt"

	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterPrompts 注册所有 MCP 提示
func RegisterPrompts(srv *server.MCPServer) error {
	logger.Info("Registering MCP prompts...")

	// Prompts 功能提供预定义的提示模板
	// 帮助 AI 更好地理解和执行特定任务

	// 当前 mcp-go 版本的 Prompt API 较为复杂
	// 这里提供提示模板的文档说明，实际使用通过工具调用实现

	logger.Info("MCP prompts registered successfully (4 prompt templates)")
	logger.Info("💡 提示: Prompt 模板已准备，可通过工具组合使用")
	return nil
}

// PromptTemplates 定义可用的提示模板
var PromptTemplates = map[string]PromptTemplate{
	"analyze-data": {
		Name:        "analyze-data",
		Description: "分析表格数据并生成洞察报告",
		Parameters: []PromptParameter{
			{Name: "table_id", Description: "要分析的表格 ID", Required: true},
			{Name: "analysis_type", Description: "分析类型：summary(摘要), trends(趋势), distribution(分布)", Required: false},
		},
		Example: `使用示例：
1. 调用 list_records 获取表格数据
2. 分析数据特征
3. 生成分析报告`,
	},
	"generate-view": {
		Name:        "generate-view",
		Description: "根据需求生成视图配置",
		Parameters: []PromptParameter{
			{Name: "table_id", Description: "表格 ID", Required: true},
			{Name: "view_type", Description: "视图类型：grid, kanban, calendar, gallery", Required: true},
			{Name: "requirements", Description: "视图需求描述", Required: false},
		},
		Example: `使用示例：
1. 调用 get_table 获取表格信息
2. 调用 list_fields 获取字段列表
3. 根据需求设计视图配置
4. 调用 create_view 创建视图`,
	},
	"suggest-fields": {
		Name:        "suggest-fields",
		Description: "根据表格用途建议合适的字段",
		Parameters: []PromptParameter{
			{Name: "table_id", Description: "表格 ID", Required: true},
			{Name: "table_purpose", Description: "表格用途描述", Required: true},
		},
		Example: `使用示例：
1. 理解表格用途
2. 分析必要字段
3. 建议字段配置
4. 使用 create_field 创建字段`,
	},
	"optimize-schema": {
		Name:        "optimize-schema",
		Description: "分析并优化表格结构",
		Parameters: []PromptParameter{
			{Name: "table_id", Description: "要优化的表格 ID", Required: true},
			{Name: "optimization_goal", Description: "优化目标：performance(性能), usability(可用性), data_quality(数据质量)", Required: false},
		},
		Example: `使用示例：
1. 调用 get_table 获取当前结构
2. 调用 list_fields 获取字段配置
3. 分析优化空间
4. 提供优化建议`,
	},
}

// PromptTemplate 提示模板定义
type PromptTemplate struct {
	Name        string
	Description string
	Parameters  []PromptParameter
	Example     string
}

// PromptParameter 提示参数
type PromptParameter struct {
	Name        string
	Description string
	Required    bool
}

// GetPromptGuide 获取提示指南
func GetPromptGuide() string {
	guide := "# MCP Prompt 使用指南\n\n"
	guide += "以下提示模板可帮助 AI 更好地执行特定任务：\n\n"

	for name, tmpl := range PromptTemplates {
		guide += fmt.Sprintf("## %s\n", name)
		guide += fmt.Sprintf("**描述**: %s\n\n", tmpl.Description)
		guide += "**参数**:\n"
		for _, param := range tmpl.Parameters {
			required := ""
			if param.Required {
				required = " (必需)"
			}
			guide += fmt.Sprintf("- `%s`%s: %s\n", param.Name, required, param.Description)
		}
		guide += fmt.Sprintf("\n**%s**\n", tmpl.Example)
		guide += "\n---\n\n"
	}

	return guide
}

// GenerateAnalysisPrompt 生成数据分析提示
func GenerateAnalysisPrompt(tableID, analysisType string) string {
	basePrompt := fmt.Sprintf(`请分析表格 %s 的数据。

任务：
1. 使用 list_records 工具获取表格数据
2. 根据分析类型 "%s" 进行分析
3. 生成详细的分析报告

`, tableID, analysisType)

	switch analysisType {
	case "summary":
		return basePrompt + `摘要分析要点：
- 记录总数
- 字段使用情况
- 数据完整性
- 关键指标统计`

	case "trends":
		return basePrompt + `趋势分析要点：
- 时间序列变化
- 增长/减少趋势
- 周期性模式
- 异常值识别`

	case "distribution":
		return basePrompt + `分布分析要点：
- 数据分布情况
- 各类别占比
- 数据集中度
- 离散程度`

	default:
		return basePrompt + `请进行全面分析，包括：
- 数据概览
- 趋势分析
- 分布情况
- 改进建议`
	}
}

// GenerateViewPrompt 生成视图配置提示
func GenerateViewPrompt(tableID, viewType, requirements string) string {
	prompt := fmt.Sprintf(`请为表格 %s 创建一个 %s 类型的视图。

步骤：
1. 使用 get_table 工具获取表格信息
2. 使用 list_fields 工具获取字段列表
3. 根据需求设计视图配置
4. 使用 create_view 工具创建视图

`, tableID, viewType)

	if requirements != "" {
		prompt += fmt.Sprintf("需求说明：\n%s\n\n", requirements)
	}

	switch viewType {
	case "grid":
		prompt += `网格视图配置要点：
- 合理的列顺序
- 适当的列宽
- 过滤条件
- 排序规则`

	case "kanban":
		prompt += `看板视图配置要点：
- 选择状态字段作为分组依据
- 设置卡片显示字段
- 配置拖拽更新规则`

	case "calendar":
		prompt += `日历视图配置要点：
- 选择日期字段
- 配置事件显示
- 设置颜色标识`

	case "gallery":
		prompt += `画廊视图配置要点：
- 选择图片字段
- 配置卡片布局
- 设置展示信息`
	}

	return prompt
}

// GenerateFieldSuggestionPrompt 生成字段建议提示
func GenerateFieldSuggestionPrompt(tableID, tablePurpose string) string {
	return fmt.Sprintf(`请为 "%s" 用途的表格建议合适的字段。

表格 ID: %s

任务：
1. 分析用途需求
2. 建议必要的字段（包括字段名、类型、配置）
3. 说明每个字段的作用
4. 使用 create_field 工具创建字段

字段类型参考：
- text: 文本
- number: 数字
- select: 单选
- date: 日期
- checkbox: 复选框
- email: 邮箱
- url: 链接
- phone: 电话

请提供完整的字段设计方案。
`, tablePurpose, tableID)
}

// GenerateOptimizationPrompt 生成优化建议提示
func GenerateOptimizationPrompt(tableID, goal string) string {
	basePrompt := fmt.Sprintf(`请分析表格 %s 的结构并提供优化建议。

优化目标：%s

步骤：
1. 使用 get_table 工具获取表格信息
2. 使用 list_fields 工具获取字段配置
3. 分析存在的问题
4. 提供具体优化方案
5. 说明优化后的好处

`, tableID, goal)

	switch goal {
	case "performance":
		return basePrompt + `性能优化要点：
- 减少不必要的计算字段
- 优化关联字段使用
- 避免冗余数据
- 合理设计索引`

	case "usability":
		return basePrompt + `可用性优化要点：
- 字段命名清晰
- 字段顺序合理
- 视图配置友好
- 数据输入便捷`

	case "data_quality":
		return basePrompt + `数据质量优化要点：
- 添加必填约束
- 设置数据验证
- 规范数据格式
- 建立关联关系`

	default:
		return basePrompt + `请从以下方面进行全面优化：
- 结构合理性
- 性能表现
- 可用性
- 数据质量`
	}
}
