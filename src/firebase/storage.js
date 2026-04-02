import { storage } from './config';
export async function uploadProductImage(file, category, onProgress) {
  try {
    console.log("Uploading via Cloudinary started...");
    
    // Cloudinary details from env variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing in .env file");
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `products/${category}`); // Optional: organizes folders in Cloudinary

    // We can't easily track native XHR progress with standard fetch,
    // so we'll simulate a jump to 50%, then 100% when fetch completes.
    onProgress?.(50);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Cloudinary Error response:", errorData);
      throw new Error(errorData.error?.message || "Upload to Cloudinary failed");
    }

    const data = await response.json();
    onProgress?.(100);
    
    console.log("Cloudinary Upload success");
    console.log("Download URL:", data.secure_url);
    
    // Cloudinary returns the direct image URL in 'secure_url'
    return data.secure_url;

  } catch (error) {
    console.error("Image Upload Error:", error);
    throw error;
  }
}
