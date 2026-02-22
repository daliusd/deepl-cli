import * as deepl from 'deepl-node';

export interface TranslateOptions {
  text: string;
  sourceLang: deepl.SourceLanguageCode | null;
  targetLang: deepl.TargetLanguageCode;
  context?: string;
  formality?: deepl.Formality;
}

export interface TranslateResult {
  text: string;
  detectedSourceLang: string;
  billedCharacters: number;
}

export function createClient(apiKey: string): deepl.DeepLClient {
  return new deepl.DeepLClient(apiKey, {
    appInfo: {
      appName: 'deepl-cli',
      appVersion: '0.1.0',
    },
  });
}

export async function translate(
  client: deepl.DeepLClient,
  options: TranslateOptions,
): Promise<TranslateResult> {
  const translateOptions: deepl.TranslateTextOptions = {};

  if (options.context) {
    translateOptions.context = options.context;
  }

  if (options.formality) {
    translateOptions.formality = options.formality;
  }

  const result = await client.translateText(
    options.text,
    options.sourceLang,
    options.targetLang,
    translateOptions,
  );

  const single = Array.isArray(result) ? result[0] : result;

  return {
    text: single.text,
    detectedSourceLang: single.detectedSourceLang,
    billedCharacters: single.billedCharacters,
  };
}
