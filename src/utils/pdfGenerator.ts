import jsPDF from 'jspdf';
import type { ImageItem, PDFSettings, ComicSettings } from '../types/images';

export class PDFGenerator {
  static async generatePDF(images: ImageItem[], settings: Partial<PDFSettings> = {}): Promise<void> {
    // Check if comic style is enabled (now from pageFormat)
    const isComicStyle = settings.pageFormat === 'comic' || settings.outputQuality === 'comic';
    
    if (isComicStyle) {
      return this.generateComicStylePDF(images, settings);
    } else {
      return this.generateStandardPDF(images, settings);
    }
  }
    });

    let isFirstPage = true;
    let currentPageHeight = config.margin;
    const maxPageHeight = config.pageHeight - config.margin;
    const contentWidth = config.pageWidth - (config.margin * 2);

    for (const imageItem of images) {
      try {
        const file = imageItem.compressedFile || imageItem.originalFile;
        if (!file) continue;

        const imageDataUrl = await this.fileToDataUrl(file);
        const imgDimensions = await this.getImageDimensions(imageDataUrl);
        
        // Calculate scaled dimensions to fit within page width
        const scaleFactor = Math.min(contentWidth / imgDimensions.width, 1);
        const scaledWidth = imgDimensions.width * scaleFactor;
        const scaledHeight = imgDimensions.height * scaleFactor;

        // Check if we need a new page
        if (!isFirstPage && (currentPageHeight + scaledHeight) > maxPageHeight) {
          pdf.addPage();
          currentPageHeight = config.margin;
        }

        // Add image to PDF
        pdf.addImage(
          imageDataUrl,
          'JPEG',
          config.margin,
          currentPageHeight,
          scaledWidth,
          scaledHeight
        );

        currentPageHeight += scaledHeight + 5; // 5mm spacing between images
        isFirstPage = false;

      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
    }

    // Download the PDF
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    pdf.save(`images-to-pdf-${timestamp}.pdf`);
  }

  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private static getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
}
