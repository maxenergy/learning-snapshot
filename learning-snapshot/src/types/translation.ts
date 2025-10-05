export interface TranslationProvider {
  /**
   * The unique identifier for this provider (e.g., 'ollama', 'deepl').
   */
  readonly name: string;

  /**
   * Translates a given text.
   * @param text - The text to translate.
   * @param from - The source language code (e.g., 'en').
   * @param to - The target language code (e.g., 'es').
   * @returns The translated text.
   */
  translate(text: string, from: string, to: string): Promise<string>;

  /**
   * Optional: Checks if the provider is configured and reachable.
   */
  checkConnection?(): Promise<boolean>;
}

export interface TranslationResult {
  original: string;
  translated: string;
  from: string;
  to: string;
  provider: string;
  timestamp: number;
}

export interface TranslateParams {
  text: string;
  provider: string;
  from: string;
  to: string;
}