const MAX_FETCH_BYTES = 5 * 1024 * 1024; // 5MB

export async function readResponseBytesCapped(res: Response): Promise<Uint8Array> {
  if (!res.body) throw new Error("Empty response body");
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = MAX_FETCH_BYTES - totalBytes;
    if (value.byteLength > remaining) {
      chunks.push(value.slice(0, remaining));
      totalBytes = MAX_FETCH_BYTES;
      reader.cancel();
      break;
    }
    totalBytes += value.byteLength;
    chunks.push(value);
  }
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const c of chunks) { merged.set(c, offset); offset += c.byteLength; }
  return merged;
}

export async function readResponseTextCapped(res: Response): Promise<string> {
  return new TextDecoder().decode(await readResponseBytesCapped(res));
}
