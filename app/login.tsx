import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { mobileLogin, getServerUrl, setServerUrl } from '../api/testforge';

/** Login screen — authenticates with the TestForge backend and stores a JWT. */
export default function LoginScreen() {
  const { theme }  = useTheme();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const [serverOpen,  setServerOpen]  = useState(false);
  const [serverDraft, setServerDraft] = useState('');
  const [serverSaved, setServerSaved] = useState(false);

  useEffect(() => {
    setServerDraft(getServerUrl());
  }, []);

  async function handleSaveServer() {
    await setServerUrl(serverDraft);
    setServerSaved(true);
  }

  /** Sends credentials to the server; stores the returned JWT on success. */
  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await mobileLogin(username.trim(), password);
      if (data.error) {
        setError(data.error);
      } else {
        await signIn(data.token, data.user);
      }
    } catch (e: any) {
      setError(e?.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={[styles.logo, { color: theme.textBright }]}>TestForge</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Sign in to continue</Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="Username"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="Password"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        {error ? (
          <Text style={[styles.error, { color: theme.red }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={theme.bg} />
            : <Text style={[styles.buttonText, { color: theme.bg }]}>Sign In</Text>
          }
        </TouchableOpacity>

        {/* ── Server URL (collapsible) ── */}
        <TouchableOpacity
          onPress={() => { setServerOpen(o => !o); setServerSaved(false); }}
          style={styles.serverToggle}
          activeOpacity={0.7}
        >
          <Text style={[styles.serverToggleText, { color: theme.textMuted }]}>
            {serverOpen ? '▲ ' : '▼ '}Server
          </Text>
          {!serverOpen && (
            <Text style={[styles.serverUrl, { color: theme.textMuted }]} numberOfLines={1}>
              {getServerUrl()}
            </Text>
          )}
        </TouchableOpacity>

        {serverOpen && (
          <View style={[styles.serverBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              value={serverDraft}
              onChangeText={v => { setServerDraft(v); setServerSaved(false); }}
              style={[styles.serverInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]}
              placeholder="http://192.168.1.100:3000"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity
              onPress={handleSaveServer}
              style={[styles.serverSaveBtn, { backgroundColor: theme.accent }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.serverSaveBtnText, { color: theme.bg }]}>
                {serverSaved ? 'Saved ✓' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    maxWidth: 400,
    alignItems: 'stretch',
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingVertical: 4,
  },
  serverToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serverUrl: {
    fontSize: 12,
    flexShrink: 1,
  },
  serverBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  serverInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  serverSaveBtn: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serverSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
