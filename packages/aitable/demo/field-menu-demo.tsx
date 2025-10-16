import React, { useState, useRef } from 'react';
import { AddFieldMenu } from '../src/components/field-config/AddFieldMenu';
import { tokens } from '../src/grid/design-system';

/**
 * 字段菜单演示页面
 * 展示 Airtable 风格的字段添加菜单
 */
export function FieldMenuDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleFieldSelect = (fieldType: string) => {
    setSelectedField(fieldType);
    console.log('选择的字段类型:', fieldType);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.colors.surface.base,
        padding: '40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: tokens.colors.text.primary,
            marginBottom: '8px',
          }}
        >
          Airtable 风格字段菜单演示
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: tokens.colors.text.secondary,
            marginBottom: '40px',
          }}
        >
          点击下方的 + 号按钮体验 Airtable 风格的字段添加菜单
        </p>

        {/* 模拟表头 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: tokens.colors.surface.base,
            border: `1px solid ${tokens.colors.border.subtle}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: tokens.colors.surface.hover,
                borderRadius: '6px',
                fontSize: '13px',
                color: tokens.colors.text.primary,
                fontWeight: 500,
              }}
            >
              文本
            </div>
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: tokens.colors.surface.hover,
                borderRadius: '6px',
                fontSize: '13px',
                color: tokens.colors.text.primary,
                fontWeight: 500,
              }}
            >
              数字
            </div>
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: tokens.colors.surface.hover,
                borderRadius: '6px',
                fontSize: '13px',
                color: tokens.colors.text.primary,
                fontWeight: 500,
              }}
            >
              日期
            </div>
          </div>

          {/* + 号按钮 */}
          <button
            ref={triggerRef}
            onClick={() => setIsMenuOpen(true)}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: tokens.colors.surface.base,
              border: `1px solid ${tokens.colors.border.subtle}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              color: tokens.colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.surface.hover;
              e.currentTarget.style.borderColor = tokens.colors.border.default;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = tokens.colors.surface.base;
              e.currentTarget.style.borderColor = tokens.colors.border.subtle;
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* 选择结果显示 */}
        {selectedField && (
          <div
            style={{
              padding: '16px',
              backgroundColor: tokens.colors.surface.hover,
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: tokens.colors.text.primary,
                marginBottom: '8px',
              }}
            >
              选择的字段类型
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: tokens.colors.text.secondary,
                margin: 0,
              }}
            >
              字段类型: <strong>{selectedField}</strong>
            </p>
          </div>
        )}

        {/* 特性说明 */}
        <div
          style={{
            padding: '24px',
            backgroundColor: tokens.colors.surface.base,
            border: `1px solid ${tokens.colors.border.subtle}`,
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: tokens.colors.text.primary,
              marginBottom: '16px',
            }}
          >
            🎯 菜单特性
          </h3>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {[
              '✨ 智能定位 - 自动在 + 号下方显示，防止被遮挡',
              '🔍 实时搜索 - 支持按字段名称和描述搜索',
              '📂 分类筛选 - 按基础、选择、日期等分类浏览',
              '⭐ 常用标记 - 突出显示常用字段类型',
              '🎨 精致设计 - 紧凑的尺寸，适合菜单显示',
              '⌨️ 键盘支持 - 支持 ESC 关闭，Enter 选择',
              '📱 响应式 - 自动调整位置适应不同屏幕',
            ].map((feature, index) => (
              <li
                key={index}
                style={{
                  fontSize: '14px',
                  color: tokens.colors.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* 使用说明 */}
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: tokens.colors.surface.hover,
            border: `1px solid ${tokens.colors.border.subtle}`,
            borderRadius: '8px',
          }}
        >
          <h4
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: tokens.colors.text.primary,
              marginBottom: '12px',
            }}
          >
            💡 使用说明
          </h4>
          <ol
            style={{
              fontSize: '14px',
              color: tokens.colors.text.secondary,
              paddingLeft: '20px',
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            <li>点击表头右侧的 + 号按钮打开字段菜单</li>
            <li>使用搜索框快速查找字段类型</li>
            <li>点击分类标签筛选不同类型的字段</li>
            <li>点击字段类型即可选择并创建</li>
            <li>按 ESC 键或点击外部区域关闭菜单</li>
          </ol>
        </div>
      </div>

      {/* 字段菜单 */}
      <AddFieldMenu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        onSelect={handleFieldSelect}
        triggerRef={triggerRef}
      />
    </div>
  );
}

export default FieldMenuDemo;
