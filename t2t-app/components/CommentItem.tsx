import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Comment } from '@/types/social';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

export function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const isOwner = currentUserId === comment.user_id;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {comment.author?.avatar_url ? (
        <Image source={{ uri: comment.author.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholderAvatar]}>
          <Text style={styles.placeholderText}>
            {comment.author?.display_name?.charAt(0) || comment.author?.username?.charAt(0) || '?'}
          </Text>
        </View>
      )}

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.authorName}>
            {comment.author?.display_name || comment.author?.username || 'Utente sconosciuto'}
          </Text>
          <Text style={styles.dateText}>{formatDate(comment.created_at)}</Text>
        </View>

        <Text style={styles.contentText}>{comment.content}</Text>
      </View>

      {isOwner && onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(comment.id)}>
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
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
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  contentText: {
    fontSize: 14,
    color: '#444',
  },
  deleteBtn: {
    padding: 8,
    alignSelf: 'flex-start',
  },
});
