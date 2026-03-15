import React, { useRef, useCallback } from 'react';
import { Upload, RefreshCw } from 'lucide-react';

interface UploadZoneProps {
  isProcessing: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function UploadZone({ isProcessing, onFilesSelected }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-neutral-400 focus-within:ring-offset-2
        ${isProcessing ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 bg-white'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      aria-label="Upload images"
    >
      <input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center gap-3">
        {isProcessing ? (
          <RefreshCw className="w-10 h-10 text-neutral-400 animate-spin" />
        ) : (
          <Upload className="w-10 h-10 text-neutral-400" />
        )}
        <div>
          <p className="text-base font-medium text-neutral-700">
            {isProcessing ? 'Processing images...' : 'Click or drag images here'}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Supports JPG, PNG, WEBP. Duplicates will be ignored.
          </p>
        </div>
      </div>
    </div>
  );
}
