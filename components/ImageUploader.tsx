import React, { useRef } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onFilesSelected: (files: FileList) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer flex flex-col items-center justify-center 
        w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200
        ${disabled 
          ? 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-60' 
          : 'bg-blue-50/50 border-blue-300 hover:bg-blue-50 hover:border-blue-500'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
        disabled={disabled}
      />
      
      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-200">
        <UploadCloud className={`w-8 h-8 ${disabled ? 'text-gray-400' : 'text-blue-500'}`} />
      </div>
      
      <p className={`text-lg font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
        약품 이미지 선택
      </p>
      <p className={`text-sm mt-1 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
        클릭하거나 이미지를 이곳으로 드래그하세요
      </p>
      
      {!disabled && (
        <div className="absolute bottom-3 right-3 text-xs text-blue-400 flex items-center bg-white/80 px-2 py-1 rounded backdrop-blur-sm">
          <ImageIcon className="w-3 h-3 mr-1" />
          Multiple files supported
        </div>
      )}
    </div>
  );
};

export default ImageUploader;