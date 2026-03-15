# ChronoStacker

ChronoStacker is a web application that takes multiple pictures as input and creates one or more pages by placing them in chronological order. It is perfect for creating timelines, progress pictures, or sequential photo strips.

## Features

* **Chronological Sorting:** Automatically sorts images from oldest to newest by extracting EXIF metadata (`DateTimeOriginal`, `CreateDate`). If EXIF data is unavailable, it falls back to parsing dates from the filename or using the file's last modified date.
* **Automatic Deduplication:** Ignores duplicate images based on file name and size.
* **Smart Stacking:** The resulting image's width is defined by the widest picture provided, with smaller pictures left-justified.
* **Smart Chunking:** Automatically splits the resulting image into multiple parts if the total height exceeds 1.5 times the maximum width, ensuring optimal viewing and preventing browser canvas limits.
* **PDF Export:** Download the generated chronological stack as a single, multi-page PDF document, where each page perfectly matches the dimensions of the generated image chunks.
* **AI Logo Generation:** Automatically generates a sleek, modern app logo and favicon on first load using the Gemini 2.5 Flash Image model.
* **Privacy First:** All processing happens directly in the browser. No images are ever uploaded to a server.

## Architecture

This application is built as a Client-Side Single Page Application (SPA) with the following technology stack:

* **Frontend Framework:** React 19 with TypeScript.
* **Build Tool:** Vite for fast, modern web development.
* **Styling:** Tailwind CSS (v4) for responsive, utility-first styling.
* **Image Processing:** Native HTML5 `<canvas>` API for image stitching and rendering.
* **AI Integration:** `@google/genai` SDK for generating the app's logo using the `gemini-2.5-flash-image` model.
* **Custom Vite Plugin:** A custom development server middleware (`save-logo`) that permanently saves the generated logo to the `public/` directory.
* **PDF Generation:** `jspdf` library for creating multi-page PDF documents directly on the client.
* **Metadata Extraction:** `exifr` library for fast and robust EXIF data parsing directly in the browser.
* **Icons:** `lucide-react` for clean, consistent SVG icons.

Because this application relies entirely on client-side processing, it is highly performant and respects user privacy. The browser's memory and canvas size limits dictate the maximum processing capabilities, which is why the application implements automatic chunking for very tall image stacks.

## Getting Started

To run this application locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by creating a `.env` file in the root directory and adding your Gemini API key (required for the initial logo generation):
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to the URL provided in the terminal (usually `http://localhost:3000`).
