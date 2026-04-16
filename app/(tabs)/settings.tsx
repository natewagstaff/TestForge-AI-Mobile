import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { THEMES, THEME_CATEGORIES } from '../../constants/theme';
import ThemeSwatch from '../../components/ThemeSwatch';
import { getServerUrl, setServerUrl } from '../../api/testforge';

/** Settings screen — lets the user browse and select a theme, organized by category. */
export default function SettingsScreen() {
  const { theme, themeKey, setThemeKey } = useTheme();
  const { user, signOut } = useAuth();

  const [serverDraft, setServerDraft] = useState('');
  const [serverSaved, setServerSaved] = useState(false);

  useEffect(() => {
    setServerDraft(getServerUrl());
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

      {/* Server URL */}
      <Text style={[styles.heading, { color: theme.textBright, marginBottom: 16 }]}>Server</Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginBottom: 24, padding: 14 }]}>
        <Text style={[styles.categoryLabel, { color: theme.textMuted, marginBottom: 6, marginLeft: 0 }]}>
          SERVER URL
        </Text>
        <TextInput
          value={serverDraft}
          onChangeText={v => { setServerDraft(v); setServerSaved(false); }}
          style={[styles.serverInput, { color: theme.textBright, borderColor: theme.border, backgroundColor: theme.bg }]}
          placeholder="http://192.168.1.100:3000"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={[styles.serverHint, { color: theme.textMuted }]}>
          Host and port only — do not include /api
        </Text>
        <TouchableOpacity
          onPress={async () => { await setServerUrl(serverDraft); setServerSaved(true); }}
          style={[styles.saveBtn, { backgroundColor: theme.accent }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: theme.bg }]}>
            {serverSaved ? 'Saved ✓' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

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
  serverInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 6,
  },
  serverHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  saveBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
