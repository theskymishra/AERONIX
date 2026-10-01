import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LocalStorageService } from './local-storage.service.js';

describe('LocalStorageService', () => {
  const originalCwd = process.cwd();
  let testDirectory: string;

  afterEach(async () => {
    process.chdir(originalCwd);

    if (testDirectory) {
      await rm(testDirectory, {
        recursive: true,
        force: true,
      });
    }
  });

  it('stores uploaded file contents using the provided key', async () => {
    testDirectory = await mkdtemp(
      join(tmpdir(), 'aeronix-storage-test-'),
    );

    process.chdir(testDirectory);

    const service = new LocalStorageService();

    const result = await service.upload({
      key: 'employees/test/document.txt',
      body: Buffer.from('AERONIX'),
      contentType: 'text/plain',
    });

    const storedFile = await readFile(
      join(
        testDirectory,
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

  it('reads stored file contents using the provided key', async () => {
    testDirectory = await mkdtemp(
      join(tmpdir(), 'aeronix-storage-test-'),
    );

    process.chdir(testDirectory);

    const service = new LocalStorageService();

    await service.upload({
      key: 'employees/test/document.pdf',
      body: Buffer.from('%PDF-1.4 test'),
      contentType: 'application/pdf',
    });

    const result = await service.get(
      'employees/test/document.pdf',
    );

    expect(result.body.toString()).toBe(
      '%PDF-1.4 test',
    );
  });

  it('rejects path traversal keys', async () => {
    testDirectory = await mkdtemp(
      join(tmpdir(), 'aeronix-storage-test-'),
    );

    process.chdir(testDirectory);

    const service = new LocalStorageService();

    await expect(
      service.upload({
        key: '../outside.txt',
        body: Buffer.from('unsafe'),
      }),
    ).rejects.toThrow('Invalid storage key');
  });

  it('rejects absolute-style storage keys', async () => {
    testDirectory = await mkdtemp(
      join(tmpdir(), 'aeronix-storage-test-'),
    );

    process.chdir(testDirectory);

    const service = new LocalStorageService();

    await expect(
      service.upload({
        key: '/../../outside.txt',
        body: Buffer.from('unsafe'),
      }),
    ).rejects.toThrow('Invalid storage key');
  });
});
