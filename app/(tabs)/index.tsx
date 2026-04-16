import DropdownComponent from "@/components/dropdown";
import TestcaseComponent from "@/components/testcase";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getRequirements, generateTestCases, getMatchedKbEntries } from "@/api/testforge";
import { useTheme } from "../../context/ThemeContext";

const KB_TYPE_COLORS: Record<string, string> = {
  "UI Reference":    "#3b82f6",
  "Defect History":  "#ef4444",
  "Lessons Learned": "#f59e0b",
  "Process":         "#8b5cf6",
  "Technical":       "#06b6d4",
};

// Home screen — select a requirement, optionally pick KB entries, then generate test cases
export default function Index() {
  const { theme } = useTheme();

  const [requirements, setRequirements]     = useState([]);
  const [selectedReqId, setSelectedReqId]   = useState<string | null>(null);
  const [kbEntries, setKbEntries]           = useState<any[]>([]);
  const [selectedKbIds, setSelectedKbIds]   = useState<Set<string>>(new Set());
  const [testCases, setTestCases]           = useState<any[]>([]);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    getRequirements().then(data => {
      const formatted = data.map((r: any) => ({ label: r.title, value: r.req_id }));
      setRequirements(formatted);
    });
  }, []);

  // When a requirement is selected, fetch its matching KB entries and reset KB selection
  function handleSelectReq(reqId: string) {
    setSelectedReqId(reqId);
    setSelectedKbIds(new Set());
    setKbEntries([]);
    getMatchedKbEntries(reqId).then(data => {
      if (Array.isArray(data)) setKbEntries(data);
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
    generateTestCases(selectedReqId, [...selectedKbIds]).then(res => {
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

      {/* KB entry selector — only shown when a requirement with matches is selected */}
      {kbEntries.length > 0 && (
        <View style={[styles.kbSection, { borderColor: theme.border }]}>
          <View style={styles.kbHeader}>
            <Text style={[styles.kbTitle, { color: theme.textBright }]}>Knowledge Base</Text>
            <Text style={[styles.kbSubtitle, { color: theme.textMuted }]}>
              {selectedKbIds.size > 0
                ? `${selectedKbIds.size} of ${kbEntries.length} selected`
                : `${kbEntries.length} matching entr${kbEntries.length !== 1 ? 'ies' : 'y'}`}
            </Text>
          </View>

          {kbEntries.map(kb => {
            const isSelected = selectedKbIds.has(kb.kb_id);
            const typeColor = KB_TYPE_COLORS[kb.type] || theme.accent;
            return (
              <TouchableOpacity
                key={kb.kb_id}
                onPress={() => toggleKb(kb.kb_id)}
                style={[
                  styles.kbRow,
                  { borderTopColor: theme.border },
                  isSelected && { backgroundColor: theme.surfaceRaised },
                ]}
                activeOpacity={0.7}
              >
                {/* Checkbox */}
                <View style={[
                  styles.checkbox,
                  { borderColor: isSelected ? theme.accent : theme.textMuted,
                    backgroundColor: isSelected ? theme.accent : 'transparent' },
                ]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <View style={styles.kbInfo}>
                  <Text style={[styles.kbName, { color: isSelected ? theme.textBright : theme.text }]}>
                    {kb.title}
                  </Text>
                  <View style={[styles.kbTypeBadge, { backgroundColor: typeColor + '22', borderColor: typeColor }]}>
                    <Text style={[styles.kbTypeText, { color: typeColor }]}>{kb.type}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* No KB matches notice */}
      {selectedReqId && kbEntries.length === 0 && (
        <Text style={[styles.noKb, { color: theme.textMuted }]}>
          No matching knowledge base entries for this requirement.
        </Text>
      )}

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
  kbSection: {
    width: "90%",
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 12,
    overflow: "hidden",
  },
  kbHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  kbTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  kbSubtitle: {
    fontSize: 12,
  },
  kbRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  kbInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kbName: {
    fontSize: 14,
    flex: 1,
  },
  kbTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  kbTypeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  noKb: {
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
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
});
