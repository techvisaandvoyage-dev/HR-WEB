/**
 * Client-side File Compressor Utility
 * Automatically attempts progressive compression on oversized document/image files to fit under 300KB.
 */

export const compressFileIfNeeded = async (file, maxBytes = 300 * 1024) => {
  if (!file || file.size <= maxBytes) {
    return file;
  }

  const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpe?g|png|webp|bmp|gif|tif|tiff)$/i.test(file.name || '');

  // If image or image-based document, compress progressively using Canvas
  if (isImage) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const originalWidth = img.naturalWidth || img.width;
          const originalHeight = img.naturalHeight || img.height;

          // Progressive tiers: maxDimension and quality combinations
          const tiers = [
            { maxDim: 1400, quality: 0.82 },
            { maxDim: 1200, quality: 0.72 },
            { maxDim: 1000, quality: 0.62 },
            { maxDim: 850,  quality: 0.50 },
            { maxDim: 700,  quality: 0.40 },
            { maxDim: 550,  quality: 0.30 }
          ];

          let bestBlob = null;

          for (const tier of tiers) {
            let width = originalWidth;
            let height = originalHeight;

            if (width > tier.maxDim || height > tier.maxDim) {
              if (width > height) {
                height = Math.round((height * tier.maxDim) / width);
                width = tier.maxDim;
              } else {
                width = Math.round((width * tier.maxDim) / height);
                height = tier.maxDim;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(width, 1);
            canvas.height = Math.max(height, 1);
            const ctx = canvas.getContext('2d');
            
            // White background for transparent PNG conversion to JPEG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise((res) => {
              canvas.toBlob((b) => res(b), 'image/jpeg', tier.quality);
            });

            if (blob) {
              if (!bestBlob || blob.size < bestBlob.size) {
                bestBlob = blob;
              }

              if (blob.size <= maxBytes) {
                const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
                const compressedFile = new File([blob], newFileName, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
                return;
              }
            }
          }

          // If all tiers checked and bestBlob is smaller than original, return bestBlob
          if (bestBlob && bestBlob.size < file.size) {
            const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
            const compressedFile = new File([bestBlob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
            return;
          }

          resolve(file);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  // Non-image files (e.g. standard PDF/DOCX) return original file
  return file;
};
