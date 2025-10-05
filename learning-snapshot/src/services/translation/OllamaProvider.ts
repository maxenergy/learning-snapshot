import type { TranslationProvider } from '../../types/translation';

// Default configuration for the Ollama provider.
// Users will be able to override this in the settings.
const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3'; // A good default model for translation tasks
const OLLAMA_TRANSLATION_PROMPT = (text: string, from: string, to: string) => `
You are an expert translator. Translate the following text from ${from} to ${to}.
Do not add any commentary, preamble, or explanation. Only provide the raw translated text.

Original Text:
---
${text}
---

Translated Text:
`;


export class OllamaProvider implements TranslationProvider {
  public readonly name = 'ollama';
  private baseURL: string;

  constructor(baseURL: string = OLLAMA_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Translates text using a local Ollama model.
   */
  async translate(text: string, from: string, to: string): Promise<string> {
    if (!text.trim()) {
      return '';
    }

    try {
      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: OLLAMA_TRANSLATION_PROMPT(text, from, to),
          stream: false,
          options: {
            temperature: 0.2, // Lower temperature for more deterministic output
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Ollama API request failed with status ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Failed to communicate with Ollama service:', error);
      throw new Error(
        'Could not connect to the Ollama service. Please ensure it is running and accessible.'
      );
    }
  }

  /**
   * Checks if the Ollama service is running and accessible.
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}