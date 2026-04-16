import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { THEMES, THEME_CATEGORIES } from '../../constants/theme';
import ThemeSwatch from '../../components/ThemeSwatch';

/** Settings screen — lets the user browse and select a theme, organized by category. */
export default function SettingsScreen() {
  const { theme, themeKey, setThemeKey } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

      {/* User + logout */}
      <View style={[styles.userRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View>
          <Text style={[styles.userName, { color: theme.textBright }]}>{user?.name}</Text>
          <Text style={[styles.userRole, { color: theme.textMuted }]}>{user?.role}</Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          style={[styles.logoutBtn, { borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.logoutText, { color: theme.red }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.heading, { color: theme.textBright }]}>Themes</Text>
      <Text style={[styles.subheading, { color: theme.textMuted }]}>
        {Object.keys(THEMES).length} themes available
      </Text>

      {THEME_CATEGORIES.map(category => (
        <View key={category.label} style={styles.section}>
          <Text style={[styles.categoryLabel, { color: theme.accent }]}>
            {category.label.toUpperCase()}
          </Text>

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {category.keys.map((key, index) => {
              const t = THEMES[key];
              if (!t) return null;
              const isActive = key === themeKey;
              const isLast = index === category.keys.length - 1;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setThemeKey(key)}
                  style={[
                    styles.row,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
                    isActive && { backgroundColor: theme.surfaceRaised },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{t.emoji}</Text>
                  <View style={styles.info}>
                    <Text style={[styles.themeName, { color: isActive ? theme.accent : theme.text }]}>
                      {t.name}
                    </Text>
                    <ThemeSwatch theme={t} size={10} />
                  </View>
                  {isActive && (
                    <Text style={[styles.check, { color: theme.accent }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emoji: {
    fontSize: 20,
    width: 32,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '500',
  },
  check: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});
