#!/bin/bash

# 默认视图创建功能测试脚本
# 用于验证对齐 Teable 后的实现

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
API_BASE_URL="${API_BASE_URL:-http://localhost:8080/api/v1}"
AUTH_TOKEN="${AUTH_TOKEN}"
BASE_ID="${BASE_ID}"

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 打印标题
print_title() {
  echo ""
  echo "=========================================="
  echo "$1"
  echo "=========================================="
}

# 打印测试结果
print_test() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "\n[测试 $TOTAL_TESTS] $1..."
}

# 打印成功
print_success() {
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "${GREEN}✓ 成功：$1${NC}"
}

# 打印失败
print_fail() {
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}✗ 失败：$1${NC}"
}

# 打印警告
print_warn() {
  echo -e "${YELLOW}⚠ 警告：$1${NC}"
}

# 检查环境变量
check_env() {
  print_title "检查测试环境"
  
  if [ -z "$AUTH_TOKEN" ]; then
    echo "错误：未设置 AUTH_TOKEN 环境变量"
    echo "请运行：export AUTH_TOKEN='your_token'"
    exit 1
  fi
  
  if [ -z "$BASE_ID" ]; then
    echo "错误：未设置 BASE_ID 环境变量"
    echo "请运行：export BASE_ID='your_base_id'"
    exit 1
  fi
  
  echo "✓ API_BASE_URL: $API_BASE_URL"
  echo "✓ AUTH_TOKEN: ${AUTH_TOKEN:0:20}..."
  echo "✓ BASE_ID: $BASE_ID"
}

