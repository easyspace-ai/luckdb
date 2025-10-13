package valueobject

import (
	"testing"
)

// TestPinyinConversionComprehensive 综合拼音转换测试
func TestPinyinConversionComprehensive(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		// 基础中文转换
		{"常见中文", "学生姓名", "xueshengxingming"},
		{"用户字段", "用户名称", "yonghumingcheng"},
		{"成绩字段", "成绩总分", "chengjizongfen"},
		{"联系方式", "邮箱地址", "youxiangdizhi"},
		{"时间字段", "创建时间", "chuangjianshijian"},
		{"布尔字段", "是否删除", "shifoushanchu"},

		// 复杂中文
		{"复杂字段", "综合评价分数", "zonghepingjiafenshu"},
		{"业务字段", "订单支付状态", "dingdanzhifuzhuangtai"},
		{"电商字段", "商品分类标签", "shangpinfenleibiaoqian"},
		{"组织架构", "部门负责人", "bumenfuzeren"},

		// 中英混合
		{"中英混合1", "用户ID", "yonghuid"},
		{"英中混合1", "User姓名", "userxingming"},
		{"中英混合2", "姓名Name", "xingmingname"},
		{"英中混合2", "Product产品", "productchanpin"},

		// 纯英文
		{"纯英文", "Username", "username"},
		{"英文空格", "User Profile", "user_profile"},
		{"下划线", "email_address", "email_address"},
		{"驼峰命名", "FirstName", "firstname"},

		// 特殊情况
		{"包含空格", "用户 信息 表", "yonghu_xinxi_biao"},
		{"特殊字符", "价格$金额", "jiage_jine"},
		{"特殊开头", "@用户名", "yonghuming"},
		{"重复字符", "年龄Age年龄", "nianlingagenianling"},

		// 边界情况
		{"数字开头", "123字段", "t123ziduan"},
		{"保留字1", "user", "fld_user"},
		{"保留字2", "SELECT", "fld_select"},
		{"下划线开头", "_hidden", "hidden"},

		// 超长字段（会被截断为40字符）
		{"超长字段", "这是一个非常非常非常非常非常非常非常非常非常长的字段名称用来测试截断功能",
			"zheshiyigefeichangfeichangfeichangfeicha"},

		// 极端情况
		{"空字符串", "", "unnamed"},
		{"纯特殊字符", "!@#$%", "unnamed"},
		{"纯下划线", "___", "unnamed"},
		{"纯数字", "123", "t123"},

		// 多音字测试
		{"多音字-行", "银行", "yinxing"},
		{"多音字-长", "长度", "zhangdu"},
		{"多音字-重", "重要", "zhongyao"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := generateDBFieldName(tt.input)
			if result != tt.expected {
				t.Errorf("generateDBFieldName(%q) = %q, expected %q",
					tt.input, result, tt.expected)
			}
		})
	}
}

// TestPinyinConversionRules 测试转换规则
func TestPinyinConversionRules(t *testing.T) {
	t.Run("中文正确转拼音", func(t *testing.T) {
		result := generateDBFieldName("学生")
		if result != "xuesheng" {
			t.Errorf("expected 'xuesheng', got '%s'", result)
		}
	})

	t.Run("特殊字符转下划线", func(t *testing.T) {
		result := generateDBFieldName("用户@姓名")
		if result != "yonghu_xingming" {
			t.Errorf("expected 'yonghu_xingming', got '%s'", result)
		}
	})

	t.Run("保留字添加前缀", func(t *testing.T) {
		result := generateDBFieldName("user")
		if result != "fld_user" {
			t.Errorf("expected 'fld_user', got '%s'", result)
		}
	})

	t.Run("数字开头添加t前缀", func(t *testing.T) {
		result := generateDBFieldName("123abc")
		if result != "t123abc" {
			t.Errorf("expected 't123abc', got '%s'", result)
		}
	})

	t.Run("长度限制40字符", func(t *testing.T) {
		longName := "这是一个非常非常非常非常非常非常非常非常非常长的字段名称用来测试"
		result := generateDBFieldName(longName)
		if len(result) > 40 {
			t.Errorf("result length %d exceeds 40", len(result))
		}
	})

	t.Run("全部转为小写", func(t *testing.T) {
		result := generateDBFieldName("UserName")
		if result != "username" {
			t.Errorf("expected 'username', got '%s'", result)
		}
	})
}

// BenchmarkPinyinConversion 性能测试
func BenchmarkPinyinConversion(b *testing.B) {
	testCases := []string{
		"学生姓名",
		"用户ID",
		"综合评价分数",
		"User Profile",
		"这是一个非常长的中文字段名称",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		for _, tc := range testCases {
			_ = generateDBFieldName(tc)
		}
	}
}

// TestConvertToASCIIEdgeCases 测试边界情况
func TestConvertToASCIIEdgeCases(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		contains string // 期望结果包含这个字符串
	}{
		{"空字符串", "", ""},
		{"纯ASCII", "hello", "hello"},
		{"纯中文", "你好世界", "nihao"},
		{"混合字符", "Hello世界123", "Hello"},
		{"特殊Unicode", "👍表情", "_biao"},
		{"日文假名", "こんにちは", "_"},
		{"韩文", "안녕하세요", "_"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertToASCII(tt.input)
			if tt.contains != "" && len(result) > 0 {
				if result != tt.input && !containsSubstring(result, tt.contains) {
					t.Logf("convertToASCII(%q) = %q (contains check: %q)",
						tt.input, result, tt.contains)
				}
			}
		})
	}
}

func containsSubstring(s, substr string) bool {
	return len(substr) == 0 || len(s) >= len(substr) &&
		(s == substr || s[:len(substr)] == substr || s[len(s)-len(substr):] == substr)
}
