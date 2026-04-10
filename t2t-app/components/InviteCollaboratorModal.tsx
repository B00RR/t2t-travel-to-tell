import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';

interface ProfileSearchResult {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface InviteCollaboratorModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (username: string) => Promise<{ ok: boolean; errorKey?: string }>;
  excludedUserIds?: string[];
}

export function InviteCollaboratorModal({
  visible,
  onClose,
  onInvite,
  excludedUserIds = [],
}: InviteCollaboratorModalProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  const excluded = useMemo(() => new Set(excludedUserIds), [excludedUserIds]);

  const searchProfiles = useCallback(async (q: string) => {
    const trimmed = q.trim().replace(/^@/, '');
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .ilike('username', `%${trimmed}%`)
      .limit(10);

    if (!error && data) {
      setResults(data as ProfileSearchResult[]);
    } else {
      setResults([]);
    }
    setSearching(false);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(() => searchProfiles(query), 300);
    return () => clearTimeout(handle);
  }, [query, visible, searchProfiles]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setInviting(null);
    }
  }, [visible]);

  const handleInvite = async (profile: ProfileSearchResult) => {
    if (!profile.username) return;
    setInviting(profile.id);
    const { ok, errorKey } = await onInvite(profile.username);
    setInviting(null);

    if (ok) {
      Alert.alert(t('common.success'), t('collab.invite_sent'));
      onClose();
    } else {
      Alert.alert(t('common.error'), t(errorKey || 'collab.invite_error'));
    }
  };

  const renderItem = ({ item }: { item: ProfileSearchResult }) => {
    const isExcluded = excluded.has(item.id);
    const name = item.display_name || item.username || '—';
    return (
      <View
        style={[
          styles.resultRow,
          { backgroundColor: theme.bgSurface, borderColor: theme.border },
        ]}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.bgElevated }]}>
            <Text style={[styles.avatarInitial, { color: theme.textPrimary }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={[styles.resultName, { color: theme.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          {item.username ? (
            <Text style={[styles.resultHandle, { color: theme.textMuted }]} numberOfLines={1}>
              @{item.username}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => handleInvite(item)}
          disabled={isExcluded || inviting === item.id || !item.username}
          style={[
            styles.inviteBtn,
            {
              backgroundColor: isExcluded ? theme.bgElevated : theme.teal,
              opacity: isExcluded || inviting === item.id ? 0.6 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('collab.invite')}
        >
          {inviting === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.inviteBtnText}>{t('collab.invite')}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.sheet, { backgroundColor: theme.bg }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              {t('collab.invite_title')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Ionicons name="close" size={26} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchInput,
              { backgroundColor: theme.bgSurface, borderColor: theme.border },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('collab.invite_placeholder')}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.textPrimary }]}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={theme.teal} />}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.trim().length >= 2 && !searching ? (
                <Text style={[styles.empty, { color: theme.textMuted }]}>
                  {t('collab.user_not_found')}
                </Text>
              ) : null
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    paddingBottom: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
  },
  resultHandle: {
    fontSize: 12,
    marginTop: 1,
  },
  inviteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    minWidth: 72,
    alignItems: 'center',
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 24,
  },
});
