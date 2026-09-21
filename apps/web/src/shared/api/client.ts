export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`request failed: ${path}`);
  return response.json() as Promise<T>;
};

export const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`request failed: ${path}`);
  return response.json() as Promise<T>;
};

export const patchJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`request failed: ${path}`);
  return response.json() as Promise<T>;
};

export const deleteJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, { method: "DELETE" });
  if (!response.ok) throw new Error(`request failed: ${path}`);
  return response.json() as Promise<T>;
};