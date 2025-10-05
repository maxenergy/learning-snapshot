import type { Table } from 'dexie';
import Dexie from 'dexie';
import type { Snapshot, Annotation } from './models/Snapshot';
import type { Category } from './models/Category';

// This interface is only used within the DB layer, so it can stay here.
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
      // Define the schema for Dexie. The '&' indicates a primary key.
      // The '*' indicates a multi-entry index for arrays.
      snapshots: '&id, title, url, *categories, createdAt, rating',
      categories: '&id, name, parentId',
      annotations: '&id, snapshotId, type, createdAt',
      translations: '[text+from+to], timestamp'
    });
  }
}

export const db = new SnapshotDatabase();