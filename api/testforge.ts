const BASE_URL = 'http://20.7.15.193:3000/api';

// Fetches all requirements from the TestForge backend
export async function getRequirements() {
  const res = await fetch(`${BASE_URL}/requirements`);
  return res.json();
}

// Fetches all test cases from the TestForge backend
export async function getTestCases() {
  const res = await fetch(`${BASE_URL}/testcases`);
  return res.json();
}

// Sends a requirement ID to the backend to generate test cases at basic depth using the Claude API
export async function generateTestCases(reqId: string) {
  const res = await fetch(`${BASE_URL}/testcases/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reqId, depth: 'basic', generatedBy: 'Mobile App' }),
  });
  return res.json();
}
