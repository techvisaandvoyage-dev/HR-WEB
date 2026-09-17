import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Uploads a logo or asset to Firebase Storage and returns the public download URL.
 * 
 * @param {File} file - The file to upload.
 * @param {string} folderPath - Target folder in Firebase Storage (e.g. 'logos', 'branding').
 * @param {Function} onProgress - Optional progress callback (0-100).
 * @returns {Promise<string>} - Public download URL.
 */
export const uploadFileToStorage = (file, folderPath = 'logos', onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    // Clean filename with timestamp
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, `${folderPath}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (onProgress) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => {
        console.error("Firebase upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Deletes a file from Firebase Storage.
 * 
 * @param {string} fileUrl - Full download URL.
 */
export const deleteFileFromStorage = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const urlParts = fileUrl.split('/o/');
    if (urlParts.length > 1) {
      const pathPart = urlParts[1].split('?')[0];
      const decodedPath = decodeURIComponent(pathPart);
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Error deleting file from storage:", error);
  }
};
