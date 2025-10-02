import * as deepl from 'deepl-node';
import { constants } from '../constants.js';
import { glossary } from './glossary.js';

export async function createGlossary() {
  if (!constants.AUTH_KEY) {
    throw new Error(
      'AUTH_KEY is missing. Please add your DeepL API key to the .env file.'
    );
  }

  const translator = new deepl.DeepLClient(constants.AUTH_KEY);
  const entries = new deepl.GlossaryEntries({
    entries: glossary,
  });

  const glossaryDEtoEN = await translator.createGlossary(
    'Shadowrun',
    'de',
    'en',
    entries
  );

  console.log(glossaryDEtoEN.glossaryId);
}
