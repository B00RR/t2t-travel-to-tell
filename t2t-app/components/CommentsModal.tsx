import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Keyboard
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useComments } from '@/hooks/useComments';
import { CommentItem } from './CommentItem';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';

interface CommentsModalProps {
  visible: boolean;
  diaryId: string;
  userId: string | undefined;
  onClose: () => void;
}

export function CommentsModal({ visible, diaryId, userId, onClose }: CommentsModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { comments, loading, submitting, fetchComments, addComment, deleteComment } = useComments();
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (visible && diaryId) {
      fetchComments(diaryId);
    }
  }, [visible, diaryId, fetchComments]);

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return;
    const success = await addComment(diaryId, userId, inputText);
    if (success) {
      setInputText('');
      Keyboard.dismiss();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.bgSurface }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('social.comments')} ({comments.length})</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={28} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.teal} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  currentUserId={userId}
                  onDelete={(id) => deleteComment(id, diaryId)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color={theme.border} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('social.no_comments')}</Text>
                </View>
              }
            />
          )}

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.inputContainer, { borderTopColor: theme.border, backgroundColor: theme.bgSurface }]}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bgElevated, color: theme.textPrimary }]}
                placeholder={userId ? t('social.add_comment') : t('social.login_to_comment')}
                placeholderTextColor={theme.textMuted}
                editable={!!userId && !submitting}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.teal }, (!inputText.trim() || !userId) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || !userId || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
