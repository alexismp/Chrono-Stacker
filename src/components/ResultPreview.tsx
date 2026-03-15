import React, { useState } from 'react';
import { Download, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react';
import { generatePDF, downloadImages } from '../utils/imageUtils';
import toast from 'react-hot-toast';

interface ResultPreviewProps {
  isGenerating: boolean;
  resultImages: string[];
}

export function ResultPreview({ isGenerating, resultImages }: ResultPreviewProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      await generatePDF(resultImages);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error('An error occurred while generating the PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImages = () => {
    try {
      downloadImages(resultImages);
      toast.success(resultImages.length > 1 ? 'Images downloaded successfully' : 'Image downloaded successfully');
    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error('An error occurred while downloading images.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-neutral-800">Result Preview</h2>
        {resultImages.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="Download PDF"
            >
              {isDownloadingPdf ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Download PDF
            </button>
            <button
              onClick={handleDownloadImages}
              className="px-4 py-2 text-sm font-medium text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="Download Images"
            >
              <Download className="w-4 h-4" />
              {resultImages.length > 1 ? 'Download Images' : 'Download Image'}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center relative">
        {isGenerating ? (
          <div className="flex flex-col items-center text-neutral-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm font-medium">Stitching images together...</p>
          </div>
        ) : resultImages.length > 0 ? (
          <div className="absolute inset-0 overflow-auto p-4 flex flex-col items-center gap-6 custom-scrollbar">
            {resultImages.map((src, idx) => (
              <div key={idx} className="relative group w-full flex justify-center">
                {resultImages.length > 1 && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    Part {idx + 1}
                  </div>
                )}
                <img 
                  src={src} 
                  alt={`Generated chronological stack part ${idx + 1}`} 
                  className="max-w-full h-auto object-contain shadow-md border border-neutral-200 bg-white"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-neutral-400 p-8 text-center">
            <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Add images and click Generate to see the result here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
