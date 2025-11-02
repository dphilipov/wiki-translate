import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';
import axios from 'axios';
import * as deepl from 'deepl-node';
import { callDeepLAPI } from '../../src/lib/helpers';
import { constants } from '../../src/lib/constants';
import { fileExists, sanitizePageTitle } from '../../src/lib/utils';
import fs from 'fs/promises';
import path from 'path';
import type { TranslationStartRequest, ValidateKeyRequest } from '../types';

const router = express.Router();

interface SessionInfo {
  emitter: EventEmitter;
  active: boolean;
}

// Store active translation sessions
const activeSessions = new Map<string, SessionInfo>();

// POST /api/translation/start - Start translation process
router.post('/start', async (req: TranslationStartRequest, res: Response) => {
  const {
    articles,
    authKey,
    sourceLang,
    targetLang,
    wikiUrl,
    dryRun,
    allowOverwrite,
    outputFolder,
    chunkThreshold,
    useGlossary,
  } = req.body;

  if (!articles || articles.length === 0) {
    return res.status(400).json({ error: 'No articles provided' });
  }

  if (!dryRun && !authKey) {
    return res
      .status(400)
      .json({ error: 'DeepL API key is required for translation' });
  }

  if (!wikiUrl) {
    return res.status(400).json({ error: 'Wiki URL is required' });
  }

  const sessionId = Date.now().toString();
  const emitter = new EventEmitter();

  activeSessions.set(sessionId, { emitter, active: true });

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Send session ID
  res.write(`data: ${JSON.stringify({ type: 'session', sessionId })}\n\n`);

  // Listen to events and stream to client
  emitter.on('progress', data => {
    res.write(`data: ${JSON.stringify({ type: 'progress', ...data })}\n\n`);
  });

  emitter.on('complete', data => {
    res.write(`data: ${JSON.stringify({ type: 'complete', ...data })}\n\n`);
    res.end();
    activeSessions.delete(sessionId);
  });

  emitter.on('error', data => {
    res.write(`data: ${JSON.stringify({ type: 'error', ...data })}\n\n`);
  });

  // Start translation process
  translateArticles({
    articles,
    authKey,
    sourceLang: sourceLang,
    targetLang: targetLang,
    wikiUrl,
    dryRun: dryRun || false,
    allowOverwrite:
      allowOverwrite !== undefined
        ? allowOverwrite
        : constants.ALLOW_FILE_OVERWRITE,
    outputFolder: outputFolder || constants.OUTPUT_FOLDER,
    chunkThreshold: chunkThreshold || constants.SPLIT_TRESHOLD,
    useGlossary: useGlossary || false,
    emitter,
    sessionId,
  });
});

