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

  static async generateComicStylePDF(images: ImageItem[], settings: Partial<PDFSettings> = {}): Promise<void> {
    const config: ComicSettings = {
      pageWidth: settings.comicWidth || 480,
      pageHeight: settings.comicHeight || 3000,
      imageQuality: settings.comicImageQuality || 0.85,
      pdfQuality: settings.pdfQuality || 'MEDIUM',
      includeWatermark: settings.includeWatermark !== false,
      includeMetadata: settings.includeMetadata === true, // Por defecto false para cómics
      includePageNumbers: settings.includePageNumbers !== false, // Por defecto true
      ...settings
    };

    const pdf = new jsPDF({
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });

    pdf.deletePage(1);
    pdf.addPage();
    let currentY = 0;

    // Watermark function for comic style
    const addWatermark = (doc: jsPDF) => {
      if (!config.includeWatermark) return;
      
      const text = 'Generated with pandascan.online';
      const fontSize = config.pageWidth < 500 ? 18 : 24;
      const opacity = 0.4;
      const margin = 20;
      
      doc.saveGraphicsState();
      (doc as any).setGState(new (doc as any).GState({ 'opacity': opacity }));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize);
      doc.setTextColor(150, 150, 150);
      doc.text(text, margin, 20);
      doc.text(text, margin, config.pageHeight - 20);
      doc.restoreGraphicsState();
    };

    // Add header if metadata is enabled
    if (config.includeMetadata) {
      pdf.setFontSize(16);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Image Collection', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      const date = new Date().toLocaleDateString();
      pdf.text(`Generated on ${date} - ${images.length} images`, 20, 35);
      
      currentY = 50;
    } else {
      currentY = 0; // Sin header en modo cómic por defecto
    }

    for (let i = 0; i < images.length; i++) {
      const imageItem = images[i];
      
      try {
        const dataUrl = await this.fileToDataUrl(imageItem.compressedFile);
        const imgData = await this.createImageFromDataUrl(dataUrl);
        
        // Comic style: usar todo el ancho disponible sin márgenes laterales
        const targetWidth = config.pageWidth;
        const aspectRatio = imgData.height / imgData.width;
        const width = targetWidth;
        const height = targetWidth * aspectRatio;
        
        // Check if we need a new page
        if (currentY + height > config.pageHeight) {
          pdf.addPage();
          currentY = 0;
        }
        
        // Add image sin espacios - estilo cómic continuo
        pdf.addImage(dataUrl, 'JPEG', 0, currentY, width, height);
        currentY += height; // Sin espacios adicionales
        
      } catch (error) {
        console.error('Error processing image in comic PDF:', error);
      }
    }

    addWatermark(pdf);
    
    // Add page numbers if enabled for comic style
    if (config.includePageNumbers) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(14);
        pdf.setTextColor(120, 120, 120);
        // Posición en la esquina inferior derecha
        pdf.text(`${i}/${totalPages}`, config.pageWidth - 50, config.pageHeight - 15);
      }
    }
    
    // Download with comic label
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `images-comic-style-${timestamp}.pdf`;
    pdf.save(filename);
    
    this.showSuccessMessage(images.length, filename);
  }

  static async generateStandardPDF(images: ImageItem[], settings: Partial<PDFSettings> = {}): Promise<void> {
    // Page format dimensions (in mm)
    const formats = {
      a4: { width: 210, height: 297 },
      letter: { width: 216, height: 279 },
      legal: { width: 216, height: 356 }
    };

    const pageFormat = formats[settings.pageFormat as keyof typeof formats] || formats.a4;
    const orientation = settings.orientation || 'portrait';
    
    const config = {
      quality: settings.quality || 'hd',
      pageWidth: orientation === 'portrait' ? pageFormat.width : pageFormat.height,
      pageHeight: orientation === 'portrait' ? pageFormat.height : pageFormat.width,
      margin: settings.marginVertical || 15,
      marginHorizontal: settings.marginHorizontal || 15,
      imageSpacing: settings.imageSpacing || 10,
      pdfQuality: settings.pdfQuality || 'MEDIUM',
      includeMetadata: settings.includeMetadata !== false,
      includePageNumbers: settings.includePageNumbers !== false,
      includeWatermark: settings.includeWatermark !== false,
      maxImagesPerPage: 6,
      ...settings
    };

    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: settings.pageFormat || 'a4',
    });

    let isFirstPage = true;
    let currentPageHeight = config.margin;
    const maxPageHeight = config.pageHeight - config.margin;
    const contentWidth = config.pageWidth - (config.margin + config.marginHorizontal);
    const maxImageWidth = contentWidth;
    const maxImageHeight = (maxPageHeight - config.margin) / 3;

    // Watermark function for standard style
    const addWatermark = (doc: jsPDF) => {
      if (!config.includeWatermark) return;
      
      const text = 'Generated with pandascan.online';
      const fontSize = 12;
      const opacity = 0.4;
      
      doc.saveGraphicsState();
      (doc as any).setGState(new (doc as any).GState({ 'opacity': opacity }));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(fontSize);
      doc.setTextColor(150, 150, 150);
      doc.text(text, config.margin, config.margin);
      doc.text(text, config.margin, config.pageHeight - 10);
      doc.restoreGraphicsState();
    };

    // Add header to first page
    if (images.length > 0 && config.includeMetadata) {
      pdf.setFontSize(16);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Image Collection', config.margin, config.margin);
      
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      const date = new Date().toLocaleDateString();
      pdf.text(`Generated on ${date} - ${images.length} images`, config.margin, config.margin + 8);
      
      currentPageHeight = config.margin + 20;
    }

    for (let i = 0; i < images.length; i++) {
      const imageItem = images[i];
      
      try {
        const dataUrl = await this.fileToDataUrl(imageItem.compressedFile);
        const imgData = await this.createImageFromDataUrl(dataUrl);
        
        // Calculate image dimensions to fit in the page
        const aspectRatio = imgData.width / imgData.height;
        let imageWidth = Math.min(maxImageWidth, imgData.width * 0.1);
        let imageHeight = imageWidth / aspectRatio;
        
        if (imageHeight > maxImageHeight) {
          imageHeight = maxImageHeight;
          imageWidth = imageHeight * aspectRatio;
        }

        // Check if image fits on current page
        if (currentPageHeight + imageHeight + config.imageSpacing > maxPageHeight) {
          pdf.addPage();
          currentPageHeight = config.margin;
          isFirstPage = false;
        }

        // Add image
        const x = config.margin + (contentWidth - imageWidth) / 2;
        pdf.addImage(dataUrl, 'JPEG', x, currentPageHeight, imageWidth, imageHeight);
        
        // Add image metadata if enabled
        if (config.includeMetadata) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          const metaText = `${imageItem.name} (${imageItem.quality.toUpperCase()})`;
          pdf.text(metaText, x, currentPageHeight + imageHeight + 5);
        }

        currentPageHeight += imageHeight + config.imageSpacing + (config.includeMetadata ? 10 : 0);
        
      } catch (error) {
        console.error('Error processing image in standard PDF:', error);
      }
    }

    // Add final watermark and page numbers
    addWatermark(pdf);
    
    // Add page numbers if enabled
    if (config.includePageNumbers) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Page ${i} of ${totalPages}`, config.pageWidth - 30, config.pageHeight - 10);
      }
    }

    // Download the PDF
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const qualityLabel = settings.outputQuality === 'sd' ? 'SD' : 'HD';
    const filename = `images-${qualityLabel}-${timestamp}.pdf`;
    pdf.save(filename);
    
    // Show success message
    this.showSuccessMessage(images.length, filename);
  }

  static createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  static showSuccessMessage(imageCount: number, filename: string): void {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        <div>
          <div class="font-medium">PDF Generated!</div>
          <div class="text-sm opacity-90">${imageCount} images → ${filename}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
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
