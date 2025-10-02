# Wiki Translation Tool

A full-stack application for translating MediaWiki-based wikis using the DeepL API, with both web and command-line interfaces.

## Overview

The idea for this project was sparked by the desire to bring the [English Shadowrun Wiki](https://shadowrun.fandom.com/wiki/Main_Page) closer to the quantity & quality of the [German one](https://shadowiki.de/Hauptseite).

> **Note:** Although originally created for the German Shadowrun wiki, this tool works with any MediaWiki-based wiki through its standardized API.

### What it does:

1. Fetches article titles from any MediaWiki-based wiki
2. Retrieves article content in wikitext format
3. Translates content using the [DeepL API](https://www.deepl.com/docs-api)
4. Saves both original and translated content to local files

### Why DeepL?

DeepL provides [3x more accurate translations than their closest competitors](https://www.deepl.com/whydeepl/). From personal experience, their translations are superior to Google Translate, and their pricing is competitive with a generous free tier (500,000 characters/month).

## Features

- **Web Interface**: User-friendly UI with real-time progress tracking
- **CLI Interface**: Scriptable command-line tools for automation
- **TypeScript**: Full type safety across frontend, backend, and CLI
- **Real-time Updates**: Server-Sent Events (SSE) for live translation progress
- **Glossary Support**: Custom terminology management with DeepL glossaries
- **Smart Chunking**: Automatic splitting of large articles for API compliance
- **File Management**: Browse, compare, and download translations
- **Multiple Selection Modes**: Fetch all articles, select by range, or manually specify

## Installation

### Prerequisites
- Node.js (v18 or higher)
- Yarn package manager
- DeepL API key ([get a free account](https://www.deepl.com/pro-api))

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd wiki-translate
```

2. Install dependencies:
```bash
yarn install-all
```

3. Create a `.env` file in the root directory:
```bash
AUTH_KEY=your-deepl-api-key-here
```

## Usage

### Web Interface (Recommended)

Start the development server:
```bash
yarn dev
```

Then open your browser to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001

#### Web Interface Features:

- **Configuration Panel**
  - Set wiki URL with presets (Shadowhelix, Wikipedia, etc.)
  - Configure DeepL API key with validation
  - Select source and target languages
  - Adjust output settings and chunking threshold
  - Enable glossary support
  - Dry-run mode for testing

- **Article Selection**
  - Fetch all articles from any wiki
  - Search and filter articles
  - Select articles by range
  - Manually enter article titles
  - Bulk select/deselect

- **Translation Progress**
  - Real-time progress tracking
  - Live translation logs
  - Current article indicator
  - Success/error counts
  - Stop translation capability

- **Results Browser**
  - List all translated files
  - Side-by-side comparison view
  - Search translated files
  - Download individual files

- **Glossary Manager**
  - View glossary terms
  - Create/update DeepL glossaries
  - Sync with DeepL account

### Command Line Interface

For automated workflows and scripting:

```bash
# Translate articles
yarn start wiki-translate

# Dry run (fetch only, no translation)
yarn start wiki-translate --dry-run

# Fetch all article titles from wiki
yarn start get-articles

# Create/update DeepL glossary
yarn start create-glossary
```

## Configuration

Edit `src/lib/constants.ts` to configure default behavior:

### Key Settings:

**`ALLOW_FILE_OVERWRITE`**
If `false`, won't overwrite existing files when fetching the same content multiple times.

**`ARTICLE_TITLES`**
Array of specific article titles to translate. Example: `['.26k', 'Dunkelzahn', 'Toxischer Geist']`
Overrides `ARTICLE_TITLES_RANGE` when set.

**`ARTICLE_TITLES_RANGE`**
Range-based article selection controlled by `TRANSLATE_ARTICLE_START` and `TRANSLATE_ARTICLE_END`.
Only active when `ARTICLE_TITLES` is empty.

**`AUTH_KEY`**
Your DeepL API key (loaded from `.env` file).

**`GLOSSARY_ID`**
ID of the DeepL glossary to use. Create one with the `create-glossary` command.

**`OUTPUT_FOLDER`**
Folder for output files (default: `output`). Created automatically if it doesn't exist.

**`SPLIT_TRESHOLD`**
Maximum characters per translation request (default: 50,000).
Large articles are automatically split into chunks to comply with DeepL API limits.

**`TRANSLATE_FROM_LANGUAGE`**
Source language code (e.g., `DE` for German).

**`TRANSLATE_TO_LANGUAGE`**
Target language code (e.g., `EN-US` for American English).

**`WIKI_URL`**
Full URL to the wiki's API endpoint (must include `/api.php`).
Example: `https://shadowhelix.de/api.php`

**`TRANSLATE_ARTICLE_START`**
Starting article index for range-based selection.

**`TRANSLATE_ARTICLE_END`**
Ending article index (exclusive) or `'all'` to translate all articles.

## Project Structure

```
wiki-translate/
├── src/                    # Shared server-side code
│   ├── lib/                # Core utilities (constants, helpers, logger, utils)
│   ├── services/           # Business logic (glossary, wiki translation)
│   ├── types/              # Shared TypeScript types
│   └── cli/                # CLI entry point
├── server/                 # Express API backend
│   ├── routes/             # API endpoints (translation, wiki, glossary, files)
│   ├── index.ts            # Express app
│   └── types.ts            # API request types
├── client/                 # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/     # React components
│       ├── styles/         # SCSS stylesheets
│       └── types.ts        # Frontend types
├── input/                  # Cached article lists
├── output/                 # Translation output files
└── package.json            # Dependencies and scripts
```

## Development

### Available Scripts

```bash
yarn dev              # Start both server and client in development mode
yarn server           # Start only the Express API server
yarn client           # Start only the Vite dev server
yarn build            # Build client for production
yarn start            # Run CLI commands
yarn type-check       # TypeScript type checking
yarn install-all      # Install all dependencies (root + client)
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- SCSS for styling
- react-toastify for notifications

**Backend:**
- Express.js with TypeScript
- Server-Sent Events (SSE) for real-time updates
- tsx for TypeScript execution

**Shared:**
- Axios for HTTP requests
- DeepL Node.js SDK
- TypeScript strict mode

## Output Files

Translations are saved in the configured output folder (default: `output/`):

- **Original files:** `[PageTitle][ORIGINAL].txt`
- **Translated files:** `[PageTitle].txt`

Filenames are sanitized for cross-platform compatibility.

## API Endpoints

The Express server exposes the following REST API:

### Translation
- `POST /api/translation/start` - Start translation with SSE
- `POST /api/translation/stop/:sessionId` - Stop translation
- `POST /api/translation/validate-key` - Validate DeepL API key

### Wiki
- `POST /api/wiki/fetch-articles` - Fetch all articles
- `GET /api/wiki/articles` - Get cached article list

### Glossary
- `GET /api/glossary` - Get glossary terms
- `POST /api/glossary/create` - Create DeepL glossary

### Files
- `GET /api/files` - List output files
- `GET /api/files/content` - Get file content
- `GET /api/files/download` - Download file

## Tips & Best Practices

1. **Test with Dry Run:** Always use `--dry-run` first to verify article selection before translating.

2. **API Rate Limits:** The free DeepL tier has a 500,000 character/month limit. Large wikis may require a paid plan.

3. **Glossary First:** Create and test your glossary before translating to ensure consistent terminology.

4. **Chunk Size:** Adjust `SPLIT_TRESHOLD` if you encounter API errors with large articles.

5. **Avoid Wikipedia:** Don't try to fetch all articles from Wikipedia (6,600,000+ articles). Use specific article lists instead.

6. **File Overwrite:** Enable `ALLOW_FILE_OVERWRITE` with caution to avoid losing manual edits.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Acknowledgments

- [DeepL](https://www.deepl.com/) for their excellent translation API
- [MediaWiki](https://www.mediawiki.org/) for their comprehensive API
- [Shadowhelix](https://shadowhelix.de/) and [Shadowiki](https://shadowiki.de/) for inspiration
