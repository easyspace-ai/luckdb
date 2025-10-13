package entity

import (
	"testing"
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/domain/user/valueobject"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewUser(t *testing.T) {
	t.Run("成功创建用户", func(t *testing.T) {
		email, err := valueobject.NewEmail("test@example.com")
		require.NoError(t, err)

		password, err := valueobject.NewPassword("Password123!")
		require.NoError(t, err)

		user, err := NewUser(email, "测试用户", password, "system")

		assert.NoError(t, err)
		assert.NotNil(t, user)
		assert.Equal(t, "测试用户", user.Name())
		assert.Equal(t, email, user.Email())
		assert.Equal(t, valueobject.PendingStatus(), user.Status())
		assert.False(t, user.IsSystem())
		assert.False(t, user.IsAdmin())
	})

	t.Run("用户名为空应失败", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")

		user, err := NewUser(email, "", password, "system")

		assert.Error(t, err)
		assert.Nil(t, user)
	})

	t.Run("用户名过长应失败", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		longName := string(make([]byte, 101)) // 超过100字符

		user, err := NewUser(email, longName, password, "system")

		assert.Error(t, err)
		assert.Nil(t, user)
	})
}

func TestUser_Activate(t *testing.T) {
	t.Run("激活待激活用户", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		err := user.Activate()

		assert.NoError(t, err)
		assert.Equal(t, valueobject.ActiveStatus(), user.Status())
	})

	t.Run("激活已激活用户应失败", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")
		user.Activate()

		err := user.Activate()

		assert.Error(t, err)
	})
}

func TestUser_Deactivate(t *testing.T) {
	t.Run("停用激活用户", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")
		user.Activate()

		err := user.Deactivate("测试停用")

		assert.NoError(t, err)
		assert.False(t, user.IsActive())
		assert.NotNil(t, user.DeactivatedAt())
	})
}

func TestUser_UpdateProfile(t *testing.T) {
	t.Run("更新用户名", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		err := user.UpdateName("新用户名")

		assert.NoError(t, err)
		assert.Equal(t, "新用户名", user.Name())
	})

	t.Run("更新头像", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		err := user.UpdateAvatar("https://example.com/avatar.jpg")

		assert.NoError(t, err)
		assert.NotNil(t, user.Avatar())
		assert.Equal(t, "https://example.com/avatar.jpg", *user.Avatar())
	})

	t.Run("更新手机号", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		newPhone, _ := valueobject.NewPhone("+8613800138000")
		err := user.UpdatePhone(newPhone)

		assert.NoError(t, err)
		assert.NotNil(t, user.Phone())
		assert.Equal(t, newPhone, *user.Phone())
	})
}

func TestUser_UpdatePassword(t *testing.T) {
	t.Run("修改密码成功", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		oldPassword, _ := valueobject.NewPassword("OldPassword123!")
		user, _ := NewUser(email, "测试用户", oldPassword, "system")

		newPassword, _ := valueobject.NewPassword("NewPassword456!")

		err := user.UpdatePassword(oldPassword, newPassword)

		assert.NoError(t, err)
		// 验证新密码
		assert.True(t, user.VerifyPassword(newPassword))
	})

	t.Run("旧密码错误应失败", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		oldPassword, _ := valueobject.NewPassword("OldPassword123!")
		user, _ := NewUser(email, "测试用户", oldPassword, "system")

		wrongOldPassword, _ := valueobject.NewPassword("WrongPassword123!")
		newPassword, _ := valueobject.NewPassword("NewPassword456!")

		err := user.UpdatePassword(wrongOldPassword, newPassword)

		assert.Error(t, err)
	})
}

func TestUser_PromoteToAdmin(t *testing.T) {
	t.Run("提升为管理员", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		// 必须先激活用户才能提升为管理员
		user.Activate()

		err := user.PromoteToAdmin()

		assert.NoError(t, err)
		assert.True(t, user.IsAdmin())
	})
}

func TestUser_DemoteFromAdmin(t *testing.T) {
	t.Run("撤销管理员权限", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")
		user.PromoteToAdmin()

		err := user.DemoteFromAdmin()

		assert.NoError(t, err)
		assert.False(t, user.IsAdmin())
	})

	t.Run("系统用户不能撤销管理员权限", func(t *testing.T) {
		email, _ := valueobject.NewEmail("admin@system.com")
		password, _ := valueobject.NewPassword("Password123!")
		hashedPassword, _ := password.Hash()
		user := ReconstructUser(
			valueobject.NewUserID("usr_system"),
			"系统管理员",
			email,
			hashedPassword,
			nil,
			nil,
			valueobject.ActiveStatus(),
			true,  // isSystem
			true,  // isAdmin
			false, // isTrialUsed
			"system",
			time.Now(),
			time.Now(),
			nil,
			nil,
			nil,
			1,
		)

		err := user.DemoteFromAdmin()

		assert.Error(t, err)
		assert.True(t, user.IsAdmin())
	})
}

func TestUser_RecordSignIn(t *testing.T) {
	t.Run("记录登录时间", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		beforeSignIn := time.Now()
		user.RecordSignIn()
		afterSignIn := time.Now()

		assert.NotNil(t, user.LastSignAt())
		assert.True(t, user.LastSignAt().After(beforeSignIn) || user.LastSignAt().Equal(beforeSignIn))
		assert.True(t, user.LastSignAt().Before(afterSignIn) || user.LastSignAt().Equal(afterSignIn))
	})
}

func TestReconstructUser(t *testing.T) {
	t.Run("重建用户实体", func(t *testing.T) {
		userID := valueobject.NewUserID("usr_12345")
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		hashedPassword, _ := password.Hash()

		user := ReconstructUser(
			userID,
			"测试用户",
			email,
			hashedPassword,
			nil,
			nil,
			valueobject.ActiveStatus(),
			false, // isSystem
			false, // isAdmin
			false, // isTrialUsed
			"system",
			time.Now().Add(-24*time.Hour),
			time.Now(),
			nil,
			nil,
			nil,
			1,
		)

		assert.NotNil(t, user)
		assert.Equal(t, userID, user.ID())
		assert.Equal(t, "测试用户", user.Name())
		assert.Equal(t, email, user.Email())
		assert.Equal(t, valueobject.ActiveStatus(), user.Status())
	})
}

func TestUser_VersionControl(t *testing.T) {
	t.Run("版本号递增", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		initialVersion := user.Version()

		user.UpdateName("新名称")

		assert.Equal(t, initialVersion+1, user.Version())
	})
}

func TestUser_SoftDelete(t *testing.T) {
	t.Run("软删除用户", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")

		err := user.SoftDelete()

		assert.NoError(t, err)
		assert.True(t, user.IsDeleted())
		assert.NotNil(t, user.DeletedAt())
	})

	t.Run("已删除用户不能再删除", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")
		user.SoftDelete()

		err := user.SoftDelete()

		assert.Error(t, err)
	})
}

func TestUser_Restore(t *testing.T) {
	t.Run("恢复已删除用户", func(t *testing.T) {
		email, _ := valueobject.NewEmail("test@example.com")
		password, _ := valueobject.NewPassword("Password123!")
		user, _ := NewUser(email, "测试用户", password, "system")
		user.SoftDelete()

		err := user.Restore()

		assert.NoError(t, err)
		assert.False(t, user.IsDeleted())
		assert.Nil(t, user.DeletedAt())
	})
}
