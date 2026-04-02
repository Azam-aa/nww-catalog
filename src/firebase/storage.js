import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export async function uploadProductImage(file, category, onProgress) {
  try {
    console.log("Uploading started");
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `products/${category}/${timestamp}_${safeName}`;
    console.log("Storage path:", path);
    
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(Math.round(progress));
        },
        (error) => {
          console.error("Upload failed with error:", error);
          reject(error);
        },
        async () => {
          try {
            console.log("Upload success");
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Download URL:", url);
            resolve(url);
          } catch (urlError) {
            console.error("Failed to get download URL:", urlError);
            reject(urlError);
          }
        }
      );
    });
  } catch (error) {
    console.error("Storage Error:", error);
    throw error;
  }
}