// POST /api/translation/stop - Stop translation process
router.post('/stop/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (session) {
    session.active = false;
    activeSessions.delete(sessionId);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Translation logic
async function translateArticles(config) {
  const {
    articles,
    authKey,
    sourceLang,
    targetLang,
    wikiUrl,
    dryRun,
    allowOverwrite,
    outputFolder,
    chunkThreshold,
    useGlossary,
    emitter,
    sessionId,
  } = config;

  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (let i = 0; i < articles.length; i++) {
    const session = activeSessions.get(sessionId);
    if (!session || !session.active) {
      emitter.emit('complete', {
        successCount,
        errorCount,
        results,
        stopped: true,
      });
      return;
    }

    const articleTitle = articles[i];

    try {
      emitter.emit('progress', {
        current: i + 1,
        total: articles.length,
        articleTitle,
        status: 'fetching',
      });

      // Fetch article content
      const response = await axios.get(wikiUrl, {
        params: {
          action: 'parse',
          page: articleTitle,
          prop: 'wikitext',
          formatversion: 2,
          format: 'json',
          redirects: 1,
        },
      });

      const json = response.data;

      if (json.error) {
        throw new Error(json.error.info || 'Unknown API error');
      }

      const pageTitle = json.parse?.title;
      const content = json.parse?.wikitext;

      if (!content) {
        throw new Error('No content found');
      }

      const sanitizedFilename = sanitizePageTitle(pageTitle);
      const originalFilePath = path.join(
        outputFolder,
        `${sanitizedFilename}[ORIGINAL].txt`
      );
      const translatedFilePath = path.join(
        outputFolder,
        `${sanitizedFilename}.txt`
      );

      // Check if files exist
      const originalExists = await fileExists(originalFilePath);
      const translatedExists = await fileExists(translatedFilePath);

      if (!allowOverwrite && (originalExists || translatedExists)) {
        emitter.emit('progress', {
          current: i + 1,
          total: articles.length,
          articleTitle,
          status: 'skipped',
          message: 'File already exists',
        });
        results.push({
          title: articleTitle,
          status: 'skipped',
          reason: 'File already exists',
        });
        continue;
      }

      // Save original content
      await fs.mkdir(outputFolder, { recursive: true });
      await fs.writeFile(originalFilePath, content, 'utf8');

      if (dryRun) {
        emitter.emit('progress', {
          current: i + 1,
          total: articles.length,
          articleTitle,
          status: 'success',
          message: 'Saved original (dry-run)',
        });
        successCount++;
        results.push({ title: articleTitle, status: 'success', dryRun: true });
        continue;
      }

      // Translate content
      emitter.emit('progress', {
        current: i + 1,
        total: articles.length,
        articleTitle,
        status: 'translating',
      });

      let translatedContent;

      if (content.length > chunkThreshold) {
        // Split into chunks
        const chunks = [];
        for (let j = 0; j < content.length; j += chunkThreshold) {
          chunks.push(content.slice(j, j + chunkThreshold));
        }

        const translatedChunks = [];
        for (const chunk of chunks) {
          const translated = await callDeepLAPI({
            text: chunk,
            authKey,
            sourceLang,
            targetLang,
            useGlossary,
          });
          translatedChunks.push(translated);
        }
        translatedContent = translatedChunks.join('');
      } else {
        translatedContent = await callDeepLAPI({
          text: content,
          authKey,
          sourceLang,
          targetLang,
          useGlossary,
        });
      }

      // Save translated content
      await fs.writeFile(translatedFilePath, translatedContent, 'utf8');

      emitter.emit('progress', {
        current: i + 1,
        total: articles.length,
        articleTitle,
        status: 'success',
      });

      successCount++;
      results.push({ title: articleTitle, status: 'success' });
    } catch (error) {
      errorCount++;
      const errorMessage = (error as Error).message;
      emitter.emit('error', {
        articleTitle,
        error: errorMessage,
      });
      emitter.emit('progress', {
        current: i + 1,
        total: articles.length,
        articleTitle,
        status: 'error',
        message: errorMessage,
      });
      results.push({
        title: articleTitle,
        status: 'error',
        error: errorMessage,
      });
    }
  }

  emitter.emit('complete', {
    successCount,
    errorCount,
    results,
  });
}

// POST /api/translation/validate-key - Validate DeepL API key
router.post('/validate-key', async (req: ValidateKeyRequest, res: Response) => {
  const { authKey } = req.body;

  if (!authKey) {
    return res.status(400).json({ valid: false, error: 'API key is required' });
  }

  try {
    // Test the API key with a small translation
    await callDeepLAPI({
      text: 'Test',
      authKey,
      sourceLang: 'DE',
      targetLang: 'EN-US',
      useGlossary: false,
    });

    res.json({ valid: true });
  } catch (error) {
    res.json({ valid: false, error: (error as Error).message });
  }
});

// POST /api/translation/usage - Get DeepL usage stats
router.post('/usage', async (req: Request, res: Response) => {
  const { authKey } = req.body;

  if (!authKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const translator = new deepl.DeepLClient(authKey);
    const usage = await translator.getUsage();

    res.json({
      count: usage.character?.count || 0,
      limit: usage.character?.limit || 0,
      remaining: (usage.character?.limit || 0) - (usage.character?.count || 0),
      percentage: usage.character
        ? ((usage.character.count / usage.character.limit) * 100).toFixed(2)
        : '0',
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
