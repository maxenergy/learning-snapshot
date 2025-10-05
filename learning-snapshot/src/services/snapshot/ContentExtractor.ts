import { Readability } from '@mozilla/readability';
import type { Snapshot } from '../../storage/models/Snapshot';

// A simplified interface for the result of Readability's parsing.
interface ReadabilityArticle {
  title: string;
  content: string; // This is the HTML string of the article
  textContent: string;
  length: number;
  excerpt?: string;
  byline?: string;
  dir?: string;
  siteName?: string;
  lang?: string;
}

class ContentExtractor {
  /**
   * Extracts the main content from a DOM document and formats it into a Snapshot object.
   * @param doc - The DOM `document` object of the page to be captured.
   * @param pageUrl - The original URL of the page.
   * @returns A promise that resolves to a partial Snapshot object, ready for storage.
   */
  public async extract(doc: Document, pageUrl: string): Promise<Omit<Snapshot, 'id' | 'createdAt' | 'updatedAt'>> {
    // Clone the document to avoid modifying the live page
    const documentClone = doc.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse() as ReadabilityArticle | null;

    if (!article) {
      throw new Error('Failed to extract article content using Readability.');
    }

    // TODO: Implement resource localization (e.g., converting image src to data URLs)
    // For now, we will use the content as-is.
    const localizedHtml = await this.localizeImages(article.content);

    const snapshot: Omit<Snapshot, 'id' | 'createdAt' | 'updatedAt'> = {
      title: article.title || doc.title,
      url: pageUrl,
      content: {
        html: localizedHtml,
        text: article.textContent,
        markdown: '', // Markdown conversion can be a future enhancement
      },
      metadata: {
        author: article.byline,
        publishDate: undefined, // Metadata extraction is complex and can be added later
        favicon: this.getFavicon(doc),
        description: article.excerpt,
        capturedAt: new Date().toISOString(),
        wordCount: article.textContent.split(/\s+/).length,
        language: article.lang || document.documentElement.lang,
      },
      annotations: [],
      categories: ['Uncategorized'], // Default category
      tags: [],
      rating: 0,
    };

    return snapshot;
  }

  /**
   * Finds and returns the URL of the page's favicon.
   * @param doc - The DOM `document` object.
   */
  private getFavicon(doc: Document): string | undefined {
    let favicon = doc.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href;
    if (favicon) return favicon;

    favicon = doc.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href;
    if (favicon) return favicon;

    return undefined; // Or a default icon path
  }

  /**
   * Converts image `src` attributes in an HTML string to data URLs.
   * NOTE: This is a simplified implementation. A robust version would need to handle
   * CORS, network errors, and different resource types.
   * @param html - The HTML content string.
   * @returns A promise that resolves to the HTML string with images inlined.
   */
  private async localizeImages(html: string): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = Array.from(doc.querySelectorAll('img'));

    for (const img of images) {
      const src = img.getAttribute('src');
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();
          const dataUrl = await this.blobToDataURL(blob);
          img.src = dataUrl;
        } catch (error) {
          console.warn(`Could not fetch and localize image: ${src}`, error);
          // Optionally remove the image or replace with a placeholder
          // img.src = 'path/to/placeholder.png';
        }
      }
    }
    return doc.body.innerHTML;
  }

  /**
   * Converts a Blob object to a data URL string.
   */
  private blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const contentExtractor = new ContentExtractor();