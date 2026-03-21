/**
 * Renders simple Markdown-like text with support for:
 * **bold**, *italic*, - bullet list items
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  text: string;
  style?: object;
  textStyle?: object;
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function parseInline(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Handle **bold** and *italic* inline markers
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      // **bold**
      segments.push({ text: match[2], bold: true });
    } else if (match[3]) {
      // *italic*
      segments.push({ text: match[4], italic: true });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text: line }];
}

export function RichTextRenderer({ text, style, textStyle }: Props) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <View style={style}>
      {lines.map((line, idx) => {
        const isBullet = line.startsWith('- ') || line.startsWith('• ');
        const content = isBullet ? line.slice(2) : line;
        const segments = parseInline(content);

        return (
          <View key={idx} style={isBullet ? styles.bulletRow : undefined}>
            {isBullet && <Text style={[styles.bullet, textStyle]}>•</Text>}
            <Text style={[styles.line, textStyle]}>
              {segments.map((seg, si) => (
                <Text
                  key={si}
                  style={[
                    seg.bold && styles.bold,
                    seg.italic && styles.italic,
                  ]}
                >
                  {seg.text}
                </Text>
              ))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    flex: 1,
  },
  bold: {
    fontWeight: '700',
    color: '#1a1a1a',
  },
  italic: {
    fontStyle: 'italic',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginTop: 0,
  },
});
