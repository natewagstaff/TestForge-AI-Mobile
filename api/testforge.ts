import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://20.7.15.193:3000/api';
const TOKEN_KEY = '@testforge_token';

/** Reads the stored JWT and returns an Authorization header object. */
async function authHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Authenticates with the backend and returns a JWT + user info. */
export async function mobileLogin(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/mobile-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned unexpected response (${res.status}): ${text.slice(0, 120)}`);
  }
}

/** Fetches all requirements from the TestForge backend. */
export async function getRequirements() {
  const res = await fetch(`${BASE_URL}/requirements`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches all test cases from the TestForge backend. */
export async function getTestCases() {
  const res = await fetch(`${BASE_URL}/testcases`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches all KB sections with their subsections. */
export async function getKbSections() {
  const res = await fetch(`${BASE_URL}/kb/sections`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches all KB entries. */
export async function getKbEntries() {
  const res = await fetch(`${BASE_URL}/kb`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches KB entries that match a requirement by tag or direct relation. */
export async function getMatchedKbEntries(reqId: string) {
  const res = await fetch(`${BASE_URL}/kb/matched/${encodeURIComponent(reqId)}`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Sends a requirement ID to the backend to generate test cases at basic depth using the Claude API. */
export async function generateTestCases(reqId: string, kbEntryIds: string[] = []) {
  const res = await fetch(`${BASE_URL}/testcases/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify({ reqId, depth: 'basic', generatedBy: 'Mobile App', kbEntryIds }),
  });
  return res.json();
}

/** Deletes a list of test cases by ID from the TestForge backend. */
export async function deleteTestCases(ids: string[]) {
  const res = await fetch(`${BASE_URL}/testcases/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify({ ids, deletedBy: 'Mobile App' }),
  });
  return res.json();
}
