import { describe, it, expect, vi, beforeEach } from 'vitest';
import { snapshotRepository } from '../../src/storage/repositories/SnapshotRepository';
import { db } from '../../src/storage/database';
import { Snapshot } from '../../src/storage/models/Snapshot';

// Mock the entire db module
vi.mock('../../src/storage/database', () => {
  const mockDb = {
    snapshots: {
      add: vi.fn(),
      get: vi.fn(),
      orderBy: vi.fn().mockReturnThis(),
      reverse: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      sortBy: vi.fn(),
    },
    annotations: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      delete: vi.fn(),
    },
    transaction: vi.fn((...args) => {
      // The actual callback is the last argument provided to the function.
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return callback(); // Execute the callback
      }
      return Promise.resolve(); // Return a resolved promise if no callback
    }),
  };
  return { db: mockDb };
});

describe('SnapshotRepository', () => {
  // Clear mock history before each test, but keep mock implementations.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSnapshot: Snapshot = {
      id: 'test-id',
      title: 'Test Snapshot',
      url: 'https://example.com',
      content: { html: '<p>test</p>', text: 'test' },
      metadata: { capturedAt: new Date().toISOString(), wordCount: 1, language: 'en' },
      annotations: [],
      categories: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  };

  it('should create a new snapshot with a generated ID and timestamps', async () => {
    // Arrange
    const inputData = { ...mockSnapshot };
    // @ts-ignore
    delete inputData.id;

    (db.snapshots.add as any).mockResolvedValue('new-id');

    // Act
    const result = await snapshotRepository.create(inputData);

    // Assert
    expect(db.snapshots.add).toHaveBeenCalledTimes(1);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.title).toBe(mockSnapshot.title);
  });

  it('should find a snapshot by its ID', async () => {
    // Arrange
    (db.snapshots.get as any).mockResolvedValue(mockSnapshot);
    const id = 'test-id';

    // Act
    const result = await snapshotRepository.findById(id);

    // Assert
    expect(db.snapshots.get).toHaveBeenCalledWith(id);
    expect(result).toEqual(mockSnapshot);
  });

  it('should retrieve all snapshots sorted by date', async () => {
    // Arrange
    const mockSnapshots = [mockSnapshot, { ...mockSnapshot, id: 'test-id-2' }];
    (db.snapshots.orderBy as any).mockReturnThis();
    (db.snapshots.reverse as any).mockReturnThis();
    (db.snapshots.toArray as any).mockResolvedValue(mockSnapshots);

    // Act
    const result = await snapshotRepository.findAll();

    // Assert
    expect(db.snapshots.orderBy).toHaveBeenCalledWith('createdAt');
    expect(db.snapshots.reverse).toHaveBeenCalled();
    expect(result).toEqual(mockSnapshots);
  });

  it('should delete a snapshot and its annotations within a transaction', async () => {
    // Arrange
    const id = 'test-id';

    // Act
    await snapshotRepository.delete(id);

    // Assert
    expect(db.transaction).toHaveBeenCalled();
    expect(db.annotations.where).toHaveBeenCalledWith('snapshotId');
    expect(db.annotations.equals).toHaveBeenCalledWith(id);
    expect(db.annotations.delete).toHaveBeenCalled();
    expect(db.snapshots.delete).toHaveBeenCalledWith(id);
  });
});