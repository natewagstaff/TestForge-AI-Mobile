# Overview

As a software engineer, I am continually looking for ways to bring the tools I build at work into more accessible formats. This project is an exploration of mobile development using React Native — specifically, how to consume a REST API from a mobile client, manage state across screens, and present complex structured data (like AI-generated test cases) in a clean, usable interface.

TestForge Mobile is a React Native app that connects to the TestForge AI backend — a test case generation platform that uses the Claude API to generate software test cases from requirements. The app allows a user to select a requirement from a dropdown, trigger AI-powered test case generation at a basic depth, and view the generated test cases. A second screen displays all test cases stored in the database.

To use the app:
1. Launch the app and wait for the requirements dropdown to populate.
2. Select a requirement from the dropdown on the Home screen.
3. Tap "Generate Test Case" to send the requirement to the backend and generate a test case using AI.
4. Scroll down to view the generated test case title and description.
5. Navigate to the Test Cases tab to browse all test cases in the database.

My purpose in building this is to extend a tool I actively use for QA work into a mobile-first experience, while deepening my understanding of React Native, Expo Router, and cross-platform API integration.

[Software Demo Video](https://youtu.be/vLZ-zI5V54M)

# Development Environment

- **React Native** with **Expo** (Expo Router for file-based navigation)
- **TypeScript**
- **VS Code** with the Claude Code extension
- **Node.js / Express** backend (TestForge AI) running on a local server

Libraries used:
- `react-native-element-dropdown` — searchable dropdown component
- `@expo/vector-icons` — icon set (AntDesign)
- `expo-router` — file-based navigation and tab layout

# Useful Websites

* [React Native Docs](https://reactnative.dev/docs/getting-started)
* [Expo Documentation](https://docs.expo.dev/)
* [react-native-element-dropdown](https://github.com/hoaphantn7604/react-native-element-dropdown)
* [Expo Router Docs](https://expo.github.io/router/docs/)

# Future Work

* Add a login screen so the app authenticates with the TestForge backend using a real session
* Support selecting KB entries to include in test case generation
* Allow switching between generation depths (Basic, Standard, Comprehensive)
* Display full test case details including steps and preconditions
* Add the ability to approve or reject generated test cases from the mobile app
