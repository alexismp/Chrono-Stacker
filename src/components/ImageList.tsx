import React from 'react';
import { Trash2 } from 'lucide-react';
import { ImageFile } from '../types';

interface ImageListProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
}

export function ImageList({ images, onRemove }: ImageListProps) {
  if (images.length === 0) return null;

  return (
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
              onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Remove image"
              aria-label={`Remove ${img.file.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
