import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * 
 * @param {File} file - The file to upload.
 * @param {string} folderPath - The folder path in storage (e.g. 'resumes', 'avatars').
 * @param {Function} onProgress - Optional callback for upload progress (0-100).
 * @returns {Promise<string>} - The download URL of the uploaded file.
 */
export const uploadFileToStorage = (file, folderPath, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    // Generate a unique filename using timestamp to prevent overwriting
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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
 * Deletes a file from Firebase Storage using its download URL.
 * 
 * @param {string} fileUrl - The full download URL of the file.
 * @returns {Promise<void>}
 */
export const deleteFileFromStorage = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    // We need to extract the path from the URL. Firebase URLs look like:
    // https://firebasestorage.googleapis.com/v0/b/bucket-name/o/folder%2Ffilename.ext?alt=...
    const urlParts = fileUrl.split('/o/');
    if (urlParts.length > 1) {
      const pathPart = urlParts[1].split('?')[0];
      const decodedPath = decodeURIComponent(pathPart);
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Don't throw here to avoid breaking the UI if cleanup fails
  }
};
