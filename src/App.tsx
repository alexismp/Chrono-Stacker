import React, { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import { ImageFile } from './types';
import { processImageFiles, generateChronologicalStack } from './utils/imageUtils';

import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ImageList } from './components/ImageList';
import { ResultPreview } from './components/ResultPreview';
import { LogoGenerator } from './components/LogoGenerator';

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImages, setResultImages] = useState<string[]>([]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []); // Only run on unmount, but we need to be careful with stale state. Actually, it's better to just clean up when removing/clearing.

  const MAX_TOTAL_IMAGES = 50;

  const handleFilesSelected = async (files: File[]) => {
    if (images.length + files.length > MAX_TOTAL_IMAGES) {
      toast.error(`You can only process up to ${MAX_TOTAL_IMAGES} images at a time.`);
      files = files.slice(0, MAX_TOTAL_IMAGES - images.length);
      if (files.length === 0) return;
    }

    setIsProcessing(true);
    try {
      const newImages = await processImageFiles(files, images);
      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages].sort((a, b) => a.timestamp - b.timestamp));
        toast.success(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
      } else if (files.length > 0) {
        toast.error('No valid new images added (duplicates, invalid type, or too large)');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to process some images');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return newImages;
    });
    setResultImages([]);
  }, []);

  const clearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setResultImages([]);
    toast.success('Cleared all images');
  }, [images]);

  const handleGenerate = async () => {
    if (images.length === 0) return;
    
    setIsGenerating(true);
    try {
      const generatedUrls = await generateChronologicalStack(images);
      setResultImages(generatedUrls);
      toast.success('Stack generated successfully!');
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("An error occurred while generating the image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <Toaster position="top-center" />
      <LogoGenerator />
      
      <Header 
        hasImages={images.length > 0} 
        isGenerating={isGenerating} 
        onClearAll={clearAll} 
        onGenerate={handleGenerate} 
      />

      <main className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload & List */}
          <div className="space-y-6">
            <UploadZone 
              isProcessing={isProcessing} 
              onFilesSelected={handleFilesSelected} 
            />
            <ImageList 
              images={images} 
              onRemove={removeImage} 
            />
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-6">
            <ResultPreview 
              isGenerating={isGenerating} 
              resultImages={resultImages} 
            />
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
