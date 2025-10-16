import React, { useState } from 'react';
import { AddFieldDialog } from '../src/components/field-config/AddFieldDialog.v2';

/**
 * AddFieldDialog V2 演示
 * 
 * Airtable 风格的字段创建体验
 */
export function FieldDialogDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState<Array<{ name: string; type: string }>>([]);

  const handleAddField = (name: string, type: string) => {
    setFields([...fields, { name, type }]);
    console.log('✅ 创建字段:', { name, type });
  };

  return (
    <div style={{ 
      padding: '40px',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 演示头部 */}
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '12px',
        }}>
          🎨 Airtable 风格字段创建对话框
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '24px',
        }}>
          激进重构版本 - 两步式创建流程，智能分类，流畅动画
        </p>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: 'white',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 200ms',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}
          >
            ➕ 添加新字段
          </button>

          {fields.length > 0 && (
            <button
              onClick={() => setFields([])}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#64748b',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              🗑️ 清空列表
            </button>
          )}
        </div>
      </div>

      {/* 特性说明 */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {[
          {
            emoji: '🎯',
            title: '两步式流程',
            description: '先选择类型，再配置详情，流程清晰不混乱',
          },
          {
            emoji: '🔍',
            title: '智能搜索',
            description: '支持中英文搜索，快速定位需要的字段类型',
          },
          {
            emoji: '📚',
            title: '分类展示',
            description: '按功能分类，常用字段快速访问',
          },
          {
            emoji: '✨',
            title: '流畅动画',
            description: '入场动画、悬停效果、状态过渡都很丝滑',
          },
        ].map((feature, index) => (
          <div
            key={index}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>
              {feature.emoji}
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '8px',
            }}>
              {feature.title}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.6',
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* 已创建的字段列表 */}
      {fields.length > 0 && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: '16px',
          }}>
            已创建的字段 ({fields.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {fields.map((field, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  animation: 'slideInFromLeft 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0369a1',
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#0f172a',
                  }}>
                    {field.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#64748b',
                  }}>
                    类型: {field.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 对话框 */}
      <AddFieldDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleAddField}
      />

      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default FieldDialogDemo;

