package valueobject

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewEmail(t *testing.T) {
	tests := []struct {
		name    string
		email   string
		wantErr bool
	}{
		{
			name:    "有效的邮箱地址",
			email:   "test@example.com",
			wantErr: false,
		},
		{
			name:    "有效的企业邮箱",
			email:   "user@company.co.uk",
			wantErr: false,
		},
		{
			name:    "有效的Gmail地址",
			email:   "user+tag@gmail.com",
			wantErr: false,
		},
		{
			name:    "空邮箱地址",
			email:   "",
			wantErr: true,
		},
		{
			name:    "无效格式-缺少@",
			email:   "testexample.com",
			wantErr: true,
		},
		{
			name:    "无效格式-缺少域名",
			email:   "test@",
			wantErr: true,
		},
		{
			name:    "无效格式-缺少用户名",
			email:   "@example.com",
			wantErr: true,
		},
		{
			name:    "无效格式-多个@",
			email:   "test@@example.com",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			email, err := NewEmail(tt.email)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, Email{}, email)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.email, email.String())
			}
		})
	}
}

func TestEmail_Equals(t *testing.T) {
	email1, _ := NewEmail("test@example.com")
	email2, _ := NewEmail("test@example.com")
	email3, _ := NewEmail("other@example.com")

	assert.True(t, email1.Equals(email2))
	assert.False(t, email1.Equals(email3))
}

func TestEmail_String(t *testing.T) {
	email, _ := NewEmail("test@example.com")

	assert.Equal(t, "test@example.com", email.String())
}
