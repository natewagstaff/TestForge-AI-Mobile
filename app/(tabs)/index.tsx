import DropdownComponent from "@/components/dropdown";
import TestcaseComponent from "@/components/testcase";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { getRequirements, generateTestCases } from "@/api/testforge";
import { useTheme } from "../../context/ThemeContext";

// Home screen — loads requirements into the dropdown and allows the user to generate test cases
export default function Index() {
  const { theme } = useTheme();

  const [requirements, setRequirements] = useState([]);

  useEffect(() => {
    getRequirements().then(data => {
      const formatted = data.map((r: any) => ({ label: r.title, value: r.req_id }));
      setRequirements(formatted);
    });
  }, []);

  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Calls the backend to generate test cases for the selected requirement and updates state with the results
  const handleGenerate = () => {
    if (!selectedReqId) return;
    setLoading(true);
    generateTestCases(selectedReqId).then(res => {
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
      <Text style={[styles.label, { color: theme.textMuted }]}>Select a Requirement:</Text>

      <DropdownComponent data={requirements} onSelect={setSelectedReqId} />

      <TouchableOpacity
        onPress={handleGenerate}
        style={[styles.button, { backgroundColor: theme.accent, opacity: selectedReqId ? 1 : 0.5 }]}
        disabled={!selectedReqId}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: theme.bg }]}>Generate Test Cases</Text>
      </TouchableOpacity>

      {loading && (
        <Text style={[styles.statusText, { color: theme.textMuted }]}>Generating...</Text>
      )}

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
  button: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusText: {
    marginTop: 16,
    fontSize: 14,
  },
});
