import * as deepl from 'deepl-node';
import { constants } from '../../lib/constants';
import { glossary } from './glossary';
import { validateConfig } from '../../lib/utils';
import { logger } from '../../lib/logger';

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
