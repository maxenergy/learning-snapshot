import Dexie, { Table } from 'dexie';

// Define your data models here (will be fleshed out later)
// NOTE: These are placeholder interfaces. They will be defined in detail in `storage/models`.
export interface Snapshot {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  // ... other fields
}

export interface Category {
  id: string;
  name: string;
  // ... other fields
}

export interface Annotation {
  id: string;
  snapshotId: string;
  // ... other fields
}

export interface TranslationCache {
  id?: number;
  text: string;
  from: string;
  to: string;
  translated: string;
  timestamp: number;
}

class SnapshotDatabase extends Dexie {
  snapshots!: Table<Snapshot, string>;
  categories!: Table<Category, string>;
  annotations!: Table<Annotation, string>;
  translations!: Table<TranslationCache, '[text+from+to]'>;

  constructor() {
    super('LearningSnapshotDB');

    this.version(1).stores({
      snapshots: 'id, title, url, *categories, createdAt, rating',
      categories: 'id, name, parentId',
      annotations: 'id, snapshotId, type, createdAt',
      translations: '[text+from+to], timestamp'
    });
  }
}

export const db = new SnapshotDatabase();