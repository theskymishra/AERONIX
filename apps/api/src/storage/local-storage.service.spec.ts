import { afterEach, describe, expect, it } from 'vitest';
import { rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { LocalStorageService } from './local-storage.service.js';

describe('LocalStorageService', () => {
  const service = new LocalStorageService();

  afterEach(async () => {
    await rm(join(process.cwd(), 'storage'), {
      recursive: true,
      force: true,
    });
  });

  it('stores uploaded file contents using the provided key', async () => {
    const result = await service.upload({
      key: 'employees/test/document.txt',
      body: Buffer.from('AERONIX'),
      contentType: 'text/plain',
    });

    const storedFile = await readFile(
      join(
        process.cwd(),
        'storage',
        'employees/test/document.txt',
      ),
      'utf8',
    );

    expect(result.key).toBe(
      'employees/test/document.txt',
    );
    expect(storedFile).toBe('AERONIX');
  });

  it('rejects path traversal keys', async () => {
    await expect(
      service.upload({
        key: '../outside.txt',
        body: Buffer.from('unsafe'),
      }),
    ).rejects.toThrow('Invalid storage key');
  });

  it('rejects absolute-style storage keys', async () => {
    await expect(
      service.upload({
        key: '/../../outside.txt',
        body: Buffer.from('unsafe'),
      }),
    ).rejects.toThrow('Invalid storage key');
  });
});
