package database

import (
	"context"
	"testing"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// setupTestDB 创建测试数据库连接
// 注意：需要真实的PostgreSQL数据库进行测试
func setupTestPostgresDB(t *testing.T) *gorm.DB {
	t.Helper()

	dsn := "host=localhost user=postgres password=postgres dbname=easydb_test port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Skipf("无法连接到测试数据库: %v", err)
	}

	return db
}

func TestPostgresProvider_CreateSchema(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_001"

	// 清理
	defer provider.DropSchema(ctx, testSchemaName)

	// 测试创建Schema
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}

	// 验证Schema存在
	var exists bool
	err = db.Raw("SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = ?)", testSchemaName).Scan(&exists).Error
	if err != nil {
		t.Fatalf("查询Schema失败: %v", err)
	}
	if !exists {
		t.Errorf("Schema应该存在，但没有找到")
	}
}

func TestPostgresProvider_DropSchema(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_002"

	// 先创建
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}

	// 测试删除
	err = provider.DropSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("删除Schema失败: %v", err)
	}

	// 验证Schema不存在
	var exists bool
	err = db.Raw("SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = ?)", testSchemaName).Scan(&exists).Error
	if err != nil {
		t.Fatalf("查询Schema失败: %v", err)
	}
	if exists {
		t.Errorf("Schema应该不存在，但仍然存在")
	}
}

func TestPostgresProvider_CreatePhysicalTable(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_003"
	testTableName := "test_table_001"

	// 创建Schema
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}
	defer provider.DropSchema(ctx, testSchemaName)

	// 测试创建物理表
	err = provider.CreatePhysicalTable(ctx, testSchemaName, testTableName)
	if err != nil {
		t.Fatalf("创建物理表失败: %v", err)
	}

	// 验证表存在
	var exists bool
	err = db.Raw(`
		SELECT EXISTS(
			SELECT 1 FROM information_schema.tables 
			WHERE table_schema = ? AND table_name = ?
		)
	`, testSchemaName, testTableName).Scan(&exists).Error
	if err != nil {
		t.Fatalf("查询表失败: %v", err)
	}
	if !exists {
		t.Errorf("表应该存在，但没有找到")
	}

	// 验证系统字段存在
	var columnCount int
	err = db.Raw(`
		SELECT COUNT(*) FROM information_schema.columns 
		WHERE table_schema = ? AND table_name = ?
	`, testSchemaName, testTableName).Scan(&columnCount).Error
	if err != nil {
		t.Fatalf("查询列失败: %v", err)
	}
	if columnCount != 7 { // 7个系统字段
		t.Errorf("期望7个系统字段，但得到 %d", columnCount)
	}
}

func TestPostgresProvider_AddColumn(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_004"
	testTableName := "test_table_002"

	// 创建Schema和表
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}
	defer provider.DropSchema(ctx, testSchemaName)

	err = provider.CreatePhysicalTable(ctx, testSchemaName, testTableName)
	if err != nil {
		t.Fatalf("创建物理表失败: %v", err)
	}

	// 测试添加列
	columnDef := ColumnDefinition{
		Name:    "field_test_001",
		Type:    "VARCHAR(255)",
		NotNull: false,
	}

	err = provider.AddColumn(ctx, testSchemaName, testTableName, columnDef)
	if err != nil {
		t.Fatalf("添加列失败: %v", err)
	}

	// 验证列存在
	var exists bool
	err = db.Raw(`
		SELECT EXISTS(
			SELECT 1 FROM information_schema.columns 
			WHERE table_schema = ? AND table_name = ? AND column_name = ?
		)
	`, testSchemaName, testTableName, columnDef.Name).Scan(&exists).Error
	if err != nil {
		t.Fatalf("查询列失败: %v", err)
	}
	if !exists {
		t.Errorf("列应该存在，但没有找到")
	}
}

func TestPostgresProvider_DropColumn(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_005"
	testTableName := "test_table_003"
	testColumnName := "field_test_002"

	// 创建Schema、表和列
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}
	defer provider.DropSchema(ctx, testSchemaName)

	err = provider.CreatePhysicalTable(ctx, testSchemaName, testTableName)
	if err != nil {
		t.Fatalf("创建物理表失败: %v", err)
	}

	columnDef := ColumnDefinition{
		Name: testColumnName,
		Type: "TEXT",
	}
	err = provider.AddColumn(ctx, testSchemaName, testTableName, columnDef)
	if err != nil {
		t.Fatalf("添加列失败: %v", err)
	}

	// 测试删除列
	err = provider.DropColumn(ctx, testSchemaName, testTableName, testColumnName)
	if err != nil {
		t.Fatalf("删除列失败: %v", err)
	}

	// 验证列不存在
	var exists bool
	err = db.Raw(`
		SELECT EXISTS(
			SELECT 1 FROM information_schema.columns 
			WHERE table_schema = ? AND table_name = ? AND column_name = ?
		)
	`, testSchemaName, testTableName, testColumnName).Scan(&exists).Error
	if err != nil {
		t.Fatalf("查询列失败: %v", err)
	}
	if exists {
		t.Errorf("列应该不存在，但仍然存在")
	}
}

