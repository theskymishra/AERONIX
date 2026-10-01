export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType?: string;
}

export interface StorageUploadResult {
  key: string;
  url?: string;
}

export interface StorageService {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;

  delete(key: string): Promise<void>;
}