-- 创建 MCP Token 表
CREATE TABLE IF NOT EXISTS mcp_tokens (
    id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scopes TEXT[],
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_user_id ON mcp_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tokens_token_hash ON mcp_tokens(token_hash);

-- 添加外键约束
ALTER TABLE mcp_tokens 
    ADD CONSTRAINT fk_mcp_tokens_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 添加注释
COMMENT ON TABLE mcp_tokens IS 'MCP API Token表';
COMMENT ON COLUMN mcp_tokens.id IS 'Token ID';
COMMENT ON COLUMN mcp_tokens.user_id IS '关联的用户ID';
COMMENT ON COLUMN mcp_tokens.token_hash IS 'Token SHA256哈希值';
COMMENT ON COLUMN mcp_tokens.name IS 'Token名称';
COMMENT ON COLUMN mcp_tokens.scopes IS 'Token权限范围';
COMMENT ON COLUMN mcp_tokens.expires_at IS '过期时间';
COMMENT ON COLUMN mcp_tokens.last_used_at IS '最后使用时间';

