package valueobject

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCountOptions(t *testing.T) {
	options := NewFieldOptions().WithCount("field_123")

	assert.True(t, options.HasCount())
	assert.NotNil(t, options.Count)
	assert.Equal(t, "field_123", options.Count.LinkFieldID)
}

func TestDurationOptions(t *testing.T) {
	options := NewFieldOptions().WithDuration("h:mm:ss")

	assert.True(t, options.HasDuration())
	assert.NotNil(t, options.Duration)
	assert.Equal(t, "h:mm:ss", options.Duration.Format)
}

func TestButtonOptions(t *testing.T) {
	options := NewFieldOptions().WithButton("Click Me", "open_url")

	assert.True(t, options.HasButton())
	assert.NotNil(t, options.Button)
	assert.Equal(t, "Click Me", options.Button.Label)
	assert.Equal(t, "open_url", options.Button.Action)
}

func TestUserOptions(t *testing.T) {
	// 单用户
	singleUser := NewFieldOptions().WithUser(false)
	assert.True(t, singleUser.HasUser())
	assert.False(t, singleUser.User.IsMultiple)

	// 多用户
	multiUser := NewFieldOptions().WithUser(true)
	assert.True(t, multiUser.HasUser())
	assert.True(t, multiUser.User.IsMultiple)
}

func TestRatingOptions(t *testing.T) {
	options := NewFieldOptions().WithRating(10, "star")

	assert.True(t, options.HasRating())
	assert.NotNil(t, options.Rating)
	assert.Equal(t, 10, options.Rating.Max)
	assert.Equal(t, "star", options.Rating.Icon)
}

func TestMultipleOptions(t *testing.T) {
	// 测试可以同时设置多个选项
	options := NewFieldOptions().
		WithCount("field_1").
		WithDuration("h:mm")

	assert.True(t, options.HasCount())
	assert.True(t, options.HasDuration())
	assert.Equal(t, "field_1", options.Count.LinkFieldID)
	assert.Equal(t, "h:mm", options.Duration.Format)
}
