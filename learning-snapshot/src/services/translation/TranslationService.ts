import { db } from '../../storage/database';
import type { TranslateParams, TranslationProvider, TranslationResult } from '../../types/translation';
import { OllamaProvider } from './OllamaProvider';
import { OpenAIProvider } from './OpenAIProvider'; // Import the new provider

class TranslationService {
  private providers: Map<string, TranslationProvider>;

  constructor() {
    this.providers = new Map();
    // Register all available providers
    this.registerProvider(new OllamaProvider());
    this.registerProvider(new OpenAIProvider());
  }

  /**
   * Registers a new translation provider.
   * @param provider - An instance of a class that implements TranslationProvider.
   */
  public registerProvider(provider: TranslationProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Translates a piece of text using the specified provider.
   * It first checks for a cached translation in IndexedDB before calling the API.
   * @param params - The parameters for the translation, including text, provider, and languages.
   * @returns A promise that resolves to a TranslationResult object.
   */
  async translate(params: TranslateParams): Promise<TranslationResult> {
    const { text, provider: providerName, from, to } = params;

    // 1. Check the cache first
    const cached = await this.getCachedTranslation(text, from, to, providerName);
    if (cached) {
      return cached;
    }

    // 2. If not in cache, call the provider
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Translation provider "${providerName}" is not registered.`);
    }

    const translatedText = await provider.translate(text, from, to);

    const result: TranslationResult = {
      original: text,
      translated: translatedText,
      from,
      to,
      provider: providerName,
      timestamp: Date.now(),
    };

    // 3. Store the new translation in the cache
    await this.cacheTranslation(result);

    return result;
  }

  /**
   * Retrieves a translation from the IndexedDB cache.
   */
  private async getCachedTranslation(
    text: string,
    from: string,
    to: string,
    provider: string
  ): Promise<TranslationResult | undefined> {
    const result = await db.translations.get({ text, from, to });
    if (result) {
      // Reconstruct the object to match the TranslationResult interface
      return {
        original: result.text,
        translated: result.translated,
        from: result.from,
        to: result.to,
        timestamp: result.timestamp,
        provider,
      };
    }
    return undefined;
  }

  /**
   * Saves a translation result to the IndexedDB cache.
   */
  private async cacheTranslation(result: TranslationResult): Promise<void> {
    await db.translations.put({
      text: result.original,
      from: result.from,
      to: result.to,
      translated: result.translated,
      timestamp: result.timestamp,
    });
  }

  /**
   * Splits a larger text into paragraphs for batch translation.
   * @param text - The full text to be split.
   * @returns An array of non-empty paragraphs.
   */
  public splitIntoParagraphs(text: string): string[] {
    return text.split(/\n+/).filter(p => p.trim().length > 0);
  }

  /**
   * Translates an array of paragraphs in parallel.
   * @param paragraphs - The array of text paragraphs to translate.
   * @param params - The translation parameters (provider, from, to).
   * @returns A promise that resolves to an array of translation results.
   */
  async batchTranslate(
    paragraphs: string[],
    params: Omit<TranslateParams, 'text'>
  ): Promise<TranslationResult[]> {
    console.log(`Batch translating ${paragraphs.length} paragraphs using ${params.provider}`);

    // Create an array of promises, each one translating a single paragraph.
    const translationPromises = paragraphs.map(p =>
      this.translate({ ...params, text: p })
    );

    // Wait for all translations to complete.
    // Promise.all will execute them in parallel.
    const results = await Promise.all(translationPromises);

    console.log('Batch translation completed.');
    return results;
  }
}

// Export a singleton instance of the service.
export const translationService = new TranslationService();