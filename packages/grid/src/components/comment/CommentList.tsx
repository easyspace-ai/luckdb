/**
 * Comment List Component
 * 评论列表
 */

import { FC, useState, useCallback } from 'react';
import type { IComment } from './CommentPanel';
import { RichTextEditor } from './RichTextEditor';

export interface ICommentListProps {
  comments: IComment[];
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onReply: (commentId: string, content: string, mentions: string[]) => void;
}

export const CommentList: FC<ICommentListProps> = ({
  comments,
  onEdit,
  onDelete,
  onReply,
}) => {
  if (comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">暂无评论</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
    </div>
  );
};

interface ICommentItemProps {
  comment: IComment;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onReply: (commentId: string, content: string, mentions: string[]) => void;
  isReply?: boolean;
}

const CommentItem: FC<ICommentItemProps> = ({
  comment,
  onEdit,
  onDelete,
  onReply,
  isReply = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyMentions, setReplyMentions] = useState<string[]>([]);

  const handleSaveEdit = useCallback(() => {
    onEdit(comment.id, editContent);
    setIsEditing(false);
  }, [comment.id, editContent, onEdit]);

  const handleCancelEdit = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(false);
  }, [comment.content]);

  const handleSendReply = useCallback(() => {
    if (!replyContent.trim()) return;
    
    onReply(comment.id, replyContent, replyMentions);
    setReplyContent('');
    setReplyMentions([]);
    setShowReplyInput(false);
  }, [comment.id, replyContent, replyMentions, onReply]);

  return (
    <div className={`${isReply ? 'ml-8' : ''}`}>
      <div className="border rounded-lg p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.authorAvatar ? (
              <img
                src={comment.authorAvatar}
                alt={comment.authorName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                {comment.authorName[0]}
              </div>
            )}
            <div>
              <div className="font-medium">{comment.authorName}</div>
              <div className="text-xs text-gray-500">
                {formatTimestamp(comment.createdTime)}
                {comment.updatedTime && ' (已编辑)'}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              编辑
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              删除
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor
              value={editContent}
              onChange={setEditContent}
              placeholder="编辑评论..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap">
            {comment.content}
          </div>
        )}

        {/* Actions */}
        {!isEditing && !isReply && (
          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showReplyInput ? '取消回复' : '回复'}
          </button>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-4 space-y-2">
            <RichTextEditor
              value={replyContent}
              onChange={setReplyContent}
              onMention={(userId) => {
                if (!replyMentions.includes(userId)) {
                  setReplyMentions(prev => [...prev, userId]);
                }
              }}
              placeholder={`回复 ${comment.authorName}...`}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyContent.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              发送回复
            </button>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={onReply}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return date.toLocaleString('zh-CN');
}

