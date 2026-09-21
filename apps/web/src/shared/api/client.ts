export const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`request failed: ${path}`);
  return response.json() as Promise<T>;
};