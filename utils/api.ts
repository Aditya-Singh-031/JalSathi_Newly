const BASE_URL = 'https://yenatqntu9swue9p2wf8rkecdaqrvkk2.app.specular.dev';

export async function apiGet<T>(path: string): Promise<T> {
  console.log(`[API] GET ${BASE_URL}${path}`);
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`[API] GET ${path} failed: ${res.status}`, text);
    throw new Error(`API error ${res.status}`);
  }
  const data = await res.json();
  console.log(`[API] GET ${path} success`, data);
  return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  console.log(`[API] POST ${BASE_URL}${path}`, body);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[API] POST ${path} failed: ${res.status}`, text);
    throw new Error(`API error ${res.status}`);
  }
  const data = await res.json();
  console.log(`[API] POST ${path} success`, data);
  return data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  console.log(`[API] PATCH ${BASE_URL}${path}`, body);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[API] PATCH ${path} failed: ${res.status}`, text);
    throw new Error(`API error ${res.status}`);
  }
  const data = await res.json();
  console.log(`[API] PATCH ${path} success`, data);
  return data;
}
