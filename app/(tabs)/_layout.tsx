import { Tabs } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Coverage' }} />
      <Tabs.Screen name="generate"  options={{ title: 'Generate' }} />
      <Tabs.Screen name="testCases" options={{ title: 'Test Cases' }} />
      <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />
    </Tabs>
  );
}
