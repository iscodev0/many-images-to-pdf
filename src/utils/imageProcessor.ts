import imageCompression from 'browser-image-compression';
import type { ImageItem } from '../types/images';

export class ImageProcessor {
  static async compressImage(file: File, quality: 'sd' | 'hd'): Promise<File> {
    const options = {
      maxSizeMB: quality === 'sd' ? 0.5 : 2,
      maxWidthOrHeight: quality === 'sd' ? 800 : 1920,
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file;
    }
  }

  static async createImageFromUrl(url: string): Promise<File> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const filename = url.split('/').pop() || 'image.jpg';
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error creating image from URL:', error);
      throw error;
    }
  }

  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static async processImageItem(
    file: File, 
    type: 'local' | 'url', 
    quality: 'sd' | 'hd' = 'hd'
  ): Promise<ImageItem> {
    const id = this.generateId();
    const preview = this.createPreviewUrl(file);
    
    const compressedFile = await this.compressImage(file, quality);

    return {
      id,
      file: type === 'local' ? file : undefined,
      url: type === 'url' ? preview : undefined,
      preview,
      name: file.name,
      size: file.size,
      type,
      originalFile: file,
      compressedFile,
      quality,
    };
  }

  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
}
