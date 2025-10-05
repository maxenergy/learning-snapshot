import { describe, it, expect } from 'vitest';
import { obsidianFormatter } from '../../src/services/export/ObsidianFormatter';
import { Snapshot } from '../../src/storage/models/Snapshot';

describe('ObsidianFormatter', () => {
  it('should format a snapshot into a valid Markdown string with front matter', () => {
    // 1. Arrange: Create a mock snapshot object
    const mockSnapshot: Snapshot = {
      id: 'test-id',
      title: 'Test Snapshot Title',
      url: 'https://example.com',
      content: {
        html: '<h1>Main Heading</h1><p>This is a test paragraph.</p>',
        text: 'Main Heading This is a test paragraph.',
      },
      metadata: {
        author: 'John Doe',
        capturedAt: new Date('2025-10-04T10:00:00Z').toISOString(),
        wordCount: 6,
        language: 'en',
      },
      annotations: [],
      categories: ['Testing'],
      tags: ['mock', 'data'],
      rating: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Act: Format the snapshot
    const markdown = obsidianFormatter.formatSnapshot(mockSnapshot);

    // 3. Assert: Check if the output is correct
    // Check for front matter
    expect(markdown).toContain('---');
    expect(markdown).toContain('title: "Test Snapshot Title"');
    expect(markdown).toContain('url: "https://example.com"');
    expect(markdown).toContain('author: "John Doe"');
    expect(markdown).toContain('date: "2025-10-04"');
    expect(markdown).toContain('tags: ["mock", "data"]');
    expect(markdown).toContain('category: "Testing"');
    expect(markdown).toContain('rating: "5"');

    // Check for main content
    expect(markdown).toContain('# Test Snapshot Title');
    expect(markdown).toContain('> [!info] Original URL');
    expect(markdown).toContain('> [https://example.com](https://example.com)');

    // Check for Markdown conversion
    expect(markdown).toContain('# Main Heading');
    expect(markdown).toContain('This is a test paragraph.');
  });
});