# 测试1：不传 views/fields，验证默认值注入
test_default_injection() {
  print_title "测试1: 验证默认值自动注入"
  
  print_test "创建表（不传 views 和 fields）"
  
  RESPONSE=$(curl -s -X POST "${API_BASE_URL}/bases/${BASE_ID}/tables" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"name\": \"Test Table $(date +%s)\",
      \"description\": \"测试默认值注入\"
    }")
  
  # 检查响应
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  if [ "$SUCCESS" != "true" ]; then
    print_fail "创建表失败"
    echo "$RESPONSE" | jq .
    return 1
  fi
  
  print_success "表创建成功"
  
  # 提取数据
  TABLE_ID=$(echo "$RESPONSE" | jq -r '.data.id')
  DEFAULT_VIEW_ID=$(echo "$RESPONSE" | jq -r '.data.defaultViewId')
  FIELD_COUNT=$(echo "$RESPONSE" | jq -r '.data.fieldCount')
  
  echo "  - Table ID: $TABLE_ID"
  echo "  - Default View ID: $DEFAULT_VIEW_ID"
  echo "  - Field Count: $FIELD_COUNT"
  
  # 验证 defaultViewId 存在
  print_test "验证 defaultViewId 存在"
  if [ "$DEFAULT_VIEW_ID" == "null" ] || [ -z "$DEFAULT_VIEW_ID" ]; then
    print_fail "defaultViewId 不存在"
    return 1
  fi
  print_success "defaultViewId 存在: $DEFAULT_VIEW_ID"
  
  # 验证字段数量
  print_test "验证默认字段已创建"
  if [ "$FIELD_COUNT" -lt 1 ]; then
    print_fail "字段数量为 0"
    return 1
  fi
  print_success "字段数量: $FIELD_COUNT"
  
  # 获取视图详情
  print_test "获取视图详情"
  VIEW_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/views/${DEFAULT_VIEW_ID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  VIEW_SUCCESS=$(echo "$VIEW_RESPONSE" | jq -r '.success')
  if [ "$VIEW_SUCCESS" != "true" ]; then
    print_fail "获取视图详情失败"
    echo "$VIEW_RESPONSE" | jq .
    return 1
  fi
  
  VIEW_NAME=$(echo "$VIEW_RESPONSE" | jq -r '.data.name')
  VIEW_TYPE=$(echo "$VIEW_RESPONSE" | jq -r '.data.type')
  
  print_success "视图详情获取成功"
  echo "  - View Name: $VIEW_NAME"
  echo "  - View Type: $VIEW_TYPE"
  
  # 验证视图名称和类型
  print_test "验证视图名称和类型"
  if [ "$VIEW_NAME" != "Grid view" ]; then
    print_fail "视图名称不正确，期望: Grid view, 实际: $VIEW_NAME"
    return 1
  fi
  if [ "$VIEW_TYPE" != "grid" ]; then
    print_fail "视图类型不正确，期望: grid, 实际: $VIEW_TYPE"
    return 1
  fi
  print_success "视图名称和类型正确"
  
  # 获取字段列表
  print_test "验证默认字段详情"
  FIELDS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/tables/${TABLE_ID}/fields" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  FIELD_NAME=$(echo "$FIELDS_RESPONSE" | jq -r '.data[0].name')
  FIELD_TYPE=$(echo "$FIELDS_RESPONSE" | jq -r '.data[0].type')
  
  if [ "$FIELD_NAME" != "name" ] || [ "$FIELD_TYPE" != "text" ]; then
    print_fail "默认字段不正确"
    echo "  - 期望字段名: name, 实际: $FIELD_NAME"
    echo "  - 期望字段类型: text, 实际: $FIELD_TYPE"
    return 1
  fi
  print_success "默认字段正确 (name: text)"
}

# 测试2：自定义 views 和 fields
test_custom_views_fields() {
  print_title "测试2: 验证自定义 views 和 fields"
  
  print_test "创建表（自定义 views 和 fields）"
  
  RESPONSE=$(curl -s -X POST "${API_BASE_URL}/bases/${BASE_ID}/tables" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"name\": \"Custom Table $(date +%s)\",
      \"description\": \"自定义视图和字段\",
      \"views\": [
        {\"name\": \"My Grid\", \"type\": \"grid\"},
        {\"name\": \"My Kanban\", \"type\": \"kanban\"}
      ],
      \"fields\": [
        {\"name\": \"title\", \"type\": \"text\", \"isPrimary\": true},
        {\"name\": \"count\", \"type\": \"number\"}
      ]
    }")
  
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  if [ "$SUCCESS" != "true" ]; then
    print_fail "创建表失败"
    echo "$RESPONSE" | jq .
    return 1
  fi
  
  print_success "表创建成功"
  
  TABLE_ID=$(echo "$RESPONSE" | jq -r '.data.id')
  DEFAULT_VIEW_ID=$(echo "$RESPONSE" | jq -r '.data.defaultViewId')
  FIELD_COUNT=$(echo "$RESPONSE" | jq -r '.data.fieldCount')
  
  echo "  - Table ID: $TABLE_ID"
  echo "  - Default View ID: $DEFAULT_VIEW_ID"
  echo "  - Field Count: $FIELD_COUNT"
  
  # 验证字段数量
  print_test "验证字段数量"
  if [ "$FIELD_COUNT" != "2" ]; then
    print_fail "字段数量不正确，期望: 2, 实际: $FIELD_COUNT"
    return 1
  fi
  print_success "字段数量正确: $FIELD_COUNT"
  
  # 获取视图列表
  print_test "验证视图列表"
  VIEWS_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/tables/${TABLE_ID}/views" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  VIEWS_COUNT=$(echo "$VIEWS_RESPONSE" | jq -r '.data | length')
  FIRST_VIEW_NAME=$(echo "$VIEWS_RESPONSE" | jq -r '.data[0].name')
  
  if [ "$VIEWS_COUNT" -lt 2 ]; then
    print_warn "视图数量少于预期，期望: 2, 实际: $VIEWS_COUNT"
  else
    print_success "视图数量: $VIEWS_COUNT"
  fi
  
  # 验证第一个视图为默认视图
  print_test "验证默认视图"
  FIRST_VIEW_ID=$(echo "$VIEWS_RESPONSE" | jq -r '.data[0].id')
  if [ "$FIRST_VIEW_ID" != "$DEFAULT_VIEW_ID" ]; then
    print_fail "默认视图ID不匹配"
    return 1
  fi
  print_success "默认视图正确: $FIRST_VIEW_NAME ($DEFAULT_VIEW_ID)"
}

# 主函数
main() {
  print_title "默认视图创建功能测试"
  echo "对齐 Teable 实现验证"
  
  # 检查环境
  check_env
  
  # 运行测试
  test_default_injection
  test_custom_views_fields
  
  # 输出结果
  print_title "测试结果汇总"
  echo "总测试数: $TOTAL_TESTS"
  echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
  echo -e "${RED}失败: $FAILED_TESTS${NC}"
  echo "=========================================="
  
  # 返回退出码
  if [ $FAILED_TESTS -gt 0 ]; then
    exit 1
  else
    exit 0
  fi
}

# 运行主函数
main

