import * as deepl from 'deepl-node';
import { constants } from '../constants.js';
import { glossary } from './glossary.js';
import { validateConfig } from '../utils.js';
import { logger } from '../logger.js';

export async function createGlossary() {
  validateConfig();

  const translator = new deepl.DeepLClient(constants.AUTH_KEY!);
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
}
