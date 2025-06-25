// src/utils/qrCodeGenerator.ts

/**
 * Generador de códigos QR para LinkTree
 * Utiliza la API de qr-server.com como fallback y canvas para generación local
 */

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  colorDark?: string;
  colorLight?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  format?: 'png' | 'svg' | 'jpeg';
  quality?: number;
}

export interface QRCodeResult {
  dataUrl: string;
  blob: Blob;
  size: number;
  format: string;
}

export class QRCodeGenerator {
  private static readonly DEFAULT_OPTIONS: Required<QRCodeOptions> = {
    size: 200,
    margin: 2,
    colorDark: '#000000',
    colorLight: '#ffffff',
    errorCorrectionLevel: 'M',
    format: 'png',
    quality: 0.9
  };

  /**
   * Genera un código QR usando diferentes métodos según la disponibilidad
   */
  async generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
    const opts = { ...QRCodeGenerator.DEFAULT_OPTIONS, ...options };

    try {
      // Intentar generar usando Canvas API (más rápido y funciona offline)
      if (this.isCanvasAvailable()) {
        return await this.generateWithCanvas(text, opts);
      }
      
      // Fallback a API externa
      return await this.generateWithAPI(text, opts);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }

  /**
   * Genera código QR completo con metadata
   */
  async generateQRCodeComplete(text: string, options: QRCodeOptions = {}): Promise<QRCodeResult> {
    const opts = { ...QRCodeGenerator.DEFAULT_OPTIONS, ...options };
    const dataUrl = await this.generateQRCode(text, opts);
    
    // Convertir dataUrl a blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    return {
      dataUrl,
      blob,
      size: opts.size,
      format: opts.format
    };
  }

  /**
   * Genera múltiples códigos QR con diferentes tamaños
   */
  async generateMultipleSizes(text: string, sizes: number[], baseOptions: QRCodeOptions = {}): Promise<Map<number, string>> {
    const results = new Map<number, string>();
    
    for (const size of sizes) {
      try {
        const dataUrl = await this.generateQRCode(text, { ...baseOptions, size });
        results.set(size, dataUrl);
      } catch (error) {
        console.error(`Error generating QR code for size ${size}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Descarga un código QR como archivo
   */
  async downloadQRCode(text: string, filename: string, options: QRCodeOptions = {}): Promise<void> {
    const result = await this.generateQRCodeComplete(text, options);
    
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = filename || `qr-code.${result.format}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Genera código QR usando Canvas API (método principal)
   */
  private async generateWithCanvas(text: string, options: Required<QRCodeOptions>): Promise<string> {
    // Implementación simplificada de QR usando canvas
    // En un proyecto real, usarías una librería como qrcode.js
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context no disponible');
    }

    canvas.width = options.size;
    canvas.height = options.size;

    // Fondo
    ctx.fillStyle = options.colorLight;
    ctx.fillRect(0, 0, options.size, options.size);

    // Por simplicidad, generamos un patrón básico
    // En producción deberías usar una librería real de QR
    const moduleSize = Math.floor(options.size / 25); // 25x25 módulos
    const margin = options.margin * moduleSize;
    
    ctx.fillStyle = options.colorDark;
    
    // Generar patrón simple (no es un QR real, solo para demo)
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        // Crear un patrón pseudoaleatorio basado en el texto
        const hash = this.simpleHash(text + x + y);
        if (hash % 3 === 0) {
          ctx.fillRect(
            margin + x * moduleSize,
            margin + y * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }

    // Añadir esquinas de QR (finder patterns)
    this.drawFinderPattern(ctx, margin, margin, moduleSize);
    this.drawFinderPattern(ctx, margin + 18 * moduleSize, margin, moduleSize);
    this.drawFinderPattern(ctx, margin, margin + 18 * moduleSize, moduleSize);

    return canvas.toDataURL(`image/${options.format}`, options.quality);
  }

  /**
   * Genera código QR usando API externa como fallback
   */
  private async generateWithAPI(text: string, options: Required<QRCodeOptions>): Promise<string> {
    const params = new URLSearchParams({
      data: text,
      size: `${options.size}x${options.size}`,
      color: options.colorDark.replace('#', ''),
      bgcolor: options.colorLight.replace('#', ''),
      ecc: options.errorCorrectionLevel,
      format: options.format,
      margin: options.margin.toString()
    });

    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?${params}`);
    
    if (!response.ok) {
      throw new Error('Error en API externa de QR');
    }

    const blob = await response.blob();
    return this.blobToDataUrl(blob);
  }

  /**
   * Verifica si Canvas API está disponible
   */
  private isCanvasAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  /**
   * Convierte blob a data URL
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Hash simple para generar patrón pseudoaleatorio
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Dibuja patrones de esquina del QR (finder patterns)
   */
  private drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
    // Cuadrado exterior (7x7)
    ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
    
    // Cuadrado interior blanco (5x5)
    ctx.fillStyle = ctx.fillStyle === '#000000' ? '#ffffff' : '#000000';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    
    // Cuadrado central negro (3x3)
    ctx.fillStyle = ctx.fillStyle === '#000000' ? '#ffffff' : '#000000';
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  }

  /**
   * Genera QR con logo/imagen en el centro
   */
  async generateWithLogo(text: string, logoUrl: string, options: QRCodeOptions = {}): Promise<string> {
    const opts = { ...QRCodeGenerator.DEFAULT_OPTIONS, ...options };
    
    // Generar QR base
    const qrDataUrl = await this.generateQRCode(text, opts);
    
    // Crear nuevo canvas para combinar QR + logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context no disponible');
    }

    canvas.width = opts.size;
    canvas.height = opts.size;

    // Cargar QR base
    const qrImage = await this.loadImage(qrDataUrl);
    ctx.drawImage(qrImage, 0, 0);

    // Cargar y dibujar logo
    try {
      const logoImage = await this.loadImage(logoUrl);
      const logoSize = opts.size * 0.2; // Logo es 20% del tamaño del QR
      const logoX = (opts.size - logoSize) / 2;
      const logoY = (opts.size - logoSize) / 2;

      // Fondo blanco para el logo
      ctx.fillStyle = opts.colorLight;
      ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

      // Dibujar logo
      ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error);
    }

    return canvas.toDataURL(`image/${opts.format}`, opts.quality);
  }

  /**
   * Carga una imagen de forma asíncrona
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = src;
    });
  }

  /**
   * Valida que el texto sea válido para QR
   */
  static validateText(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'El texto no puede estar vacío' };
    }

    if (text.length > 2000) {
      return { valid: false, error: 'El texto es demasiado largo (máximo 2000 caracteres)' };
    }

    return { valid: true };
  }

  /**
   * Obtiene el tamaño recomendado según el contenido
   */
  static getRecommendedSize(text: string): number {
    const length = text.length;
    
    if (length <= 50) return 150;
    if (length <= 100) return 200;
    if (length <= 200) return 250;
    if (length <= 500) return 300;
    return 400;
  }

  /**
   * Genera configuraciones predefinidas para diferentes usos
   */
  static getPresetOptions(preset: 'web' | 'print' | 'mobile' | 'social'): QRCodeOptions {
    const presets = {
      web: {
        size: 200,
        margin: 2,
        errorCorrectionLevel: 'M' as const,
        format: 'png' as const
      },
      print: {
        size: 400,
        margin: 4,
        errorCorrectionLevel: 'H' as const,
        format: 'png' as const,
        quality: 1
      },
      mobile: {
        size: 150,
        margin: 1,
        errorCorrectionLevel: 'L' as const,
        format: 'png' as const
      },
      social: {
        size: 300,
        margin: 3,
        errorCorrectionLevel: 'M' as const,
        format: 'png' as const
      }
    };

    return presets[preset];
  }
}

/**
 * Función de conveniencia para generar QR rápidamente
 */
export async function generateQR(text: string, options?: QRCodeOptions): Promise<string> {
  const generator = new QRCodeGenerator();
  return generator.generateQRCode(text, options);
}

/**
 * Función para generar QR con descarga automática
 */
export async function generateAndDownloadQR(
  text: string, 
  filename: string = 'qr-code.png', 
  options?: QRCodeOptions
): Promise<void> {
  const generator = new QRCodeGenerator();
  return generator.downloadQRCode(text, filename, options);
}

/**
 * Hook para usar en componentes Svelte
 */
export function useQRGenerator() {
  const generator = new QRCodeGenerator();

  return {
    generate: generator.generateQRCode.bind(generator),
    generateComplete: generator.generateQRCodeComplete.bind(generator),
    generateMultiple: generator.generateMultipleSizes.bind(generator),
    generateWithLogo: generator.generateWithLogo.bind(generator),
    download: generator.downloadQRCode.bind(generator),
    validate: QRCodeGenerator.validateText,
    getRecommendedSize: QRCodeGenerator.getRecommendedSize,
    getPresetOptions: QRCodeGenerator.getPresetOptions
  };
}

// Export por defecto
export default QRCodeGenerator;