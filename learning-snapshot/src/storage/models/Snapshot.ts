export interface Annotation {
  id: string; // UUID
  type: 'highlight' | 'note';
  // Defines the selected text range. XPath is a more robust way to locate content.
  range: {
    start: number;
    end: number;
    xpath?: string;
  };
  content: string; // The text of the note or the highlighted content
  color?: string; // For highlights
  createdAt: string; // ISO 8601 date string
}

export interface Snapshot {
  id: string; // UUID
  title: string;
  url: string;
  content: {
    html: string;      // The sanitized and resource-localized HTML content
    text: string;      // Plain text version of the content for searching
    markdown?: string; // Optional Markdown version
  };
  metadata: {
    author?: string;
    publishDate?: string;
    favicon?: string;
    description?: string;
    capturedAt: string; // ISO 8601 date string
    wordCount: number;
    language: string;
  };
  annotations: Annotation[]; // Embedded list of annotations
  translations?: any[]; // Placeholder for translation cache
  categories: string[]; // List of category IDs or names
  tags?: string[]; // User-defined tags
  rating?: number; // 1-5 star rating
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}