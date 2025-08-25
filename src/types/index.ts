export interface ImageItem {
  id: string;
  file?: File;
  url?: string;
  preview: string;
  name: string;
  size?: number;
  type: 'local' | 'url';
  originalFile?: File;
  compressedFile?: File;
  quality: 'sd' | 'hd';
}

export interface PDFSettings {
  quality: 'sd' | 'hd';
  pageWidth: number;
  pageHeight: number;
  margin: number;
}

export type QualityOption = 'sd' | 'hd';
