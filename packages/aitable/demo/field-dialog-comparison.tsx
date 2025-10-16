import React, { useState } from 'react';
import { AddFieldDialog } from '../src/components/field-config/AddFieldDialog';
import { AddFieldDialog as AddFieldDialogV2 } from '../src/components/field-config/AddFieldDialog.v2';

/**
 * 新旧版本对比演示
 * 
 * 直观展示激进重构带来的体验提升
 */
export function FieldDialogComparison() {
  const [oldDialogOpen, setOldDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [fields, setFields] = useState<Array<{ name: string; type: string; version: string }>>([]);

  const handleAddField = (version: string) => (name: string, type: string, config?: any) => {
    setFields([...fields, { name, type, version }]);
    console.log(`[${version}] 创建字段:`, { name, type, config });
  };

  return (
    <div style={{ 
      padding: '40px',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* 标题 */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          字段创建对话框 - 新旧版本对比
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          体验 Airtable 风格激进重构带来的设计飞跃
        </p>
      </div>

      {/* 对比卡片 */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginBottom: '40px',
      }}>
        {/* 旧版本 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          transition: 'all 300ms',
        }}>
          {/* 卡片头部 */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)',
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: '#64748b',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '4px',
              marginBottom: '12px',
            }}>
              旧版本
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '8px',
            }}>
              基础功能版
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.6',
            }}>
              传统的单步式创建流程，所有配置项一次性展示
            </p>
          </div>

          {/* 特性列表 */}
          <div style={{ padding: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '12px',
            }}>
              特性：
            </h3>
            <ul style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '2',
              paddingLeft: '20px',
            }}>
              <li>单步式创建流程</li>
              <li>所有类型平铺展示</li>
              <li>基础网格布局</li>
              <li>简单的 hover 效果</li>
              <li>功能性设计</li>
            </ul>

            <button
              onClick={() => setOldDialogOpen(true)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                backgroundColor: '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#64748b';
              }}
            >
              体验旧版本
            </button>
          </div>
        </div>

        {/* 新版本 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '2px solid #3b82f6',
          overflow: 'hidden',
          transition: 'all 300ms',
          position: 'relative',
        }}>
          {/* 推荐标签 */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px 12px',
            backgroundColor: '#22c55e',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
          }}>
            ⭐ 推荐
          </div>

          {/* 卡片头部 */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '4px',
              marginBottom: '12px',
            }}>
              新版本 V2
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '8px',
            }}>
              Airtable 风格
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.6',
            }}>
              激进重构，两步式流程，智能分类，流畅动画
            </p>
          </div>

          {/* 特性列表 */}
          <div style={{ padding: '24px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '12px',
            }}>
              特性：
            </h3>
            <ul style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '2',
              paddingLeft: '20px',
            }}>
              <li>✅ 两步式创建流程（类型选择 → 配置）</li>
              <li>✅ 6大智能分类 + 常用标记</li>
              <li>✅ 实时搜索（中英文、关键词）</li>
              <li>✅ 字段类型专属配置面板</li>
              <li>✅ 流畅入场动画 + Stagger 效果</li>
              <li>✅ 精致的 Hover 微交互</li>
              <li>✅ 完整的 TypeScript 类型</li>
            </ul>

            <button
              onClick={() => setNewDialogOpen(true)}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.2)';
              }}
            >
              体验新版本 🚀
            </button>
          </div>
        </div>
      </div>

      {/* 对比表格 */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        marginBottom: '40px',
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#0f172a',
          }}>
            详细对比
          </h2>
        </div>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                维度
              </th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                旧版本
              </th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                新版本（Airtable 风格）
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ['流程', '单步（同时选择+配置）', '两步（先选择→再配置）'],
              ['分类', '❌ 无分类，15个类型平铺', '✅ 6大分类 + 常用标记'],
              ['搜索', '❌ 无', '✅ 实时搜索 + 关键词'],
              ['布局', '网格自适应（minmax）', '固定2列 + 平滑过渡'],
              ['图标', '20px 小图标', '40px 大图标 + 背景色块'],
              ['动画', '简单淡入', '入场动画 + Stagger + Hover'],
              ['配置', '基础配置', '类型专属配置面板'],
              ['示例', '❌ 无', '✅ 每个类型都有示例'],
              ['体验', '功能性', '愉悦性'],
            ].map((row, index) => (
              <tr key={index} style={{
                borderTop: '1px solid #e5e7eb',
              }}>
                <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                  {row[0]}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748b' }}>
                  {row[1]}
                </td>
                <td style={{ padding: '16px 24px', fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                  {row[2]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 创建记录 */}
      {fields.length > 0 && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#0f172a',
            }}>
              创建记录 ({fields.length})
            </h2>
            <button
              onClick={() => setFields([])}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: '#64748b',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              清空
            </button>
          </div>
          
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
                }}
              >
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: field.version === 'V2' ? '#3b82f6' : '#64748b',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                }}>
                  {field.version}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                    {field.name}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                    ({field.type})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 对话框 */}
      <AddFieldDialog
        isOpen={oldDialogOpen}
        onClose={() => setOldDialogOpen(false)}
        onConfirm={(name, type) => {
          handleAddField('旧版本')(name, type);
          setOldDialogOpen(false);
        }}
      />

      <AddFieldDialogV2
        isOpen={newDialogOpen}
        onClose={() => setNewDialogOpen(false)}
        onConfirm={(name, type, config) => {
          handleAddField('V2')(name, type, config);
          setNewDialogOpen(false);
        }}
      />
    </div>
  );
}

export default FieldDialogComparison;