func TestPostgresProvider_AddUniqueConstraint(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_006"
	testTableName := "test_table_004"
	testColumnName := "field_test_003"
	constraintName := "uq_field_test_003"

	// 创建Schema、表和列
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}
	defer provider.DropSchema(ctx, testSchemaName)

	err = provider.CreatePhysicalTable(ctx, testSchemaName, testTableName)
	if err != nil {
		t.Fatalf("创建物理表失败: %v", err)
	}

	columnDef := ColumnDefinition{
		Name: testColumnName,
		Type: "TEXT",
	}
	err = provider.AddColumn(ctx, testSchemaName, testTableName, columnDef)
	if err != nil {
		t.Fatalf("添加列失败: %v", err)
	}

	// 测试添加唯一约束
	err = provider.AddUniqueConstraint(ctx, testSchemaName, testTableName, testColumnName, constraintName)
	if err != nil {
		t.Fatalf("添加唯一约束失败: %v", err)
	}

	// 验证约束存在
	var exists bool
	err = db.Raw(`
		SELECT EXISTS(
			SELECT 1 FROM information_schema.table_constraints 
			WHERE table_schema = ? AND table_name = ? AND constraint_name = ?
		)
	`, testSchemaName, testTableName, constraintName).Scan(&exists).Error
	if err != nil {
		t.Fatalf("查询约束失败: %v", err)
	}
	if !exists {
		t.Errorf("约束应该存在，但没有找到")
	}
}

func TestPostgresProvider_SetNotNull(t *testing.T) {
	db := setupTestPostgresDB(t)
	provider := NewPostgresProvider(db)
	ctx := context.Background()

	testSchemaName := "test_schema_007"
	testTableName := "test_table_005"
	testColumnName := "field_test_004"

	// 创建Schema、表和列
	err := provider.CreateSchema(ctx, testSchemaName)
	if err != nil {
		t.Fatalf("创建Schema失败: %v", err)
	}
	defer provider.DropSchema(ctx, testSchemaName)

	err = provider.CreatePhysicalTable(ctx, testSchemaName, testTableName)
	if err != nil {
		t.Fatalf("创建物理表失败: %v", err)
	}

	defaultValue := "'default'"
	columnDef := ColumnDefinition{
		Name:         testColumnName,
		Type:         "TEXT",
		NotNull:      false,
		DefaultValue: &defaultValue,
	}
	err = provider.AddColumn(ctx, testSchemaName, testTableName, columnDef)
	if err != nil {
		t.Fatalf("添加列失败: %v", err)
	}

	// 测试设置NOT NULL
	err = provider.SetNotNull(ctx, testSchemaName, testTableName, testColumnName)
	if err != nil {
		t.Fatalf("设置NOT NULL失败: %v", err)
	}

	// 验证NOT NULL约束存在
	var isNullable string
	err = db.Raw(`
		SELECT is_nullable FROM information_schema.columns 
		WHERE table_schema = ? AND table_name = ? AND column_name = ?
	`, testSchemaName, testTableName, testColumnName).Scan(&isNullable).Error
	if err != nil {
		t.Fatalf("查询列属性失败: %v", err)
	}
	if isNullable != "NO" {
		t.Errorf("期望列为NOT NULL，但 is_nullable=%s", isNullable)
	}
}

func TestPostgresProvider_GenerateTableName(t *testing.T) {
	provider := &PostgresProvider{}

	baseID := "bse_test_001"
	tableID := "tbl_test_001"

	expected := "bse_test_001.tbl_test_001"
	actual := provider.GenerateTableName(baseID, tableID)

	if actual != expected {
		t.Errorf("期望表名为 %s, 但得到 %s", expected, actual)
	}
}

func TestPostgresProvider_MapFieldTypeToDBType(t *testing.T) {
	provider := &PostgresProvider{}

	testCases := []struct {
		fieldType string
		expected  string
	}{
		{"singleLineText", "VARCHAR(255)"},
		{"longText", "TEXT"},
		{"number", "NUMERIC"},
		{"date", "TIMESTAMP"},
		{"checkbox", "BOOLEAN"},
		{"singleSelect", "VARCHAR(255)"},
		{"multipleSelect", "JSONB"},
		{"user", "JSONB"},
		{"attachment", "JSONB"},
		{"link", "JSONB"},
		{"formula", "TEXT"},
		{"rollup", "NUMERIC"},
		{"lookup", "JSONB"},
		{"count", "INTEGER"},
		{"rating", "INTEGER"},
		{"url", "VARCHAR(2048)"},
		{"email", "VARCHAR(255)"},
		{"phone", "VARCHAR(50)"},
		{"unknown_type", "TEXT"}, // 默认类型
	}

	for _, tc := range testCases {
		actual := provider.MapFieldTypeToDBType(tc.fieldType)
		if actual != tc.expected {
			t.Errorf("字段类型 %s: 期望 %s, 但得到 %s", tc.fieldType, tc.expected, actual)
		}
	}
}

func TestPostgresProvider_DriverName(t *testing.T) {
	provider := &PostgresProvider{}

	expected := "postgres"
	actual := provider.DriverName()

	if actual != expected {
		t.Errorf("期望驱动名称为 %s, 但得到 %s", expected, actual)
	}
}

func TestPostgresProvider_SupportsSchema(t *testing.T) {
	provider := &PostgresProvider{}

	if !provider.SupportsSchema() {
		t.Errorf("PostgreSQL应该支持Schema")
	}
}
