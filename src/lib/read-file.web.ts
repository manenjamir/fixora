export async function readFileBytes(uri: string) {
  const response = await fetch(uri);
  return new Uint8Array(await response.arrayBuffer());
}
