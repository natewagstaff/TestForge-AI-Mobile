
import { getTestCases } from '@/api/testforge';
import TestcaseComponent from '@/components/testcase';

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

// Test Cases screen — fetches and displays all test cases from the TestForge database
export default function AboutScreen() {

    type TestCases = any[];
    const [testCases, setTestCases] = useState<TestCases>([]);

    useEffect(() => {
        getTestCases().then(data => {
          console.log('Fetched test cases:', data);
          setTestCases(data);
        });
      }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {testCases.map(tc => (
        <TestcaseComponent key={tc.tc_id} testCase={tc} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#2C5058',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
