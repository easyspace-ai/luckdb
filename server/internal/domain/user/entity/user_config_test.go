package entity

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewUserConfig(t *testing.T) {
	t.Run("成功创建默认配置", func(t *testing.T) {
		config, err := NewUserConfig("user_123")

		require.NoError(t, err)
		assert.NotNil(t, config)
		assert.NotEmpty(t, config.ID())
		assert.Equal(t, "user_123", config.UserID())
		assert.Equal(t, "UTC", config.Timezone())
		assert.Equal(t, "en-US", config.Language())
		assert.Equal(t, "YYYY-MM-DD", config.DateFormat())
		assert.Equal(t, "24h", config.TimeFormat())
	})

	t.Run("用户ID不能为空", func(t *testing.T) {
		config, err := NewUserConfig("")

		assert.Error(t, err)
		assert.Nil(t, config)
	})
}

func TestUserConfig_UpdateTimezone(t *testing.T) {
	config, _ := NewUserConfig("user_123")

	t.Run("成功更新时区", func(t *testing.T) {
		err := config.UpdateTimezone("Asia/Shanghai")

		require.NoError(t, err)
		assert.Equal(t, "Asia/Shanghai", config.Timezone())
	})

	t.Run("时区不能为空", func(t *testing.T) {
		err := config.UpdateTimezone("")
		assert.Error(t, err)
	})
}

func TestUserConfig_UpdateLanguage(t *testing.T) {
	config, _ := NewUserConfig("user_123")

	t.Run("成功更新语言", func(t *testing.T) {
		err := config.UpdateLanguage("zh-CN")

		require.NoError(t, err)
		assert.Equal(t, "zh-CN", config.Language())
	})

	t.Run("语言不能为空", func(t *testing.T) {
		err := config.UpdateLanguage("")
		assert.Error(t, err)
	})
}

func TestUserConfig_UpdateDateFormat(t *testing.T) {
	config, _ := NewUserConfig("user_123")

	t.Run("成功更新日期格式", func(t *testing.T) {
		validFormats := []string{"YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY年MM月DD日"}

		for _, format := range validFormats {
			err := config.UpdateDateFormat(format)
			require.NoError(t, err, "格式 %s 应该有效", format)
			assert.Equal(t, format, config.DateFormat())
		}
	})

	t.Run("无效的日期格式", func(t *testing.T) {
		err := config.UpdateDateFormat("invalid_format")
		assert.Error(t, err)
	})
}

func TestUserConfig_UpdateTimeFormat(t *testing.T) {
	config, _ := NewUserConfig("user_123")

	t.Run("成功更新为12小时制", func(t *testing.T) {
		err := config.UpdateTimeFormat("12h")

		require.NoError(t, err)
		assert.Equal(t, "12h", config.TimeFormat())
	})

	t.Run("成功更新为24小时制", func(t *testing.T) {
		err := config.UpdateTimeFormat("24h")

		require.NoError(t, err)
		assert.Equal(t, "24h", config.TimeFormat())
	})

	t.Run("无效的时间格式", func(t *testing.T) {
		err := config.UpdateTimeFormat("invalid")
		assert.Error(t, err)
	})
}

func TestUserConfig_Update(t *testing.T) {
	config, _ := NewUserConfig("user_123")

	t.Run("批量更新配置", func(t *testing.T) {
		err := config.Update(
			"America/New_York",
			"zh-CN",
			"MM/DD/YYYY",
			"12h",
		)

		require.NoError(t, err)
		assert.Equal(t, "America/New_York", config.Timezone())
		assert.Equal(t, "zh-CN", config.Language())
		assert.Equal(t, "MM/DD/YYYY", config.DateFormat())
		assert.Equal(t, "12h", config.TimeFormat())
	})

	t.Run("部分更新配置（只更新时区）", func(t *testing.T) {
		originalLang := config.Language()
		err := config.Update("UTC", "", "", "")

		require.NoError(t, err)
		assert.Equal(t, "UTC", config.Timezone())
		assert.Equal(t, originalLang, config.Language()) // 其他字段保持不变
	})

	t.Run("更新时验证失败", func(t *testing.T) {
		err := config.Update("", "", "invalid_format", "")
		assert.Error(t, err) // 日期格式无效
	})
}
