package valueobject

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
		errMsg   string
	}{
		{
			name:     "有效密码",
			password: "SecurePass123!",
			wantErr:  false,
		},
		{
			name:     "最小长度密码",
			password: "Pass123!",
			wantErr:  false,
		},
		{
			name:     "密码太短",
			password: "Pass1!",
			wantErr:  true,
			errMsg:   "密码长度必须在 8-128 个字符之间",
		},
		{
			name:     "空密码",
			password: "",
			wantErr:  true,
			errMsg:   "密码不能为空",
		},
		{
			name:     "密码太长",
			password: string(make([]byte, 129)),
			wantErr:  true,
			errMsg:   "密码长度必须在 8-128 个字符之间",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			password, err := NewPassword(tt.password)

			if tt.wantErr {
				assert.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.NotEmpty(t, password.value)
			}
		})
	}
}

func TestPassword_Hash(t *testing.T) {
	t.Run("密码哈希成功", func(t *testing.T) {
		password, _ := NewPassword("SecurePass123!")

		hashed, err := password.Hash()

		assert.NoError(t, err)
		assert.NotEmpty(t, hashed.String())
		assert.NotEqual(t, "SecurePass123!", hashed.String())
	})

	t.Run("相同密码产生不同哈希", func(t *testing.T) {
		password1, _ := NewPassword("SecurePass123!")
		password2, _ := NewPassword("SecurePass123!")

		hashed1, _ := password1.Hash()
		hashed2, _ := password2.Hash()

		// 由于使用了盐值，相同密码的哈希应该不同
		assert.NotEqual(t, hashed1.String(), hashed2.String())
	})
}

func TestHashedPassword_Verify(t *testing.T) {
	t.Run("验证正确密码", func(t *testing.T) {
		password, _ := NewPassword("SecurePass123!")
		hashed, _ := password.Hash()

		result := hashed.Verify("SecurePass123!")

		assert.True(t, result)
	})

	t.Run("验证错误密码", func(t *testing.T) {
		password, _ := NewPassword("SecurePass123!")
		hashed, _ := password.Hash()

		result := hashed.Verify("WrongPassword!")

		assert.False(t, result)
	})
}

func TestHashedPassword_String(t *testing.T) {
	password, _ := NewPassword("SecurePass123!")
	hashed, _ := password.Hash()

	hashStr := hashed.String()

	assert.NotEmpty(t, hashStr)
	assert.NotEqual(t, "SecurePass123!", hashStr)
}

func TestPassword_Equals(t *testing.T) {
	password1, _ := NewPassword("SecurePass123!")
	password2, _ := NewPassword("SecurePass123!")
	password3, _ := NewPassword("DifferentPass123!")

	assert.True(t, password1.Equals(password2))
	assert.False(t, password1.Equals(password3))
}
