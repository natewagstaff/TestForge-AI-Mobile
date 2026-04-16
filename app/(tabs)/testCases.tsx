import { getTestCases, deleteTestCases } from '@/api/testforge';
import TestcaseComponent from '@/components/testcase';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Test Cases screen — fetches and displays all test cases; supports multi-select and bulk delete
export default function TestCasesScreen() {
  const { theme } = useTheme();

  const [testCases, setTestCases] = useState<any[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTestCases();
  }, []);

  // Fetches all test cases from the backend and updates state
  function loadTestCases() {
    getTestCases().then(data => setTestCases(data));
  }

  // Toggles whether a test case is selected
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Exits selection mode and clears the selection
  function cancelSelect() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  // Prompts the user to confirm, then deletes all selected test cases
  function handleDelete() {
    const count = selectedIds.size;
    Alert.alert(
      'Delete Test Cases',
      `Delete ${count} test case${count !== 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteTestCases([...selectedIds]);
              setTestCases(prev => prev.filter(tc => !selectedIds.has(tc.tc_id)));
              cancelSelect();
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* ── Toolbar ── */}
      <View style={[styles.toolbar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.heading, { color: theme.textBright }]}>Test Cases</Text>

        <View style={styles.toolbarRight}>
          {selecting ? (
            <>
              <TouchableOpacity onPress={cancelSelect} style={styles.toolbarBtn} activeOpacity={0.7}>
                <Text style={[styles.toolbarBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={selectedIds.size === 0 || deleting}
                style={[
                  styles.deleteBtn,
                  { backgroundColor: theme.red, opacity: selectedIds.size === 0 ? 0.4 : 1 },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.deleteBtnText, { color: '#fff' }]}>
                  {deleting ? 'Deleting…' : `Delete (${selectedIds.size})`}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => setSelecting(true)}
              style={[styles.selectBtn, { borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolbarBtnText, { color: theme.accent }]}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView contentContainerStyle={styles.list}>
        {testCases.map(tc => (
          <TestcaseComponent
            key={tc.tc_id}
            testCase={tc}
            selectable={selecting}
            selected={selectedIds.has(tc.tc_id)}
            onToggleSelect={() => toggleSelect(tc.tc_id)}
          />
        ))}
        {testCases.length === 0 && (
          <Text style={[styles.empty, { color: theme.textMuted }]}>No test cases yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toolbarBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 40,
  },
  empty: {
    marginTop: 60,
    fontSize: 15,
  },
});
