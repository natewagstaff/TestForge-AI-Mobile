import DropdownComponent from "@/components/dropdown";
import TestcaseComponent from "@/components/testcase";
import { Link } from "expo-router";
import {useEffect, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { getRequirements, generateTestCases } from "@/api/testforge";


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: "#2C5058",
    paddingVertical: 100,
  },
  text: {
    fontSize: 24,
    color: "#C8DDD8",
  },
  
});

// Home screen — loads requirements into the dropdown and allows the user to generate test cases
export default function Index() {
  // fetch requirements and pass to dropdown
  const [requirements, setRequirements] = useState([]);

    useEffect(() => {
      getRequirements().then(data => {
        const formatted = data.map((r:any) => ({ label: r.title, value: r.req_id }));
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
        console.log(res);
        setTestCases(res.testcases || []);
        setLoading(false);
      });
    };



  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>Select a Requirement:</Text>
      <DropdownComponent data={requirements} onSelect={setSelectedReqId} />
      <Button title="Generate Test Case" onPress={handleGenerate} />
      {loading && <Text>Generating...</Text>}
      {testCases.map(tc => (
        <TestcaseComponent key={tc.id} testCase={tc} />
      ))}
    </ScrollView>
  );
}
