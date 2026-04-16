import DropdownComponent from "@/components/dropdown";
import TestcaseComponent from "@/components/testcase";
import KbPicker from "@/components/KbPicker";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getRequirements, generateTestCases, getMatchedKbEntries } from "@/api/testforge";
import { useTheme } from "../../context/ThemeContext";

const FOCUSES = [
  { key: 'safety_critical',  label: 'Safety Critical',  color: '#ef4444' },
  { key: 'ui_ux_validation', label: 'UI/UX',            color: '#3b82f6' },
  { key: 'boundary_analysis',label: 'Boundary',         color: '#f59e0b' },
  { key: 'error_recovery',   label: 'Error Recovery',   color: '#a855f7' },
  { key: 'regression',       label: 'Regression',       color: '#06b6d4' },
];

// Home screen — select a requirement, optionally pick KB entries, then generate test cases
export default function Index() {
  const { theme } = useTheme();

  const [requirements, setRequirements]     = useState([]);
  const [selectedReqId, setSelectedReqId]   = useState<string | null>(null);
  const [selectedKbIds, setSelectedKbIds]   = useState<Set<string>>(new Set());
  const [kbPickerOpen, setKbPickerOpen]     = useState(false);
  const [depth, setDepth]                   = useState<'basic' | 'standard' | 'comprehensive'>('basic');
  const [focuses, setFocuses]               = useState<Set<string>>(new Set());
  const [testCases, setTestCases]           = useState<any[]>([]);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    getRequirements().then(data => {
      const formatted = data.map((r: any) => ({ label: r.title, value: r.req_id }));
      setRequirements(formatted);
    });
  }, []);

  // When a requirement is selected, pre-select its matched KB entries
  function handleSelectReq(reqId: string) {
    setSelectedReqId(reqId);
    setSelectedKbIds(new Set());
    getMatchedKbEntries(reqId).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setSelectedKbIds(new Set(data.map((kb: any) => kb.kb_id)));
      }
    });
  }

  // Toggles a KB entry in/out of the selection set
  function toggleKb(kbId: string) {
    setSelectedKbIds(prev => {
      const next = new Set(prev);
      next.has(kbId) ? next.delete(kbId) : next.add(kbId);
      return next;
    });
  }

  // Calls the backend to generate test cases for the selected requirement and KB entries
  const handleGenerate = () => {
    if (!selectedReqId) return;
    setLoading(true);
    generateTestCases(selectedReqId, [...selectedKbIds], depth, [...focuses]).then(res => {
      setTestCases(res.testcases || []);
      setLoading(false);
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textBright }]}>TestForge</Text>
      <Text style={[styles.label, { color: theme.textMuted }]}>Select a Requirement</Text>

      <DropdownComponent data={requirements} onSelect={handleSelectReq} />

      {/* KB picker button — only shown when a requirement is selected */}
      {selectedReqId && (
        <TouchableOpacity
          onPress={() => setKbPickerOpen(true)}
          style={[styles.kbBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <View style={styles.kbBtnInner}>
            <Text style={[styles.kbBtnLabel, { color: theme.textBright }]}>Knowledge Base</Text>
            {selectedKbIds.size > 0 ? (
              <View style={[styles.kbCountBadge, { backgroundColor: theme.accent }]}>
                <Text style={[styles.kbCountText, { color: theme.bg }]}>{selectedKbIds.size} selected</Text>
              </View>
            ) : (
              <Text style={[styles.kbBtnHint, { color: theme.textMuted }]}>None selected</Text>
            )}
          </View>
          <Text style={[styles.kbChevron, { color: theme.textMuted }]}>›</Text>
        </TouchableOpacity>
      )}

      {/* Depth selector */}
      <View style={[styles.depthRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {(['basic', 'standard', 'comprehensive'] as const).map(d => (
          <TouchableOpacity
            key={d}
            onPress={() => setDepth(d)}
            style={[
              styles.depthBtn,
              depth === d && { backgroundColor: theme.accent },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.depthBtnText, { color: depth === d ? theme.bg : theme.textMuted }]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Focus selector */}
      <View style={styles.focusSection}>
        <Text style={[styles.focusLabel, { color: theme.textMuted }]}>FOCUS AREAS</Text>
        <View style={styles.focusChips}>
          {FOCUSES.map(f => {
            const active = focuses.has(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFocuses(prev => {
                  const next = new Set(prev);
                  next.has(f.key) ? next.delete(f.key) : next.add(f.key);
                  return next;
                })}
                style={[
                  styles.focusChip,
                  { borderColor: f.color, backgroundColor: active ? f.color : f.color + '22' },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.focusChipText, { color: active ? '#fff' : f.color }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        onPress={handleGenerate}
        style={[styles.button, { backgroundColor: theme.accent, opacity: selectedReqId ? 1 : 0.4 }]}
        disabled={!selectedReqId || loading}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: theme.bg }]}>
          {loading ? 'Generating…' : 'Generate Test Cases'}
        </Text>
      </TouchableOpacity>

      {testCases.map(tc => (
        <TestcaseComponent key={tc.tc_id} testCase={tc} />
      ))}

      <KbPicker
        visible={kbPickerOpen}
        selectedIds={selectedKbIds}
        onToggle={toggleKb}
        onDone={() => setKbPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
  },
  kbBtn: {
    width: "90%",
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kbBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  kbBtnLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  kbBtnHint: {
    fontSize: 13,
  },
  kbCountBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  kbCountText: {
    fontSize: 12,
    fontWeight: "700",
  },
  kbChevron: {
    fontSize: 22,
    lineHeight: 24,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "90%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  depthRow: {
    flexDirection: "row",
    width: "90%",
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  depthBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  depthBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  focusSection: {
    width: "90%",
    marginTop: 12,
  },
  focusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  focusChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  focusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  focusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
