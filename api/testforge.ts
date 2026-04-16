import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_SERVER = 'http://20.7.15.193:3000';
const SERVER_KEY = '@testforge_server';
const TOKEN_KEY  = '@testforge_token';

/** The active server base — updated by initServerUrl / setServerUrl. */
let serverBase = DEFAULT_SERVER;

/** Reads the saved server URL from storage and applies it. Call once at app startup. */
export async function initServerUrl(): Promise<void> {
  const saved = await AsyncStorage.getItem(SERVER_KEY);
  if (saved) serverBase = saved;
}

/** Persists a new server URL and applies it immediately. */
export async function setServerUrl(url: string): Promise<void> {
  const cleaned = url.trim().replace(/\/+$/, '');
  serverBase = cleaned;
  await AsyncStorage.setItem(SERVER_KEY, cleaned);
}

/** Returns the currently active server base URL (without /api). */
export function getServerUrl(): string {
  return serverBase;
}

/** Reads the stored JWT and returns an Authorization header object. */
async function authHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Authenticates with the backend and returns a JWT + user info. */
export async function mobileLogin(username: string, password: string) {
  const res = await fetch(`${serverBase}/api/auth/mobile-token`, {
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
  const res = await fetch(`${serverBase}/api/requirements`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches all test cases from the TestForge backend. */
export async function getTestCases() {
  const res = await fetch(`${serverBase}/api/testcases`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches all KB sections with their subsections. */
export async function getKbSections() {
  const res = await fetch(`${serverBase}/api/kb/sections`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches all KB entries. */
export async function getKbEntries() {
  const res = await fetch(`${serverBase}/api/kb`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Fetches KB entries that match a requirement by tag or direct relation. */
export async function getMatchedKbEntries(reqId: string) {
  const res = await fetch(`${serverBase}/api/kb/matched/${encodeURIComponent(reqId)}`, {
    headers: await authHeader(),
  });
  return res.json();
}

/** Sends a requirement ID to the backend to generate test cases using the Claude API. */
export async function generateTestCases(
  reqId: string,
  kbEntryIds: string[] = [],
  depth: 'basic' | 'standard' | 'comprehensive' = 'basic',
) {
  const res = await fetch(`${serverBase}/api/testcases/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify({ reqId, depth, generatedBy: 'Mobile App', kbEntryIds }),
  });
  return res.json();
}

/** Updates the status of a test case (Draft / Reviewed / Rejected). */
export async function updateTestCaseStatus(tcId: string, status: 'Draft' | 'Reviewed' | 'Rejected') {
  const res = await fetch(`${serverBase}/api/testcases/${encodeURIComponent(tcId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

/** Updates editable fields of a test case. */
export async function updateTestCase(
  tcId: string,
  data: {
    title?: string;
    type?: string;
    req_attribute?: string;
    description?: { objective?: string; scope?: string | string[]; assumptions?: string[] };
    preconditions?: { preconditions?: string[]; environment?: string[]; equipment?: string[]; testData?: string[] };
    steps?: Array<{ step: string; expectedResult: string }>;
  },
) {
  const res = await fetch(`${serverBase}/api/testcases/${encodeURIComponent(tcId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify(data),
  });
  return res.json();
}

/** Deletes a list of test cases by ID from the TestForge backend. */
export async function deleteTestCases(ids: string[]) {
  const res = await fetch(`${serverBase}/api/testcases/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...await authHeader() },
    body: JSON.stringify({ ids, deletedBy: 'Mobile App' }),
  });
  return res.json();
}
