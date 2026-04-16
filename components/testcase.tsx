import { StyleSheet, Text, View } from "react-native";


// Renders a single test case card showing its title and description
const TestcaseComponent = ({ testCase }: { testCase: any }) => {

const styles = StyleSheet.create({
    testCaseContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#C8DDD8",
        borderRadius: 5,
        width: "90%",
      },
    
      testCaseTitle: {
        fontSize: 15,
        fontWeight: "500",
        borderBottomWidth: 1,
        paddingBottom: 5,
      },
});
  return (
    <View style={styles.testCaseContainer}>
      <Text style={styles.testCaseTitle}>{testCase.title}</Text>
      <Text>{testCase.description}</Text>
    </View>
  );
};

export default TestcaseComponent;
