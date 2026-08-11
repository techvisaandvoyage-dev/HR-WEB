import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropperModal({ isOpen, onClose, imageFile, onSave, onChangePhoto }) {
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);

  useEffect(() => {
    if (imageFile) {
      setImgSrc(URL.createObjectURL(imageFile));
    }
  }, [imageFile]);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

  useEffect(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );
  }, [completedCrop]);

  const handleSave = () => {
    if (!previewCanvasRef.current) return;
    previewCanvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const objectUrl = URL.createObjectURL(blob);
      onSave(objectUrl);
    }, 'image/jpeg', 0.95);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1e1e1e] md:bg-black/60 md:backdrop-blur-sm md:p-4 animate-fade-in" onClick={onClose}>
      {/* Mobile Top Bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 p-4 z-20 flex items-center bg-[#1e1e1e]">
         <button onClick={onClose} className="text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></button>
      </div>

      <div className="bg-[#1e1e1e] md:bg-white rounded-none md:rounded-2xl w-full h-full md:h-auto max-w-5xl shadow-none md:shadow-2xl relative flex flex-col md:flex-row pt-[60px] md:pt-0" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="hidden md:block absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors z-10 bg-white shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left Side: Adjust Photo */}
        <div className="flex-1 p-0 md:p-8 md:border-r border-gray-200 flex flex-col h-full relative">
          <h3 className="hidden md:block text-2xl font-bold text-gray-900">Adjust photo</h3>
          <p className="hidden md:block text-gray-500 mb-6 text-sm">Drag the box to adjust the position.</p>
          
          <div className="flex-1 flex items-center justify-center overflow-hidden w-full h-full md:bg-black md:rounded-lg">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[70vh] md:max-h-[400px] w-auto object-contain"
                />
              </ReactCrop>
            )}
          </div>

          <div className="hidden md:block mt-6 text-sm text-gray-500">
            In case you are not satisfied with photo - <button onClick={onChangePhoto} className="text-green-600 font-semibold hover:underline">Change photo</button>
          </div>

          {/* Mobile Bottom Bar */}
          <div className="md:hidden flex gap-4 p-4 mt-auto mb-4 w-full px-6">
             <button onClick={onClose} className="flex-1 bg-white text-green-600 font-bold py-3.5 rounded-full text-[15px]">Cancel</button>
             <button onClick={handleSave} className="flex-1 bg-green-600 text-white font-bold py-3.5 rounded-full text-[15px]">Save</button>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="hidden md:flex w-[400px] p-8 flex-col bg-gray-50/50">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900">Preview</h3>
          <p className="text-gray-500 mb-4 md:mb-10 text-xs md:text-sm">This is how your photo will look.</p>
          
          <div className="flex justify-center items-center flex-1 mb-4 md:mb-10">
            <div className="w-24 h-24 md:w-48 md:h-48 rounded-full overflow-hidden border border-gray-200 shadow-md bg-white flex items-center justify-center">
              {completedCrop ? (
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span className="text-gray-400">Preview</span>
              )}
            </div>
          </div>

          <div className="mt-auto flex justify-end pb-1 md:pb-2">
            <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 md:py-3 px-6 md:px-10 rounded-full shadow-md transition-transform hover:-translate-y-0.5 text-sm md:text-lg w-full md:w-auto">
              Save photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
