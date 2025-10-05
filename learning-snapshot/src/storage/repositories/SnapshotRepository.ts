import { db } from '../database';
import type { Snapshot } from '../models/Snapshot';

class SnapshotRepository {
  /**
   * Creates a new snapshot in the database.
   * @param snapshot - The snapshot data to create, without the 'id', 'createdAt', or 'updatedAt' fields.
   * @returns The newly created snapshot object.
   */
  async create(snapshot: Omit<Snapshot, 'id' | 'createdAt' | 'updatedAt'>): Promise<Snapshot> {
    const id = crypto.randomUUID();
    const newSnapshot: Snapshot = {
      ...snapshot,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.snapshots.add(newSnapshot);
    return newSnapshot;
  }

  /**
   * Finds a snapshot by its ID.
   * @param id - The UUID of the snapshot to find.
   * @returns The snapshot object or undefined if not found.
   */
  async findById(id: string): Promise<Snapshot | undefined> {
    return db.snapshots.get(id);
  }

  /**
   * Retrieves all snapshots, sorted by creation date (newest first).
   * @returns A promise that resolves to an array of snapshots.
   */
  async findAll(): Promise<Snapshot[]> {
    return db.snapshots.orderBy('createdAt').reverse().toArray();
  }

  /**
   * Finds all snapshots belonging to a specific category.
   * @param category - The category name to filter by.
   * @returns A promise that resolves to an array of matching snapshots.
   */
  async findByCategory(category: string): Promise<Snapshot[]> {
    return db.snapshots
      .where('categories')
      .equals(category)
      .reverse()
      .sortBy('createdAt');
  }

  /**
   * Performs a basic full-text search on snapshot titles and descriptions.
   * @param query - The search term.
   * @returns A promise that resolves to an array of matching snapshots.
   */
  async search(query: string): Promise<Snapshot[]> {
    const lowerQuery = query.toLowerCase();
    return db.snapshots
      .filter(s =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.content.text.toLowerCase().includes(lowerQuery) ||
        !!(s.metadata.description && s.metadata.description.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  }

  /**
   * Updates an existing snapshot.
   * @param id - The UUID of the snapshot to update.
   * @param updates - An object containing the fields to update.
   */
  async update(id: string, updates: Partial<Snapshot>): Promise<void> {
    await db.snapshots.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Deletes a snapshot and its associated annotations.
   * @param id - The UUID of the snapshot to delete.
   */
  async delete(id: string): Promise<void> {
    // Dexie transactions ensure atomicity.
    await db.transaction('rw', db.snapshots, db.annotations, async () => {
      // In a real implementation, we would also delete annotations associated with the snapshot.
      // For now, this is a placeholder for that logic.
      await db.annotations.where('snapshotId').equals(id).delete();
      await db.snapshots.delete(id);
    });
  }
}

// Export a singleton instance of the repository.
export const snapshotRepository = new SnapshotRepository();