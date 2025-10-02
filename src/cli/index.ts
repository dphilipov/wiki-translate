import { wikiTranslate } from '../services/wiki/translateArticles';
import { getArticles } from '../services/wiki/getArticles';
import { createGlossary } from '../services/glossary/createGlossary';
import { logger } from '../lib/logger';

const cliArguments = process.argv.slice(2);

const commandsList: Record<string, (flags?: string[]) => Promise<void>> = {
  'wiki-translate': (flags) => wikiTranslate({ dryRun: flags?.includes('--dry-run') }),
  'get-articles': () => getArticles(),
  'create-glossary': () => createGlossary(),
};

if (cliArguments.length) {
  const command = cliArguments[0];
  const flags = cliArguments.slice(1);

  if (!Object.keys(commandsList).includes(command)) {
    logger.error(
      `ERROR: Invalid command! Use one of: ${Object.keys(commandsList).join(' | ')}`
    );
    process.exit();
  }

  commandsList[command](flags);
} else {
  logger.error(
    `ERROR: Please input a command: ${Object.keys(commandsList).join(' | ')}`
  );
}
