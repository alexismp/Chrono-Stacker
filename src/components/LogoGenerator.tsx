import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import toast from 'react-hot-toast';

export function LogoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const checkAndGenerateLogo = async () => {
      try {
        // Check if logo already exists
        const res = await fetch('/logo.png', { method: 'HEAD' });
        if (res.ok && res.headers.get('content-type')?.includes('image')) {
          return; // Logo exists
        }
      } catch (e) {
        // Ignore error and proceed to generate
      }

      setIsGenerating(true);
      toast.loading('Generating app logo with Nano Banana...', { id: 'logo-gen' });

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("No API key available");
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { text: 'A sleek, modern, minimalist logo for an app called ChronoStacker that chronologically stacks photos. The logo should feature a stack of photos or a timeline concept. Clean white background, flat design, suitable for an app icon. No text.' }
            ]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        });

        let base64Data = null;
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            base64Data = part.inlineData.data;
            break;
          }
        }

        if (!base64Data) {
          throw new Error("No image data returned from model");
        }

        const saveRes = await fetch('/api/save-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logoBase64: base64Data })
        });

        if (!saveRes.ok) {
          throw new Error("Failed to save logo");
        }

        toast.success('Logo generated successfully! Reloading...', { id: 'logo-gen' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error("Error generating logo:", error);
        toast.error('Failed to generate logo', { id: 'logo-gen' });
      } finally {
        setIsGenerating(false);
      }
    };

    checkAndGenerateLogo();
  }, []);

  if (!isGenerating) return null;

  return null;
}
