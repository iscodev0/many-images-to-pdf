import imageCompression from 'browser-image-compression';
import type { ImageItem } from '../types/images';

export class ImageProcessor {
  static async compressImage(file: File, quality: '480px' | '720px' | 'original'): Promise<File> {
    // Si es calidad original, devolver el archivo sin modificar
    if (quality === 'original') {
      return file;
    }

    try {
      // Configuración mejorada para evitar pixelado excesivo
      const maxWidthPx = quality === '480px' ? 480 : 720;
      
      // Detectar dimensiones reales de la imagen
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      URL.revokeObjectURL(imageUrl);
      
      console.log(`📐 Dimensiones originales: ${img.width}x${img.height}`);
      console.log(`📦 Tamaño archivo: ${(file.size / 1024).toFixed(1)}KB`);
      
      // Detectar imágenes muy altas (webtoons, comics verticales)
      const aspectRatio = img.height / img.width;
      const isVeryTall = aspectRatio > 5; // Más de 5 veces más alto que ancho
      
      // Solo NO comprimir si la imagen ya es MUY pequeña de ancho
      const isTooSmallToCompress = img.width < maxWidthPx * 0.8; // Menos del 80% del target
      
      if (isTooSmallToCompress) {
        console.log(`⚡ Imagen muy pequeña (${img.width}px ancho), no redimensionando`);
        return file;
      }
      
      // Para webtoons/comics verticales, necesitamos una estrategia especial
      let options;
      
      if (isVeryTall) {
        // Para webtoons: SOLO reducir calidad, NUNCA redimensionar
        console.log(`🎨 Webtoon detectado (${img.width}x${img.height}), manteniendo resolución exacta`);
        options = {
          // NO usar maxWidthOrHeight para webtoons
          maxSizeMB: quality === '480px' ? 0.8 : 1.5, // Más agresivo con el tamaño
          initialQuality: quality === '480px' ? 0.65 : 0.75, // Más compresión
          alwaysKeepResolution: true, // ¡CLAVE! Mantener resolución exacta
          useWebWorker: true,
          fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          exifOrientation: 1,
        };
      } else {
        // Para imágenes normales: redimensionar normalmente
        console.log(`📐 Imagen normal (${img.width}x${img.height}), redimensionando si es necesario`);
        options = {
          maxWidthOrHeight: maxWidthPx,
          maxSizeMB: quality === '480px' ? 0.5 : 1, // Más agresivo también
          initialQuality: quality === '480px' ? 0.7 : 0.8, // Más compresión
          alwaysKeepResolution: false, // Permitir redimensionamiento
          useWebWorker: true,
          fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          exifOrientation: 1,
        };
      }

      const compressedFile = await imageCompression(file, options, );
      
      // Lógica más agresiva para forzar compresión
      const compressionRatio = compressedFile.size / file.size;
      const originalSizeMB = file.size / (1024 * 1024);
      
      // Solo usar original si la compresión realmente falló
      if (compressionRatio > 0.95) {
        console.log(`⚠️ Compresión mínima (${(compressionRatio * 100).toFixed(1)}%), usando original`);
        return file;
      }

      console.log(`✅ Imagen optimizada: ${file.name}`);
      console.log(`📐 Dimensiones: ${img.width}x${img.height}${isVeryTall ? ' (mantenidas)' : ` → ~${maxWidthPx}px ancho`}`);
      console.log(`📦 Tamaño: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
      console.log(`📉 Reducción: ${((1 - compressionRatio) * 100).toFixed(1)}%`);
      console.log(`🎨 Tipo: ${isVeryTall ? 'Webtoon/Comic vertical' : 'Imagen normal'}`);
      
      return compressedFile;
    } catch (error) {
      console.error('❌ Error comprimiendo imagen:', error);
      return file; // En caso de error, devolver original
    }
  }

  static async createImageFromUrl(url: string): Promise<File> {
    try {
      // Configuración más compatible para evitar problemas de CORS
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'default',
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}: No se pudo cargar la imagen desde la URL`);
      }
      
      const blob = await response.blob();
      
      // Validar que es realmente una imagen
      if (!blob.type.startsWith('image/')) {
        throw new Error('El archivo descargado no es una imagen válida');
      }
      
      // Extraer nombre del archivo de la URL con extensión correcta
      let filename = url.split('/').pop()?.split('?')[0] || 'image';
      
      // Si no tiene extensión, añadir basada en el tipo MIME
      if (!filename.includes('.')) {
        const extension = blob.type.split('/')[1] || 'jpg';
        filename += `.${extension}`;
      }
      
      console.log(`✅ Imagen descargada desde URL: ${filename}`);
      console.log(`📦 Tamaño descargado: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`🎨 Tipo: ${blob.type}`);
      
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('❌ Error descargando imagen desde URL:', error);
      
      // Intentar una descarga más simple si la primera falla
      try {
        console.log('🔄 Intentando descarga simple...');
        const simpleResponse = await fetch(url);
        
        if (!simpleResponse.ok) {
          throw new Error(`HTTP ${simpleResponse.status}`);
        }
        
        const blob = await simpleResponse.blob();
        const filename = url.split('/').pop()?.split('?')[0] || 'image.jpg';
        
        console.log(`✅ Descarga simple exitosa: ${filename}`);
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
        
      } catch (secondError) {
        console.error('❌ Descarga simple también falló:', secondError);
        throw new Error(`No se pudo descargar la imagen. Verifica que la URL sea correcta y que la imagen sea accesible.`);
      }
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
    quality: '480px' | '720px' | 'original' = '720px'
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
