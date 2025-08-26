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
  quality: '480px' | '720px' | 'original';
}

export interface PDFSettings {
  pageFormat: 'a4' | 'letter' | 'legal' | 'comic';
  orientation: 'portrait' | 'landscape';
  marginVertical: number;
  marginHorizontal: number;
  imageSpacing: number;
  includeMetadata: boolean;
  includePageNumbers: boolean;
  includeWatermark: boolean;
  quality: '480px' | '720px' | 'original';
  comicWidth?: number;
  comicHeight?: number;
}

export interface ComicSettings {
  pageWidth: number;
  pageHeight: number;
  imageQuality: number;
  includeWatermark: boolean;
  includeMetadata: boolean;
  includePageNumbers: boolean;
}

// Extend Window interface
declare global {
  interface Window {
    imageManager: any;
    pdfSettings: PDFSettings;
    openSettingsModal: () => void;
  }
}
