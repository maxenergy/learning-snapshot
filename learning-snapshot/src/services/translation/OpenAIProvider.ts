import type { TranslationProvider } from '../../types/translation';

// Defines the structure of the OpenAI API key setting
interface Settings {
  openaiApiKey?: string;
}

export class OpenAIProvider implements TranslationProvider {
  public readonly name = 'openai';
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  /**
   * Translates text using the OpenAI Chat Completions API.
   * @param text - The text to translate.
   * @param from - The source language (e.g., 'English').
   * @param to - The target language (e.g., 'Chinese').
   * @returns The translated text.
   */
  async translate(text: string, from: string, to: string): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not set. Please set it in the options page.');
    }

    const prompt = `You are a professional translator. Translate the following text from ${from} to ${to}. Do not add any extra commentary, notes, or explanations. Only provide the translated text.`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Or another suitable model like 'gpt-3.5-turbo'
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text },
          ],
          temperature: 0.3, // Lower temperature for more deterministic translations
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const translatedText = data.choices[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('Failed to get a valid translation from OpenAI API.');
      }

      return translatedText;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }

  /**
   * Checks if the OpenAI API key is valid by making a simple API call.
   * @returns A boolean indicating if the connection is successful.
   */
  async checkConnection(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    if (!apiKey) return false;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('OpenAI connection check failed:', error);
      return false;
    }
  }

  /**
   * Retrieves the OpenAI API key from Chrome's local storage.
   */
  private async getApiKey(): Promise<string | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['openaiApiKey'], (result: Settings) => {
        resolve(result.openaiApiKey);
      });
    });
  }
}