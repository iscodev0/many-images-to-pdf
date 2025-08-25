export interface ImageItem {
  id: string;
  file?: File;
  url?: string;
  preview: string;
  name: string;
  size: number;
  type: 'local' | 'url';
  originalFile: File;
  compressedFile: File;
  quality: 'sd' | 'hd';
}

export interface PDFSettings {
  pageFormat: 'a4' | 'letter' | 'legal' | 'comic';
  orientation: 'portrait' | 'landscape';
  marginVertical: number;
  marginHorizontal: number;
  imageSpacing: number;
  pdfQuality: 'FAST' | 'MEDIUM' | 'SLOW';
  includeMetadata: boolean;
  includePageNumbers: boolean;
  includeWatermark: boolean;
  outputQuality: 'sd' | 'hd' | 'comic';
  comicWidth?: number;
  comicHeight?: number;
  comicImageQuality?: number;
  quality?: 'sd' | 'hd';
}

export interface ComicSettings {
  pageWidth: number;
  pageHeight: number;
  imageQuality: number;
  pdfQuality: string;
  includeWatermark: boolean;
  includeMetadata: boolean;
  includePageNumbers: boolean;
  comicWidth?: number;
  comicHeight?: number;
  comicImageQuality?: number;
}

// Extend Window interface
declare global {
  interface Window {
    imageManager: any;
    pdfSettings: PDFSettings;
    openSettingsModal: () => void;
  }
}
