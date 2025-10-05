import { describe, it, expect, vi, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { contentExtractor } from '../../src/services/snapshot/ContentExtractor';

// Mock the global fetch API
global.fetch = vi.fn();

// Mock FileReader
global.FileReader = vi.fn(() => ({
  readAsDataURL: vi.fn(function(this: any) { this.onloadend(); }),
  onloadend: vi.fn(),
  result: 'data:image/png;base64,mocked_base64_string',
})) as any;


describe('ContentExtractor', () => {
  let mockDocument: Document;

  beforeAll(() => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Test Page Title</title>
          <link rel="icon" href="https://example.com/favicon.ico">
        </head>
        <body>
          <header><h1>Ignore this</h1></header>
          <main>
            <article>
              <h1>Real Article Title</h1>
              <p>This is the first paragraph of the article.</p>
              <img src="https://example.com/image.png" alt="Test Image">
              <p>This is the second paragraph.</p>
            </article>
          </main>
        </body>
      </html>
    `;
    const dom = new JSDOM(html);
    mockDocument = dom.window.document;
  });

  it('should extract the main article content, title, and metadata correctly', async () => {
    // 1. Arrange
    const pageUrl = 'https://example.com/article';
    // Mock the fetch call for image localization
    (fetch as any).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob([''], { type: 'image/png' })),
    });


    // 2. Act
    const snapshotData = await contentExtractor.extract(mockDocument, pageUrl);

    // 3. Assert
    // Check title - Readability uses the document's <title> tag, which is expected.
    expect(snapshotData.title).toBe('Test Page Title');

    // Check URL
    expect(snapshotData.url).toBe(pageUrl);

    // Check metadata
    expect(snapshotData.metadata.language).toBe('en'); // jsdom default
    expect(snapshotData.metadata.favicon).toBe('https://example.com/favicon.ico');
    expect(snapshotData.metadata.wordCount).toBe(18);

    // Check content
    // It should have extracted the main article, not the header
    expect(snapshotData.content.text).toContain('This is the first paragraph');
    expect(snapshotData.content.text).not.toContain('Ignore this');

    // Check image localization
    expect(snapshotData.content.html).toContain('<h2>Real Article Title</h2>');
    expect(snapshotData.content.html).toContain('data:image/png;base64,mocked_base64_string');
    expect(snapshotData.content.html).not.toContain('https://example.com/image.png');
  });
});