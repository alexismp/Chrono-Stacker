import React from 'react';
import { Trash2, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface HeaderProps {
  hasImages: boolean;
  isGenerating: boolean;
  onClearAll: () => void;
  onGenerate: () => void;
}

export function Header({ hasImages, isGenerating, onClearAll, onGenerate }: HeaderProps) {
  const [logoError, setLogoError] = React.useState(false);

  return (
    <header className="bg-white border-b border-neutral-200 py-6 px-8 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!logoError && (
            <img 
              src="/logo.svg" 
              alt="ChronoStacker Logo" 
              className="w-12 h-12 rounded-xl shadow-sm object-cover bg-neutral-100"
              onError={() => setLogoError(true)}
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ChronoStacker</h1>
            <p className="text-sm text-neutral-500 mt-1">Combine pictures chronologically into a single vertical image.</p>
          </div>
        </div>
        {hasImages && (
          <div className="flex gap-3">
            <button
              onClick={onClearAll}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              aria-label="Clear all images"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
              aria-label="Generate Image"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              Generate Image
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
