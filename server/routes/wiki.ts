import express, { Request, Response } from 'express';
import { getArticles } from '../../src/services/wiki/getArticles';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractWikiName, sanitizePageTitle } from '../../src/lib/utils';
import type { FetchArticlesRequest } from '../types';
import { constants } from '../../src/lib/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST /api/wiki/fetch-articles - Fetch all articles from wiki
router.post('/fetch-articles', async (req: FetchArticlesRequest, res: Response) => {
  try {
    const { wikiUrl, outputFolder } = req.body;

    if (!wikiUrl) {
      return res.status(400).json({ error: 'Wiki URL is required' });
    }

    // Call getArticles with custom wiki URL
    await getArticles(wikiUrl);

    const wikiName = extractWikiName(wikiUrl);
    const articlesPath = path.join(__dirname, '../../input', `${wikiName}-articles.json`);
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articlesJson = JSON.parse(articlesData) as Array<{ title: string }>;
    const articleTitles = articlesJson.map(article => article.title);

    // Check which articles have been translated
    const outputPath = path.join(process.cwd(), outputFolder || constants.OUTPUT_FOLDER);
    let existingFiles: string[] = [];

    try {
      existingFiles = await fs.readdir(outputPath);
    } catch (error) {
      // Output folder doesn't exist yet, no translations available
      existingFiles = [];
    }

    // Create a map of sanitized titles to their translation status
    const articlesWithStatus = articleTitles.map(title => {
      const sanitizedTitle = sanitizePageTitle(title);
      const translatedFileName = `${sanitizedTitle}.txt`;
      const isTranslated = existingFiles.includes(translatedFileName);

      return {
        title,
        isTranslated
      };
    });

    res.json({ articles: articlesWithStatus, count: articlesWithStatus.length });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/wiki/articles - Get cached articles list with translation status
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const wikiUrl = (req.query.wikiUrl as string) || 'https://www.shadowhelix.de/api.php';
    const outputFolder = (req.query.outputFolder as string) || constants.OUTPUT_FOLDER;
    const wikiName = extractWikiName(wikiUrl);
    const articlesPath = path.join(__dirname, '../../input', `${wikiName}-articles.json`);

    try {
      const articlesData = await fs.readFile(articlesPath, 'utf8');
      const articlesJson = JSON.parse(articlesData) as Array<{ title: string }>;
      const articleTitles = articlesJson.map(article => article.title);

      // Check which articles have been translated
      const outputPath = path.join(process.cwd(), outputFolder);
      let existingFiles: string[] = [];

      try {
        existingFiles = await fs.readdir(outputPath);
      } catch (error) {
        // Output folder doesn't exist yet, no translations available
        existingFiles = [];
      }

      // Create a map of sanitized titles to their translation status
      const articlesWithStatus = articleTitles.map(title => {
        const sanitizedTitle = sanitizePageTitle(title);
        const translatedFileName = `${sanitizedTitle}.txt`;
        const isTranslated = existingFiles.includes(translatedFileName);

        return {
          title,
          isTranslated
        };
      });

      res.json({ articles: articlesWithStatus, count: articlesWithStatus.length });
    } catch (error) {
      // File doesn't exist or can't be read
      res.json({ articles: [], count: 0 });
    }
  } catch (error) {
    console.error('Error reading articles:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
