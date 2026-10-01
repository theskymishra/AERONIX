import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  StorageService,
  StorageUploadInput,
  StorageUploadResult,
  StorageReadResult,
} from './storage.interface.js';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly rootDirectory = join(process.cwd(), 'storage');

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const safeKey = this.normalizeKey(input.key);

    const filePath = join(this.rootDirectory, safeKey);

    await mkdir(dirname(filePath), {
      recursive: true,
    });

    await writeFile(filePath, input.body);

    return {
      key: safeKey,
    };
  }

  async delete(key: string): Promise<void> {
    const safeKey = this.normalizeKey(key);

    const filePath = join(this.rootDirectory, safeKey);

    try {
      await unlink(filePath);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'ENOENT'
      ) {
        throw new NotFoundException('Stored file not found');
      }

      throw error;
    }
  }

  async get(key: string): Promise<StorageReadResult> {
    const safeKey = this.normalizeKey(key);

    const filePath = join(this.rootDirectory, safeKey);

    try {
      const file = await readFile(filePath);

      return {
        body: file,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'ENOENT'
      ) {
        throw new NotFoundException('Stored file not found');
      }

      throw error;
    }
  }

  private normalizeKey(key: string): string {
    const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '');

    if (!normalized || normalized.split('/').includes('..')) {
      throw new Error('Invalid storage key');
    }

    return normalized;
  }
}
