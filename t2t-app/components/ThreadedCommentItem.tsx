import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Comment } from '@/types/social';
import type { CommentThread } from '@/utils/commentUtils';
import { Radius } from '@/constants/theme';

interface ThreadedCommentItemProps {
  thread: CommentThread;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  onReply?: (parentId: string, content: string) => void;
  isSubmitting?: boolean;
  depth?: number;
  maxDepth?: number;
}

export const ThreadedCommentItem = React.memo(function ThreadedCommentItem({
  thread,
  currentUserId,
  onDelete,
  onEdit,
  onReply,
  isSubmitting = false,
  depth = 0,
  maxDepth = 3,
}: ThreadedCommentItemProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const isOwner = currentUserId === thread.comment.user_id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thread.comment.content);
  const [showReplies, setShowReplies] = useState(depth < 1);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = () => {
    if (editContent.trim() === thread.comment.content) {
      setIsEditing(false);
      return;
    }
    if (editContent.trim() && onEdit) {
      onEdit(thread.comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(thread.comment.content);
    setIsEditing(false);
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !onReply) return;
    onReply(thread.comment.id, replyContent.trim());
    setReplyContent('');
    setIsReplying(false);
    setShowReplies(true);
  };

  const leftMargin = depth * 24;
  const canShowReplies = thread.replies.length > 0 && depth < maxDepth;

  return (
    <View style={[styles.container, { marginLeft: leftMargin }]}>
      <View style={[styles.commentBox, { borderLeftColor: depth > 0 ? theme.border : 'transparent', borderLeftWidth: depth > 0 ? 2 : 0 }]}>
        {thread.comment.author?.avatar_url ? (
          <Image source={{ uri: thread.comment.author.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.teal }]}>
            <Text style={styles.placeholderText}>
              {thread.comment.author?.display_name?.charAt(0) || thread.comment.author?.username?.charAt(0) || '?'}
            </Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.authorName, { color: theme.textPrimary }]}>
              {thread.comment.author?.display_name || thread.comment.author?.username || t('common.anonymous')}
            </Text>
            <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(thread.comment.created_at)}</Text>
          </View>

          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgElevated }]}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancelEdit} style={styles.editBtn}>
                  <Text style={[styles.editBtnText, { color: theme.textMuted }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSaveEdit} 
                  style={[styles.editBtn, { backgroundColor: theme.teal }]}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.editBtnText, { color: '#fff' }]}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={[styles.contentText, { color: theme.textSecondary }]}>{thread.comment.content}</Text>
          )}

          <View style={styles.actions}>
            {onReply && depth < maxDepth && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsReplying(!isReplying)}>
                <Ionicons name="chatbubble-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.actionText, { color: theme.textMuted }]}>{t('social.reply')}</Text>
              </TouchableOpacity>
            )}
            {isOwner && !isEditing && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.actionText, { color: theme.textMuted }]}>{t('common.edit')}</Text>
              </TouchableOpacity>
            )}
            {isOwner && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete?.(thread.comment.id)}>
                <Ionicons name="trash-outline" size={14} color={theme.red} />
              </TouchableOpacity>
            )}
          </View>

          {isReplying && (
            <View style={[styles.replyContainer, { backgroundColor: theme.bgElevated }]}>
              <TextInput
                style={[styles.replyInput, { color: theme.textPrimary, borderColor: theme.border }]}
                value={replyContent}
                onChangeText={setReplyContent}
                placeholder={t('social.add_reply')}
                placeholderTextColor={theme.textMuted}
                multiline
                autoFocus
              />
              <View style={styles.replyActions}>
                <TouchableOpacity onPress={() => { setIsReplying(false); setReplyContent(''); }} style={styles.replyCancelBtn}>
                  <Text style={[styles.replyCancelText, { color: theme.textMuted }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSubmitReply} 
                  style={[styles.replySubmitBtn, { backgroundColor: theme.teal }, (!replyContent.trim() || isSubmitting) && styles.replySubmitDisabled]}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  <Text style={styles.replySubmitText}>{t('social.reply')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {canShowReplies && (
        <TouchableOpacity style={styles.toggleReplies} onPress={() => setShowReplies(!showReplies)}>
          <Ionicons 
            name={showReplies ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={theme.teal} 
          />
          <Text style={[styles.toggleRepliesText, { color: theme.teal }]}>
            {showReplies 
              ? t('social.hide_replies', { count: thread.replyCount })
              : t('social.show_replies', { count: thread.replyCount })}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && thread.replies.map(replyThread => (
        <ThreadedCommentItem
          key={replyThread.comment.id}
          thread={replyThread}
          currentUserId={currentUserId}
          onDelete={onDelete}
          onEdit={onEdit}
          onReply={onReply}
          isSubmitting={isSubmitting}
          depth={depth + 1}
          maxDepth={maxDepth}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  commentBox: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 13,
  },
  dateText: {
    fontSize: 11,
  },
  contentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
  },
  editContainer: {
    gap: 8,
    marginTop: 4,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 8,
    fontSize: 13,
    minHeight: 50,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyContainer: {
    marginTop: 8,
    padding: 10,
    borderRadius: Radius.md,
    gap: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 8,
    fontSize: 13,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  replyCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  replyCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replySubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  replySubmitDisabled: {
    opacity: 0.5,
  },
  replySubmitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleReplies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 40,
  },
  toggleRepliesText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
