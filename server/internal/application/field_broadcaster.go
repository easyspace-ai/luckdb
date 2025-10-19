package application

import (
	"fmt"

	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/websocket"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// FieldBroadcasterImpl 字段广播器实现
type FieldBroadcasterImpl struct {
	wsService websocket.Service
}

// NewFieldBroadcaster 创建字段广播器
func NewFieldBroadcaster(wsService websocket.Service) *FieldBroadcasterImpl {
	return &FieldBroadcasterImpl{
		wsService: wsService,
	}
}

// BroadcastFieldCreate 广播字段创建事件
func (b *FieldBroadcasterImpl) BroadcastFieldCreate(tableID string, field *entity.Field) {
	if b.wsService == nil {
		logger.Warn("WebSocket 服务未初始化，跳过字段创建广播")
		return
	}

	// 创建字段创建操作
	operation := &websocket.Operation{
		Type:    websocket.OperationTypeFieldCreate,
		TableID: tableID,
		Data:    field,
	}

	// 创建 WebSocket 消息
	message := &websocket.Message{
		Type: websocket.MessageTypeOp,
		Data: operation,
	}

	// 广播到表级别频道
	channel := fmt.Sprintf("table:%s", tableID)
	if err := b.wsService.BroadcastToChannel(channel, message); err != nil {
		logger.Error("广播字段创建事件失败",
			logger.String("table_id", tableID),
			logger.String("field_id", field.ID().String()),
			logger.ErrorField(err),
		)
	} else {
		logger.Info("字段创建事件已广播",
			logger.String("table_id", tableID),
			logger.String("field_id", field.ID().String()),
		)
	}
}

// BroadcastFieldUpdate 广播字段更新事件
func (b *FieldBroadcasterImpl) BroadcastFieldUpdate(tableID string, field *entity.Field) {
	if b.wsService == nil {
		logger.Warn("WebSocket 服务未初始化，跳过字段更新广播")
		return
	}

	// 创建字段更新操作
	operation := &websocket.Operation{
		Type:    websocket.OperationTypeFieldUpdate,
		TableID: tableID,
		Data:    field,
	}

	// 创建 WebSocket 消息
	message := &websocket.Message{
		Type: websocket.MessageTypeOp,
		Data: operation,
	}

	// 广播到表级别频道
	channel := fmt.Sprintf("table:%s", tableID)
	if err := b.wsService.BroadcastToChannel(channel, message); err != nil {
		logger.Error("广播字段更新事件失败",
			logger.String("table_id", tableID),
			logger.String("field_id", field.ID().String()),
			logger.ErrorField(err),
		)
	} else {
		logger.Info("字段更新事件已广播",
			logger.String("table_id", tableID),
			logger.String("field_id", field.ID().String()),
		)
	}
}

// BroadcastFieldDelete 广播字段删除事件
func (b *FieldBroadcasterImpl) BroadcastFieldDelete(tableID, fieldID string) {
	if b.wsService == nil {
		logger.Warn("WebSocket 服务未初始化，跳过字段删除广播")
		return
	}

	// 创建字段删除操作
	operation := &websocket.Operation{
		Type:    websocket.OperationTypeFieldDelete,
		TableID: tableID,
		Data: map[string]interface{}{
			"field_id": fieldID,
		},
	}

	// 创建 WebSocket 消息
	message := &websocket.Message{
		Type: websocket.MessageTypeOp,
		Data: operation,
	}

	// 广播到表级别频道
	channel := fmt.Sprintf("table:%s", tableID)
	if err := b.wsService.BroadcastToChannel(channel, message); err != nil {
		logger.Error("广播字段删除事件失败",
			logger.String("table_id", tableID),
			logger.String("field_id", fieldID),
			logger.ErrorField(err),
		)
	} else {
		logger.Info("字段删除事件已广播",
			logger.String("table_id", tableID),
			logger.String("field_id", fieldID),
		)
	}
}
