import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

export type AttachmentType = 'image' | 'document';

export interface ChatAttachment {
  uri: string;
  name: string;
  type: AttachmentType;
  mimeType: string;
  size: number;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function validateSize(size: number | null | undefined): void {
  if (size && size > MAX_SIZE) {
    throw new Error('File is too large. Maximum allowed size is 5MB.');
  }
}

export async function pickDocument(): Promise<ChatAttachment | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'text/plain'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;

  validateSize(asset.size);

  return {
    uri: asset.uri,
    name: asset.name || 'document',
    type: 'document',
    mimeType: asset.mimeType || 'application/pdf',
    size: asset.size || 0,
  };
}

export async function pickImage(): Promise<ChatAttachment | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.9,
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;

  validateSize(asset.fileSize);

  const uri = asset.uri;
  const fileName = asset.fileName || 'image';
  const mimeType = asset.mimeType || 'image/jpeg';

  return {
    uri,
    name: fileName,
    type: 'image',
    mimeType,
    size: asset.fileSize || 0,
  };
}

export function showFileError(error: unknown): void {
  const message = error instanceof Error ? error.message : 'Could not attach the file.';
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('Attachment error', message);
  }
}
