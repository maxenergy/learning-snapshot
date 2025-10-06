import { snapshotRepository } from '../../storage/repositories/SnapshotRepository';
import type { Snapshot } from '../../storage/models/Snapshot';

/**
 * SnapshotService handles the business logic for creating and managing snapshots.
 * It coordinates the content extraction and the data storage (repository).
 */
class SnapshotService {
  /**
   * Creates a new snapshot from already extracted data and saves it to the database.
   * This method is designed to be called from the background script after the content
   * script has done the extraction.
   * @param extractedData - The data extracted by the ContentExtractor.
   * @returns The newly created snapshot.
   */
  async createSnapshot(extractedData: Omit<Snapshot, 'id' | 'createdAt' | 'updatedAt'>): Promise<Snapshot> {
    console.log('Service: creating snapshot for:', extractedData.title);

    // Save the extracted data to the database via the repository.
    const newSnapshot = await snapshotRepository.create(extractedData);
    console.log('Service: Snapshot saved with ID:', newSnapshot.id);

    return newSnapshot;
  }

  /**
   * Retrieves a single snapshot by its ID.
   * @param id - The UUID of the snapshot.
   * @returns The snapshot object or undefined if not found.
   */
  async getSnapshot(id: string): Promise<Snapshot | undefined> {
    return snapshotRepository.findById(id);
  }

  /**
   * Retrieves all snapshots, sorted by creation date.
   * @returns An array of all snapshot objects.
   */
  async getAllSnapshots(): Promise<Snapshot[]> {
    return snapshotRepository.findAll();
  }

  /**
   * Deletes a snapshot from the database.
   * @param id - The UUID of the snapshot to delete.
   */
  async deleteSnapshot(id: string): Promise<void> {
    await snapshotRepository.delete(id);
    console.log('Snapshot deleted with ID:', id);
  }

  /**
   * Searches for snapshots based on a query string.
   * @param query - The search term.
   * @returns An array of snapshots matching the query.
   */
  async searchSnapshots(query: string): Promise<Snapshot[]> {
    return snapshotRepository.search(query);
  }
}

// Export a singleton instance of the service to be used across the application.
export const snapshotService = new SnapshotService();