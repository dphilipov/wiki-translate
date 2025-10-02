import express, { Request, Response } from 'express';
import { getArticles } from '../../src/services/wiki/getArticles';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractWikiName } from '../../src/lib/utils';
import type { FetchArticlesRequest } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GET /api/wiki/articles - Fetch all articles from wiki
router.post('/fetch-articles', async (req: FetchArticlesRequest, res: Response) => {
  try {
    const { wikiUrl } = req.body;

    if (!wikiUrl) {
      return res.status(400).json({ error: 'Wiki URL is required' });
    }

    // Call getArticles with custom wiki URL
    await getArticles(wikiUrl);

    // Read the generated articles.json file
    const articlesPath = path.join(__dirname, '../../input/articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData) as string[];

    res.json({ articles, count: articles.length });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/wiki/articles - Get cached articles list
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const wikiUrl = (req.query.wikiUrl as string) || 'https://www.shadowhelix.de/api.php';
    const wikiName = extractWikiName(wikiUrl);
    const articlesPath = path.join(__dirname, '../../input', `${wikiName}-articles.json`);

    try {
      const articlesData = await fs.readFile(articlesPath, 'utf8');
      const articlesJson = JSON.parse(articlesData) as Array<{ title: string }>;
      const articles = articlesJson.map(article => article.title);
      res.json({ articles, count: articles.length });
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
