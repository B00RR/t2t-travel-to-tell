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

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

type Format = 'bold' | 'italic' | 'bullet';

export function RichTextInput({ value, onChangeText, placeholder, autoFocus }: Props) {
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
      // Insert a bullet at the beginning of the current line
      const lineStart = before.lastIndexOf('\n') + 1;
      const linePrefix = value.slice(lineStart, start);
      if (linePrefix.startsWith('- ')) {
        // Remove bullet
        newText = value.slice(0, lineStart) + value.slice(lineStart + 2);
        cursorOffset = -2;
      } else {
        // Add bullet
        newText = value.slice(0, lineStart) + '- ' + value.slice(lineStart);
        cursorOffset = 2;
      }
    } else if (start === end) {
      // No selection: insert placeholder
      const marker = fmt === 'bold' ? '**testo**' : '*testo*';
      const innerLen = fmt === 'bold' ? 5 : 5; // "testo"
      newText = before + marker + after;
      // Position cursor inside the markers
      const newPos = start + (fmt === 'bold' ? 2 : 1);
      cursorOffset = newPos - start;
      onChangeText(newText);
      // Set selection to select the placeholder word
      setTimeout(() => {
        inputRef.current?.setNativeProps({
          selection: { start: newPos, end: newPos + innerLen },
        });
      }, 50);
      return;
    } else {
      // Wrap selected text
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
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        autoFocus={autoFocus}
      />
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormat('bold')}>
          <Text style={styles.boldIcon}>B</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormat('italic')}>
          <Text style={styles.italicIcon}>I</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => applyFormat('bullet')}>
          <Ionicons name="list-outline" size={18} color="#555" />
        </TouchableOpacity>
        <View style={styles.hint}>
          <Text style={styles.hintText}>**grassetto**  *corsivo*  - lista</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
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
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  boldIcon: {
    fontWeight: '800',
    fontSize: 15,
    color: '#333',
  },
  italicIcon: {
    fontStyle: 'italic',
    fontWeight: '700',
    fontSize: 15,
    color: '#333',
  },
  hint: {
    flex: 1,
    alignItems: 'flex-end',
  },
  hintText: {
    fontSize: 11,
    color: '#bbb',
    fontFamily: 'monospace',
  },
});
