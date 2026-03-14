import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Download, Trash2, RefreshCw } from 'lucide-react';
import exifr from 'exifr';

interface ImageFile {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  timestamp: number;
  dateStr: string;
}

function extractDateFromFilename(filename: string): number | null {
  const match = filename.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})[-_]?(\d{2})[-_]?(\d{2})[-_]?(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const newImages: ImageFile[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      const id = `${file.name}-${file.size}`;
      
      // Skip duplicates
      if (images.some(img => img.id === id) || newImages.some(img => img.id === id)) {
        continue;
      }

      try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);
        
        let timestamp = file.lastModified;
        try {
          const exifData = await exifr.parse(file, ['DateTimeOriginal', 'CreateDate']);
          if (exifData?.DateTimeOriginal) {
            timestamp = exifData.DateTimeOriginal.getTime();
          } else if (exifData?.CreateDate) {
            timestamp = exifData.CreateDate.getTime();
          } else {
            const filenameDate = extractDateFromFilename(file.name);
            if (filenameDate) {
              timestamp = filenameDate;
            }
          }
        } catch (e) {
          const filenameDate = extractDateFromFilename(file.name);
          if (filenameDate) {
            timestamp = filenameDate;
          }
        }

        newImages.push({
          id,
          file,
          url,
          width: img.width,
          height: img.height,
          timestamp,
          dateStr: new Date(timestamp).toLocaleString(),
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    setImages(prev => [...prev, ...newImages].sort((a, b) => a.timestamp - b.timestamp));
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // Reset input so the same files can be selected again if they were removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [images]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return newImages;
    });
    setResultImage(null);
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setResultImage(null);
  };

  const generateImage = async () => {
    if (images.length === 0) return;
    
    setIsGenerating(true);
    try {
      // Images are already sorted in state, but let's be sure
      const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp);
      
      const maxWidth = Math.max(...sortedImages.map(img => img.width));
      const totalHeight = sortedImages.reduce((sum, img) => sum + img.height, 0);
      
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      // Fill background with white or transparent (transparent is default)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      let currentY = 0;
      for (const imgData of sortedImages) {
        const img = await loadImage(imgData.url);
        ctx.drawImage(img, 0, currentY, imgData.width, imgData.height);
        currentY += imgData.height;
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      setResultImage(dataUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      alert("An error occurred while generating the image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `chronological-stack-${new Date().getTime()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200 py-6 px-8 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ChronoStacker</h1>
            <p className="text-sm text-neutral-500 mt-1">Combine pictures chronologically into a single vertical image.</p>
          </div>
          {images.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={generateImage}
                disabled={isGenerating || images.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Generate Image
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload & List */}
          <div className="space-y-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors
                ${isProcessing ? 'border-neutral-300 bg-neutral-100' : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 bg-white'}`}
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

            {images.length > 0 && (
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center">
                  <h2 className="font-medium text-neutral-800">Selected Images ({images.length})</h2>
                  <span className="text-xs text-neutral-500">Ordered oldest to newest</span>
                </div>
                <ul className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                  {images.map((img, index) => (
                    <li key={img.id} className="p-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors group">
                      <div className="w-8 text-center text-sm font-medium text-neutral-400">
                        {index + 1}
                      </div>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                        <img src={img.url} alt={img.file.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{img.file.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                          <span>{img.dateStr}</span>
                          <span>&bull;</span>
                          <span>{img.width} &times; {img.height}px</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-neutral-800">Result Preview</h2>
                {resultImage && (
                  <button
                    onClick={downloadImage}
                    className="px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
              
              <div className="flex-1 bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center text-neutral-500">
                    <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm font-medium">Stitching images together...</p>
                  </div>
                ) : resultImage ? (
                  <div className="absolute inset-0 overflow-auto p-4 flex justify-center custom-scrollbar">
                    <img 
                      src={resultImage} 
                      alt="Generated chronological stack" 
                      className="max-w-full h-auto object-contain shadow-md border border-neutral-200 bg-white"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-neutral-400 p-8 text-center">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">Add images and click Generate to see the result here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d4d4d8;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
