export interface Category {
  id: string;      // UUID
  name: string;    // Name of the category (e.g., "Web Development")
  parentId?: string; // For creating hierarchical categories
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}