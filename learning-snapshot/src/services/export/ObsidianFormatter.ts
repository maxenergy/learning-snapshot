import TurndownService from 'turndown';
import type { Snapshot } from '../../storage/models/Snapshot';

class ObsidianFormatter {
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx', // Use '#' for headings
      codeBlockStyle: 'fenced', // Use ``` for code blocks
      bulletListMarker: '-',
    });

    // Add a rule for syntax-highlighted code blocks if needed in the future
    // this.turndownService.addRule(...)
  }

  /**
   * Formats a snapshot into a complete Markdown string with front matter.
   * @param snapshot - The snapshot to format.
   * @returns A string containing the formatted Markdown.
   */
  public formatSnapshot(snapshot: Snapshot): string {
    const frontMatter = this.generateFrontMatter(snapshot);
    const markdownContent = this.turndownService.turndown(snapshot.content.html);

    // Combine all parts into the final document
    const fullContent = `
${frontMatter}

# ${snapshot.title}

> [!info] Original URL
> [${snapshot.url}](${snapshot.url})

---

${markdownContent}
`;
    return fullContent.trim();
  }

  /**
   * Generates the YAML front matter block for the Markdown file.
   */
  private generateFrontMatter(snapshot: Snapshot): string {
    const data = {
      title: snapshot.title,
      url: snapshot.url,
      author: snapshot.metadata.author || '',
      date: snapshot.metadata.capturedAt.split('T')[0], // Use YYYY-MM-DD format
      tags: snapshot.tags || [],
      category: snapshot.categories[0] || 'Uncategorized', // Use the first category
      rating: snapshot.rating || 0,
    };

    // Convert the object to a YAML string
    const yamlLines = Object.entries(data).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
      }
      return `${key}: "${String(value).replace(/"/g, '\\"')}"`; // Escape double quotes
    });

    return `---
${yamlLines.join('\n')}
---`;
  }
}

export const obsidianFormatter = new ObsidianFormatter();