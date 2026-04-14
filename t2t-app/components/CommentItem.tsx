import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Comment } from '@/types/social';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  isSubmitting?: boolean;
}

export const CommentItem = React.memo(function CommentItem({ 
  comment, 
  currentUserId, 
  onDelete, 
  onEdit,
  isSubmitting = false,
}: CommentItemProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const isOwner = currentUserId === comment.user_id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    if (editContent.trim() && onEdit) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      {comment.author?.avatar_url ? (
        <Image source={{ uri: comment.author.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: theme.teal }]}>
          <Text style={styles.placeholderText}>
            {comment.author?.display_name?.charAt(0) || comment.author?.username?.charAt(0) || '?'}
          </Text>
        </View>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[styles.authorName, { color: theme.textPrimary }]}>
            {comment.author?.display_name || comment.author?.username || t('common.anonymous')}
          </Text>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>{formatDate(comment.created_at)}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.editInput, { color: theme.textPrimary, borderColor: theme.border }]}
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
          <Text style={[styles.contentText, { color: theme.textSecondary }]}>{comment.content}</Text>
        )}
      </View>

      {isOwner && !isEditing && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(comment.id)}>
              <Ionicons name="trash-outline" size={16} color={theme.red} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontWeight: '600',
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
  },
  contentText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionBtn: {
    padding: 8,
  },
  deleteBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  editContainer: {
    gap: 8,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
