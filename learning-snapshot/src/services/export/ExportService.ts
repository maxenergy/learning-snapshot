import type { Snapshot } from '../../storage/models/Snapshot';
import { obsidianFormatter } from './ObsidianFormatter';

class ExportService {
  /**
   * Exports a single snapshot to a Markdown file, triggering a download.
   * @param snapshot - The snapshot object to export.
   */
  public async exportSnapshotToMarkdown(snapshot: Snapshot): Promise<void> {
    // 1. Format the snapshot into a Markdown string.
    const markdownContent = obsidianFormatter.formatSnapshot(snapshot);

    // 2. Create a Blob from the Markdown content.
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });

    // 3. Create a download URL for the Blob.
    const url = URL.createObjectURL(blob);

    // 4. Use the chrome.downloads API to trigger the download.
    // This provides a better user experience than creating a link and clicking it.
    chrome.downloads.download({
      url: url,
      filename: this.generateFilename(snapshot),
      saveAs: true, // Prompt the user to choose a location.
    }, () => {
      // 5. Revoke the object URL after the download has started to free up memory.
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Generates a clean filename for the snapshot.
   * e.g., "2025-10-04_my-awesome-article-title.md"
   */
  private generateFilename(snapshot: Snapshot): string {
    const date = snapshot.metadata.capturedAt.split('T')[0];
    const titleSlug = snapshot.title
      .toLowerCase()
      // Remove invalid filename characters
      .replace(/[\/\\?%*:|"<>]/g, '')
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .slice(0, 50); // Truncate to a reasonable length

    return `${date}_${titleSlug}.md`;
  }
}

export const exportService = new ExportService();