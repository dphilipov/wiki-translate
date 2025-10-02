import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { constants } from '../../src/lib/constants';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

interface FileInfo {
  baseName: string;
  original?: string;
  originalPath?: string;
  translated?: string;
  translatedPath?: string;
}

// GET /api/files - List all output files
router.get('/', async (req: Request, res: Response) => {
  try {
    const outputFolder = (req.query.outputFolder as string) || constants.OUTPUT_FOLDER;
    const outputPath = path.join(process.cwd(), outputFolder);

    try {
      const files = await fs.readdir(outputPath);

      const fileList = files.map(filename => {
        const isOriginal = filename.includes('[ORIGINAL]');
        const baseName = isOriginal
          ? filename.replace('[ORIGINAL].txt', '')
          : filename.replace('.txt', '');

        return {
          filename,
          baseName,
          isOriginal,
          path: path.join(outputFolder, filename)
        };
      });

      // Group files by baseName
      const grouped: Record<string, FileInfo> = {};
      fileList.forEach(file => {
        if (!grouped[file.baseName]) {
          grouped[file.baseName] = { baseName: file.baseName };
        }
        if (file.isOriginal) {
          grouped[file.baseName].original = file.filename;
          grouped[file.baseName].originalPath = file.path;
        } else {
          grouped[file.baseName].translated = file.filename;
          grouped[file.baseName].translatedPath = file.path;
        }
      });

      res.json({ files: Object.values(grouped) });
    } catch (error) {
      // Output folder doesn't exist
      res.json({ files: [] });
    }
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/files/:filename - Get file content
router.get('/content', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.query as { filePath?: string };

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fullPath = path.join(process.cwd(), filePath);
    const content = await fs.readFile(fullPath, 'utf8');

    res.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /api/files/download/:filename - Download file
router.get('/download', async (req: Request, res: Response) => {
  try {
    const { filePath } = req.query as { filePath?: string };

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fullPath = path.join(process.cwd(), filePath);
    const filename = path.basename(fullPath);

    res.download(fullPath, filename);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
