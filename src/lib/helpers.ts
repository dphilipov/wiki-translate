import * as deepl from 'deepl-node';
import { constants } from './constants';

interface CallDeepLAPIParams {
  text: string;
  authKey: string;
  sourceLang: string;
  targetLang: string;
  useGlossary: boolean;
  glossaryId?: string;
}

export async function callDeepLAPI({
  text,
  authKey,
  sourceLang,
  targetLang,
  useGlossary,
  glossaryId
}: CallDeepLAPIParams): Promise<string> {
  const translator = new deepl.DeepLClient(authKey);

  const options: deepl.TranslateTextOptions = {};

  if (useGlossary) {
    // Use provided glossaryId or fall back to constants
    options.glossary = glossaryId || constants.GLOSSARY_ID;
  }

  const result = await translator.translateText(
    text,
    sourceLang as deepl.SourceLanguageCode,
    targetLang as deepl.TargetLanguageCode,
    options
  );

  return Array.isArray(result) ? result[0].text : result.text;
}
