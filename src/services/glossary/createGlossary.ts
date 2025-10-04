import * as deepl from 'deepl-node';
import { constants } from '../../lib/constants';
import { glossary } from './glossary';
import { logger } from '../../lib/logger';

export async function createGlossary(authKey?: string) {
  const apiKey = authKey || constants.AUTH_KEY;

  if (!apiKey) {
    throw new Error('DeepL API key is required');
  }

  const translator = new deepl.DeepLClient(apiKey);
  const entries = new deepl.GlossaryEntries({
    entries: glossary,
  });

  const glossaryDEtoEN = await translator.createGlossary(
    'Shadowrun',
    'de',
    'en',
    entries
  );

  logger.info(glossaryDEtoEN.glossaryId);
  return glossaryDEtoEN;
}
