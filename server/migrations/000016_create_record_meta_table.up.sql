-- 创建记录元数据表（完全动态表架构）
-- 用于快速定位记录所属的表
-- 实际记录数据存储在各个物理表中：bse_xxx.tbl_yyy

CREATE TABLE IF NOT EXISTS record_meta (
    id VARCHAR(50) PRIMARY KEY,
    table_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- 索引
    INDEX idx_record_meta_table (table_id),
    INDEX idx_record_meta_deleted (deleted_at)
);

-- 注释
COMMENT ON TABLE record_meta IS '记录元数据表（完全动态表架构）- 用于快速定位记录';
COMMENT ON COLUMN record_meta.id IS '记录ID';
COMMENT ON COLUMN record_meta.table_id IS '所属表格ID';
COMMENT ON COLUMN record_meta.created_at IS '创建时间';
COMMENT ON COLUMN record_meta.deleted_at IS '删除时间（软删除）';

