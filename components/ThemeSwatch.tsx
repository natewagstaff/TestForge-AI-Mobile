import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

type Props = {
  theme: Theme;
  size?: number;
};

/** Renders a small horizontal color strip previewing a theme's key colors. */
export default function ThemeSwatch({ theme, size = 14 }: Props) {
  const colors = [theme.bg, theme.surface, theme.accent, theme.green, theme.red, theme.purple];
  return (
    <View style={[styles.row, { height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
      {colors.map((color, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: 72,
  },
});
