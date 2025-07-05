declare module 'qrcode' {
  export interface QRCodeOptions {
    width?: number;
    scale?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    rendererOpts?: {
      quality?: number;
    };
  }

  export interface QRCodeToDataURLOptions extends QRCodeOptions {
    rendererOpts?: {
      quality?: number;
    };
  }

  export interface QRCodeToCanvasOptions extends QRCodeOptions {
    canvas?: HTMLCanvasElement;
  }

  export interface QRCodeToStringOptions extends QRCodeOptions {
    small?: boolean;
  }

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<HTMLCanvasElement>;

  export function toString(
    text: string,
    options?: QRCodeToStringOptions
  ): Promise<string>;

  export function toBuffer(
    text: string,
    options?: QRCodeOptions
  ): Promise<Buffer>;

  export function create(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export default {
    toDataURL,
    toCanvas,
    toString,
    toBuffer,
    create
  };
} 