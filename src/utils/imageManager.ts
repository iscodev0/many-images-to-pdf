import type { ImageItem, PDFSettings } from '../types/images';
import { ImageProcessor } from './imageProcessor';
import { PDFGenerator } from './pdfGeneratorTyped';

export class ImageManager {
  private images: ImageItem[] = [];
  private currentQuality: '480px' | '720px' | 'original' = '720px';

  constructor() {
    this.initializeEventListeners();
    this.updateUI();
  }

  getCurrentQuality(): '480px' | '720px' | 'original' {
    // Get quality from settings modal (priority)
    const settings = (window as any).pdfSettings;
    if (settings && settings.quality) {
      return settings.quality;
    }
    
    // Fallback to default
    return this.currentQuality;
  }

  initializeEventListeners(): void {
    // File upload
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    fileInput?.addEventListener('change', this.handleFileUpload.bind(this));

    // URL input
    const urlInput = document.getElementById('url-input') as HTMLInputElement;
    const addUrlBtn = document.getElementById('add-url-btn') as HTMLButtonElement;
    addUrlBtn?.addEventListener('click', this.handleUrlAdd.bind(this));
    urlInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUrlAdd();
    });

    // Control buttons
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      if (typeof window.openSettingsModal === 'function') {
        window.openSettingsModal();
      }
    });
    document.getElementById('reverse-order-btn')?.addEventListener('click', this.reverseOrder.bind(this));
    document.getElementById('clear-all-btn')?.addEventListener('click', this.clearAll.bind(this));
    document.getElementById('update-quality-btn')?.addEventListener('click', this.updateAllImageQuality.bind(this));
    document.getElementById('download-pdf-btn')?.addEventListener('click', this.downloadPDF.bind(this));

    // Drag and drop
    this.initializeDragAndDrop();
  }

  async handleFileUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const imageItem = await ImageProcessor.processImageItem(file, 'local', this.getCurrentQuality());
        this.images.push(imageItem);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    }

    this.updateUI();
    input.value = ''; // Reset input
  }

  async handleUrlAdd(): Promise<void> {
    const urlInput = document.getElementById('url-input') as HTMLInputElement;
    const url = urlInput?.value.trim();
    
    if (!url) return;

    try {
      const file = await ImageProcessor.createImageFromUrl(url);
      const imageItem = await ImageProcessor.processImageItem(file, 'url', this.getCurrentQuality());
      this.images.push(imageItem);
      this.updateUI();
      if (urlInput) urlInput.value = ''; // Clear input
    } catch (error) {
      console.error('Error adding image from URL:', error);
      alert('Failed to load image from URL. Please check the URL and try again.');
    }
  }

  async updateAllImageQuality(): Promise<void> {
    const newQuality = this.getCurrentQuality();
    for (const image of this.images) {
      if (image.quality !== newQuality) {
        image.compressedFile = await ImageProcessor.compressImage(image.originalFile, newQuality);
        image.quality = newQuality;
      }
    }
    this.updateUI();
  }

  reverseOrder(): void {
    this.images.reverse();
    this.updateUI();
  }

  clearAll(): void {
    // Revoke object URLs to free memory
    this.images.forEach(image => {
      if (image.preview) {
        ImageProcessor.revokePreviewUrl(image.preview);
      }
    });
    this.images = [];
    this.updateUI();
  }

  async downloadPDF(): Promise<void> {
    if (this.images.length === 0) {
      alert('Please add some images first');
      return;
    }

    try {
      // Get settings from global window object or use comic defaults
      const userSettings = (window as any).pdfSettings || {
        pageFormat: 'comic',
        includeMetadata: false,
        includePageNumbers: true,
        includeWatermark: true,
        quality: '720px',
        comicWidth: 720,
        comicHeight: 3000
      };
      
      const settings: Partial<PDFSettings> = {
        ...userSettings
      };

      await PDFGenerator.generatePDF(this.images, settings);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }

  removeImage(id: string): void {
    const index = this.images.findIndex(img => img.id === id);
    if (index !== -1) {
      const image = this.images[index];
      if (image.preview) {
        ImageProcessor.revokePreviewUrl(image.preview);
      }
      this.images.splice(index, 1);
      this.updateUI();
    }
  }

  updateUI(): void {
    const tbody = document.getElementById('images-tbody') as HTMLTableSectionElement;
    const emptyState = document.getElementById('empty-state') as HTMLElement;
    const imageCount = document.getElementById('image-count') as HTMLElement;

    // Update counter
    const count = this.images.length;
    if (imageCount) {
      imageCount.textContent = `${count} image${count !== 1 ? 's' : ''}`;
    }

    if (this.images.length === 0) {
      if (tbody) tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    
    if (tbody) {
      tbody.innerHTML = this.images.map((image, index) => `
        <tr class="hover:bg-muted/50 cursor-move" draggable="true" data-index="${index}">
          <td class="p-4 text-sm font-medium text-muted-foreground">${index + 1}</td>
          <td class="p-4">
            <img src="${image.preview}" alt="${image.name}" class="w-12 h-12 object-cover rounded border" loading="lazy" />
          </td>
          <td class="p-4">
            <div class="space-y-1">
              <p class="text-sm font-medium truncate max-w-xs" title="${image.name}">${image.name}</p>
              <p class="text-xs text-muted-foreground">${image.type === 'url' ? 'URL' : 'Local file'}</p>
            </div>
          </td>
          <td class="p-4 text-sm text-muted-foreground">${this.formatFileSize(image.size)}</td>
          <td class="p-4">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              image.quality === 'original' ? 'bg-green-100 text-green-800' : 
              image.quality === '720px' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
            }">
              ${image.quality === 'original' ? 'ORIGINAL' : image.quality.toUpperCase()}
            </span>
          </td>
          <td class="p-4">
            <button 
              onclick="window.imageManager.removeImage('${image.id}')"
              class="inline-flex items-center justify-center w-8 h-8 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
              title="Remove image"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </td>
        </tr>
      `).join('');
    }

    // Re-initialize drag and drop for new elements
    this.initializeDragAndDrop();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  initializeDragAndDrop(): void {
    const tbody = document.getElementById('images-tbody') as HTMLTableSectionElement;
    if (!tbody) return;

    let draggedElement: HTMLElement | null = null;
    let draggedIndex = -1;
    
    // Touch-specific variables
    let touchStartY: number = 0;
    let isDragging: boolean = false;
    let touchOffset: number = 0;
    let ghostElement: HTMLElement | null = null;
    
    // Remove any existing listeners to prevent duplicates
    const newTbody = tbody.cloneNode(true) as HTMLTableSectionElement;
    tbody.parentNode?.replaceChild(newTbody, tbody);
    
    // Get fresh reference
    const freshTbody = document.getElementById('images-tbody') as HTMLTableSectionElement;
    if (!freshTbody) return;

    // Add styles only once
    if (!document.getElementById('simple-drag-styles')) {
      const style = document.createElement('style');
      style.id = 'simple-drag-styles';
      style.textContent = `
        .drag-over { background-color: rgba(59, 130, 246, 0.1) !important; border-top: 2px solid #3b82f6; }
        .dragging { opacity: 0.5; }
        .touch-dragging { 
          opacity: 0.3; 
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        .ghost-element {
          position: fixed;
          z-index: 1000;
          opacity: 0.8;
          pointer-events: none;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `;
      document.head.appendChild(style);
    }

    // Helper functions for touch support
    const getTouchY = (e: TouchEvent): number => {
      return e.touches[0]?.clientY || e.changedTouches[0]?.clientY || 0;
    };

    const createGhostElement = (sourceRow: HTMLTableRowElement): HTMLElement => {
      const ghost = sourceRow.cloneNode(true) as HTMLElement;
      ghost.className += ' ghost-element';
      ghost.style.position = 'fixed';
      ghost.style.top = '-1000px';
      ghost.style.left = '0';
      ghost.style.width = sourceRow.offsetWidth + 'px';
      ghost.style.zIndex = '1000';
      ghost.style.opacity = '0.8';
      ghost.style.backgroundColor = 'var(--muted)';
      ghost.style.pointerEvents = 'none';
      ghost.style.borderRadius = '8px';
      ghost.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      document.body.appendChild(ghost);
      return ghost;
    };

    const getRowFromPoint = (x: number, y: number): HTMLTableRowElement | null => {
      const elements = document.elementsFromPoint(x, y);
      for (const element of elements) {
        const row = element.closest('tr') as HTMLTableRowElement;
        if (row && row.dataset.index && row !== draggedElement) {
          return row;
        }
      }
      return null;
    };

    // MOUSE EVENTS (Desktop drag and drop)
    freshTbody.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tr') as HTMLTableRowElement;
      if (row) {
        draggedElement = row;
        draggedIndex = parseInt(row.dataset.index || '-1');
        row.classList.add('dragging');
        e.dataTransfer!.effectAllowed = 'move';
      }
    });

    freshTbody.addEventListener('dragend', (e) => {
      if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        draggedIndex = -1;
      }
      // Remove all drag-over classes
      freshTbody.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });

    freshTbody.addEventListener('dragover', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const row = target.closest('tr') as HTMLTableRowElement;
      if (row && row !== draggedElement) {
        // Remove drag-over from all rows
        freshTbody.querySelectorAll('.drag-over').forEach(el => {
          el.classList.remove('drag-over');
        });
        // Add to current row
        row.classList.add('drag-over');
      }
    });

    freshTbody.addEventListener('drop', (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const row = target.closest('tr') as HTMLTableRowElement;
      if (row && draggedElement && row !== draggedElement) {
        const toIndex = parseInt(row.dataset.index || '-1');
        this.performReorder(draggedIndex, toIndex);
      }
    });

    // TOUCH EVENTS (Mobile drag and drop)
    freshTbody.addEventListener('touchstart', (e) => {
      const target = e.target as HTMLElement;
      const row = target.closest('tr') as HTMLTableRowElement;
      if (row) {
        touchStartY = getTouchY(e);
        draggedElement = row;
        draggedIndex = parseInt(row.dataset.index || '-1');
        touchOffset = touchStartY - row.getBoundingClientRect().top;
        isDragging = false; // Will be set to true after threshold
        
        // Prevent default scrolling during potential drag
        e.preventDefault();
      }
    }, { passive: false });

    freshTbody.addEventListener('touchmove', (e) => {
      if (!draggedElement) return;
      
      const currentY = getTouchY(e);
      const deltaY = Math.abs(currentY - touchStartY);
      
      // Start dragging after a small threshold (prevents accidental drags)
      if (!isDragging && deltaY > 15) {
        isDragging = true;
        draggedElement.classList.add('touch-dragging');
        ghostElement = createGhostElement(draggedElement as HTMLTableRowElement);
      }
      
      if (isDragging) {
        e.preventDefault();
        
        // Move ghost element
        if (ghostElement) {
          ghostElement.style.top = (currentY - touchOffset) + 'px';
          ghostElement.style.left = draggedElement.getBoundingClientRect().left + 'px';
        }
        
        // Highlight target row
        const targetRow = getRowFromPoint(e.touches[0].clientX, currentY);
        
        // Remove previous highlights
        freshTbody.querySelectorAll('.drag-over').forEach(el => {
          el.classList.remove('drag-over');
        });
        
        // Add highlight to target
        if (targetRow && targetRow !== draggedElement) {
          targetRow.classList.add('drag-over');
        }
      }
    }, { passive: false });

    freshTbody.addEventListener('touchend', (e) => {
      if (!draggedElement) return;
      
      if (isDragging) {
        const currentY = getTouchY(e);
        const targetRow = getRowFromPoint(e.changedTouches[0].clientX, currentY);
        
        if (targetRow && draggedIndex !== -1) {
          const targetIndex = parseInt(targetRow.dataset.index || '-1');
          if (targetIndex !== -1 && targetIndex !== draggedIndex) {
            this.performReorder(draggedIndex, targetIndex);
          }
        }
        
        // Clean up ghost element
        if (ghostElement) {
          document.body.removeChild(ghostElement);
          ghostElement = null;
        }
      }
      
      // Clean up
      if (draggedElement) {
        draggedElement.classList.remove('touch-dragging');
        draggedElement = null;
      }
      draggedIndex = -1;
      isDragging = false;
      
      freshTbody.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });

    // Make all rows draggable
    this.updateDraggableRows();
  }

  updateDraggableRows(): void {
    const tbody = document.getElementById('images-tbody') as HTMLTableSectionElement;
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      row.setAttribute('draggable', 'true');
    });
  }

  performReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    
    // Reorder in the data array
    const [movedItem] = this.images.splice(fromIndex, 1);
    this.images.splice(toIndex, 0, movedItem);
    
    // Update UI
    this.renderImages();
    
    // Re-initialize drag and drop
    setTimeout(() => {
      this.initializeDragAndDrop();
    }, 50);
  }

  reorderImages(fromIndex: number, toIndex: number): void {
    this.performReorder(fromIndex, toIndex);
  }

  renderImages(): void {
    this.updateUI();
  }
}
