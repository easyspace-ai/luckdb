/**
 * Comment Panel Component
 * 评论面板
 */

import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { CommentList } from './CommentList';

export interface IComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdTime: string;
  updatedTime?: string;
  mentions?: string[];
  replies?: IComment[];
}

export interface ICommentPanelProps {
  recordId: string;
  onAddComment?: (content: string, mentions: string[]) => Promise<void>;
  onEditComment?: (commentId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  onReplyComment?: (commentId: string, content: string, mentions: string[]) => Promise<void>;
}

export const CommentPanel: FC<ICommentPanelProps> = ({
  recordId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onReplyComment,
}) => {
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);

  useEffect(() => {
    // 模拟加载评论
    const loadComments = async () => {
      setIsLoading(true);
      try {
        // TODO: 从API加载实际评论
        const mockComments: IComment[] = [
          {
            id: '1',
            content: '这条记录需要更新',
            authorId: 'user1',
            authorName: '张三',
            createdTime: new Date(Date.now() - 86400000).toISOString(),
            replies: [
              {
                id: '1-1',
                content: '好的，我来处理',
                authorId: 'user2',
                authorName: '李四',
                createdTime: new Date(Date.now() - 43200000).toISOString(),
              },
            ],
          },
          {
            id: '2',
            content: '@张三 已经完成更新了',
            authorId: 'user2',
            authorName: '李四',
            createdTime: new Date(Date.now() - 3600000).toISOString(),
            mentions: ['user1'],
          },
        ];

        setComments(mockComments);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [recordId]);

  const handleSend = useCallback(async () => {
    if (!content.trim() || !onAddComment) return;

    setIsSending(true);
    try {
      await onAddComment(content, mentions);
      
      // 添加到本地列表
      const newComment: IComment = {
        id: `temp_${Date.now()}`,
        content,
        authorId: 'current_user',
        authorName: '当前用户',
        createdTime: new Date().toISOString(),
        mentions,
      };

      setComments(prev => [...prev, newComment]);
      setContent('');
      setMentions([]);
    } catch (error) {
      console.error('Failed to send comment:', error);
      alert('发送评论失败');
    } finally {
      setIsSending(false);
    }
  }, [content, mentions, onAddComment]);

  const handleEdit = useCallback(async (commentId: string, newContent: string) => {
    if (!onEditComment) return;

    try {
      await onEditComment(commentId, newContent);
      
      // 更新本地列表
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? { ...comment, content: newContent, updatedTime: new Date().toISOString() }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to edit comment:', error);
      alert('编辑评论失败');
    }
  }, [onEditComment]);

  const handleDelete = useCallback(async (commentId: string) => {
    if (!onDeleteComment) return;

    const confirmed = confirm('确定要删除这条评论吗？');
    if (!confirmed) return;

    try {
      await onDeleteComment(commentId);
      
      // 从本地列表删除
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('删除评论失败');
    }
  }, [onDeleteComment]);

  const handleReply = useCallback(async (
    commentId: string,
    replyContent: string,
    replyMentions: string[]
  ) => {
    if (!onReplyComment) return;

    try {
      await onReplyComment(commentId, replyContent, replyMentions);
      
      // 添加到本地列表
      const newReply: IComment = {
        id: `temp_reply_${Date.now()}`,
        content: replyContent,
        authorId: 'current_user',
        authorName: '当前用户',
        createdTime: new Date().toISOString(),
        mentions: replyMentions,
      };

      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Failed to reply comment:', error);
      alert('回复评论失败');
    }
  }, [onReplyComment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">加载评论...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment List */}
      <CommentList
        comments={comments}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReply={handleReply}
      />

      {/* New Comment Input */}
      <div className="border rounded-lg p-4">
        <div className="mb-2 text-sm font-medium text-gray-700">添加评论</div>
        <RichTextEditor
          value={content}
          onChange={setContent}
          onMention={(userId) => {
            if (!mentions.includes(userId)) {
              setMentions(prev => [...prev, userId]);
            }
          }}
          placeholder="输入评论内容，使用 @ 提及其他用户..."
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleSend}
            disabled={isSending || !content.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
};

