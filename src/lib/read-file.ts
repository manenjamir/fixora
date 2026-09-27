import { File } from 'expo-file-system';

export async function readFileBytes(uri: string) {
  return new File(uri).bytes();
}
