import express, { Request, Response } from 'express';
import { createGlossary } from '../../src/services/glossary/createGlossary';
import type { CreateGlossaryRequest } from '../types';

const router = express.Router();

// GET /api/glossary - Get glossary terms
router.get('/', async (_req: Request, res: Response) => {
  // Dynamically import with cache-busting to get latest glossary
  const glossaryModule = await import(`../../src/services/glossary/glossary?update=${Date.now()}`);
  const glossary = glossaryModule.glossary;

  // Convert glossary object to array format for frontend
  const terms = Object.entries(glossary).map(([source, target]) => ({
    source,
    target
  }));
  res.json({ terms });
});

// POST /api/glossary/create - Create DeepL glossary
router.post('/create', async (req: CreateGlossaryRequest, res: Response) => {
  const { authKey } = req.body;

  if (!authKey) {
    return res.status(400).json({ error: 'DeepL API key is required' });
  }

  try {
    const result = await createGlossary(authKey);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error creating glossary:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
