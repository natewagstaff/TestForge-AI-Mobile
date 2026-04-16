import { Stack, router } from 'expo-router';
import { useEffect } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { initServerUrl } from '../api/testforge';

/** Inner layout — redirects to login if the user is not authenticated. */
function RootNavigator() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace('/login');
    } else {
      router.replace('/(tabs)');
    }
  }, [token, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="login"  options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => { initServerUrl(); }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
