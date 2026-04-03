/**
 * TextInput with a formatting toolbar supporting Bold, Italic, and Bullet list.
 * Uses Markdown-like syntax: **bold**, *italic*, - bullet
 */
import React, { useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet, NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Radius } from '@/constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

type Format = 'bold' | 'italic' | 'bullet';

export function RichTextInput({ value, onChangeText, placeholder, autoFocus }: Props) {
  const theme = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const selectionRef = useRef({ start: 0, end: 0 });

  const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    selectionRef.current = e.nativeEvent.selection;
  };

  const applyFormat = (fmt: Format) => {
    const { start, end } = selectionRef.current;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);

    let newText = value;
    let cursorOffset = 0;

    if (fmt === 'bullet') {
      const lineStart = before.lastIndexOf('\n') + 1;
      const linePrefix = value.slice(lineStart, start);
      if (linePrefix.startsWith('- ')) {
        newText = value.slice(0, lineStart) + value.slice(lineStart + 2);
        cursorOffset = -2;
      } else {
        newText = value.slice(0, lineStart) + '- ' + value.slice(lineStart);
        cursorOffset = 2;
      }
    } else if (start === end) {
      const marker = fmt === 'bold' ? '**testo**' : '*testo*';
      const innerLen = 5;
      newText = before + marker + after;
      const newPos = start + (fmt === 'bold' ? 2 : 1);
      cursorOffset = newPos - start;
      onChangeText(newText);
      setTimeout(() => {
        inputRef.current?.setNativeProps({
          selection: { start: newPos, end: newPos + innerLen },
        });
      }, 50);
      return;
    } else {
      if (fmt === 'bold') {
        if (selected.startsWith('**') && selected.endsWith('**')) {
          newText = before + selected.slice(2, -2) + after;
          cursorOffset = -4;
        } else {
          newText = before + `**${selected}**` + after;
          cursorOffset = 4;
        }
      } else {
        if (selected.startsWith('*') && selected.endsWith('*') && !selected.startsWith('**')) {
          newText = before + selected.slice(1, -1) + after;
          cursorOffset = -2;
        } else {
          newText = before + `*${selected}*` + after;
          cursorOffset = 2;
        }
      }
    }

    onChangeText(newText);
    setTimeout(() => {
      const newEnd = end + cursorOffset;
      inputRef.current?.setNativeProps({ selection: { start: newEnd, end: newEnd } });
    }, 50);
  };

  return (
    <View>
      <TextInput
        ref={inputRef}
        style={[styles.input, { backgroundColor: theme.bgSurface, color: theme.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        autoFocus={autoFocus}
      />
      <View style={styles.toolbar}>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]} onPress={() => applyFormat('bold')}>
          <Text style={[styles.boldIcon, { color: theme.textPrimary }]}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]} onPress={() => applyFormat('italic')}>
          <Text style={[styles.italicIcon, { color: theme.textPrimary }]}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toolBtn, { backgroundColor: theme.bgElevated, borderColor: theme.border }]} onPress={() => applyFormat('bullet')}>
          <Ionicons name="list-outline" size={18} color={theme.textMuted} />
        </TouchableOpacity>
        <View style={styles.hint}>
          <Text style={[styles.hintText, { color: theme.textMuted }]}>**grassetto**  *corsivo*  - lista</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    lineHeight: 22,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  toolBtn: {
    width: 36,
    height: 32,
    borderRadius: Radius.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  boldIcon: {
    fontWeight: '800',
    fontSize: 15,
  },
  italicIcon: {
    fontStyle: 'italic',
    fontWeight: '700',
    fontSize: 15,
  },
  hint: {
    flex: 1,
    alignItems: 'flex-end',
  },
  hintText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
