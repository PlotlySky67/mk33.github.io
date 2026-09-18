const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImageToCloudinary(pickedUri: string): Promise<string> {
  const filename = pickedUri.split('/').pop() ?? 'sunset.jpg';
  const extensionMatch = /\.(\w+)$/.exec(filename);
  const type = extensionMatch ? `image/${extensionMatch[1]}` : 'image/jpeg';

  const formData = new FormData();
  // React Native's fetch/FormData accepts this { uri, name, type } file shape.
  formData.append('file', { uri: pickedUri, name: filename, type } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET ?? '');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Cloudinary upload failed: ${message}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}
