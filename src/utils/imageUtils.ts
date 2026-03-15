import exifr from 'exifr';
import { jsPDF } from 'jspdf';
import { ImageFile } from '../types';

export function extractDateFromFilename(filename: string): number | null {
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

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per image

export async function processImageFiles(files: File[], existingImages: ImageFile[]): Promise<ImageFile[]> {
  const newImages: ImageFile[] = [];
  
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.warn(`Skipped ${file.name}: Unsupported file type ${file.type}`);
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      console.warn(`Skipped ${file.name}: File exceeds 25MB limit`);
      continue;
    }
    
    const id = `${file.name}-${file.size}`;
    
    // Skip duplicates
    if (existingImages.some(img => img.id === id) || newImages.some(img => img.id === id)) {
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
      throw new Error(`Failed to process ${file.name}`);
    }
  }
  
  return newImages;
}

export async function generateChronologicalStack(images: ImageFile[]): Promise<string[]> {
  if (images.length === 0) return [];
  
  const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp);
  const globalMaxWidth = Math.max(...sortedImages.map(img => img.width));
  
  // Limit the height of the resulting pages to 1.5 the largest width
  const MAX_CANVAS_HEIGHT = globalMaxWidth * 1.5;
  
  const chunks: { images: ImageFile[], height: number }[] = [];
  let currentChunkImages: ImageFile[] = [];
  let currentHeight = 0;
  
  for (const img of sortedImages) {
    if (currentHeight + img.height > MAX_CANVAS_HEIGHT && currentChunkImages.length > 0) {
      chunks.push({ images: currentChunkImages, height: currentHeight });
      currentChunkImages = [img];
      currentHeight = img.height;
    } else {
      currentChunkImages.push(img);
      currentHeight += img.height;
    }
  }
  if (currentChunkImages.length > 0) {
    chunks.push({ images: currentChunkImages, height: currentHeight });
  }
  
  const generatedUrls: string[] = [];
  
  for (const chunk of chunks) {
    const canvas = document.createElement('canvas');
    canvas.width = globalMaxWidth;
    canvas.height = chunk.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    
    // Fill background with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let currentY = 0;
    for (const imgData of chunk.images) {
      const img = await loadImage(imgData.url);
      ctx.drawImage(img, 0, currentY, imgData.width, imgData.height);
      currentY += imgData.height;
    }
    
    generatedUrls.push(canvas.toDataURL('image/png'));
  }
  
  return generatedUrls;
}

export async function generatePDF(resultImages: string[]): Promise<void> {
  if (resultImages.length === 0) return;
  
  let pdf: jsPDF | null = null;
  
  for (let i = 0; i < resultImages.length; i++) {
    const imgUrl = resultImages[i];
    const img = await loadImage(imgUrl);
    
    const width = img.width;
    const height = img.height;
    const orientation = width > height ? 'l' : 'p';
    
    if (!pdf) {
      pdf = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [width, height]
      });
      pdf.addImage(imgUrl, 'PNG', 0, 0, width, height);
    } else {
      pdf.addPage([width, height], orientation);
      pdf.addImage(imgUrl, 'PNG', 0, 0, width, height);
    }
  }
  
  if (pdf) {
    pdf.save(`chronological-stack-${new Date().getTime()}.pdf`);
  }
}

export function downloadImages(resultImages: string[]): void {
  if (resultImages.length === 0) return;
  
  resultImages.forEach((url, index) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = url;
      const suffix = resultImages.length > 1 ? `-part${index + 1}` : '';
      a.download = `chronological-stack-${new Date().getTime()}${suffix}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, index * 300); // Stagger downloads slightly
  });
}
