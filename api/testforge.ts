const BASE_URL = 'http://20.7.15.193:3000/api';

export async function getRequirements() {
  const res = await fetch(`${BASE_URL}/requirements`);
  return res.json();
}

export async function getTestCases() {
  const res = await fetch(`${BASE_URL}/testcases`);
  return res.json();
}


export async function generateTestCases(reqId: string) {
  const res = await fetch(`${BASE_URL}/testcases/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reqId, depth: 'basic', generatedBy: 'Mobile App' }),
  });
  return res.json();
}