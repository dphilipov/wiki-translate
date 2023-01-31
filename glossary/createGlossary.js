import * as deepl from 'deepl-node';
import { constants } from '../constants.js';
import { glossary } from './glossary.js';

(async () => {
  const translator = new deepl.Translator(constants.AUTH_KEY);
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
})();
