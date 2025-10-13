package database

import (
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestProviderFactory_CreateProvider_Postgres(t *testing.T) {
	// 这个测试需要真实的PostgreSQL连接，这里跳过
	t.Skip("需要真实的PostgreSQL连接")
}

func TestProviderFactory_CreateProvider_SQLite(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("创建SQLite连接失败: %v", err)
	}

	factory := NewProviderFactory()

	provider, err := factory.CreateProvider(db)
	if err != nil {
		t.Fatalf("创建Provider失败: %v", err)
	}

	if provider == nil {
		t.Fatal("Provider不应该为nil")
	}

	if provider.DriverName() != "sqlite" {
		t.Errorf("期望驱动名称为 sqlite, 但得到 %s", provider.DriverName())
	}

	if provider.SupportsSchema() {
		t.Errorf("SQLite不应该支持Schema")
	}
}

func TestProviderFactory_CreateProvider_NilDB(t *testing.T) {
	factory := NewProviderFactory()

	_, err := factory.CreateProvider(nil)
	if err == nil {
		t.Error("传入nil数据库连接应该返回错误")
	}
}

func TestProviderFactory_MustCreateProvider(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("创建SQLite连接失败: %v", err)
	}

	factory := NewProviderFactory()

	// 测试正常情况
	provider := factory.MustCreateProvider(db)
	if provider == nil {
		t.Fatal("Provider不应该为nil")
	}

	// 测试panic情况
	defer func() {
		if r := recover(); r == nil {
			t.Error("传入nil应该panic")
		}
	}()
	factory.MustCreateProvider(nil)
}
