# A wiki translation tool

#### Intro

The idea for this project was sparked by the desire to bring the [English Shadowrun Wiki](https://shadowrun.fandom.com/wiki/Main_Page) at least a bit closer to the quantity & quality of the [German one](https://shadowiki.de/Hauptseite).

> Note: although I want to translate the German Shadowrun wiki, this tool should work for translating any wiki, as they all use the same API. Read below how you can control this.

What this tool does is:

1. Takes the titles of all articles from a target wiki
2. Uses those titles (or custom ones) to get the content of said articles (in wikitext)
3. Translates the content via the [DeepL API](https://www.deepl.com/docs-api)
4. Saves both the original content & the translated one to files

#### Why DeepL

According to them, they provide [3x more accurate translations than their closest competitors](https://www.deepl.com/whydeepl/). From my personal experience, this is true - their translations are usually better compared to Google Translate.

Their pricing plan is comparable to other similar translation tools (at the time of writing) and they have a free plan that gives you 500 000 free characters per month.

#### Usage

> You need to have Node.js installed.

This tool can be used in two ways: via a **Web Interface** or via the **Command Line**.

##### Web Interface (Recommended)

The web interface provides a user-friendly way to configure and run translations:

1. Clone/download the repo
2. Install dependencies: `npm run install-all`
3. Start the app: `npm run dev`
4. Open your browser to `http://localhost:3000`

The web interface includes:
- **Configuration Panel**: Set wiki URL, DeepL API key, languages, and options
- **Article Selection**: Fetch articles from wiki, search/filter, or manually enter titles
- **Translation Progress**: Real-time progress tracking with live logs
- **Results Browser**: View and download translated files with side-by-side comparison
- **Glossary Manager**: View terms and create/update DeepL glossaries

##### Command Line Interface

For automated workflows or scripting:

1. Register for a free DeepL account and add your API key to `.env` file
2. Clone/download the repo
3. Install dependencies via `yarn install`
4. Run `node index.ts [option]`

Available options:

1. `create-glossary`: Create a glossary attached to your DeepL account. The glossary content is defined in the [glossary.ts](glossary/glossary.ts) file. Read more [here](https://www.deepl.com/docs-api/glossaries/)
2. `get-articles`: Gets ALL article titles for the target wiki and saves them as a .json file. **DO NOT try to get all articles from Wikipedia, as it has 6 600 000+ articles.**
3. `wiki-translate`: Does the actual saving & translating. Behavior can be modified from the [constants.ts](./constants.ts) file.
   - Add `--dry-run` flag to skip translation and only save original content: `node index.ts wiki-translate --dry-run`

#### constants.ts

`ALLOW_FILE_OVERWRITE:` If false, it will not overwrite a file that already exists when you fetch the same content more than once

`ARTICLE_TITLES:` A list of all the article titles you want to get the content of. For example: ['.26k', 'Dunkelzahn', 'Toxischer Geist']. Overrides ARTICLE_TITLES_RANGE

`ARTICLE_TITLES_RANGE:` A range of articles to translate based on article index. Has no effect if a list of titles is added to ARTICLE_TITLES. Control this via `TRANSLATE_ARTICLE_START` and `TRANSLATE_ARTICLE_END`

`AUTH_KEY:` Your DeepL API key

`GLOSSARY_ID:` Id of the glossary to use. Running the `create-glossary` option outputs the ID. You have to create your own.

`OUTPUT_FOLDER:` Folder for the output. Files will be saved here. If the folder doesn't exist, it will be created by the script

`SPLIT_TRESHOLD:` Max characters per translation request. Split large articles into chunks to stay within DeepL API limits (default: 50,000)

`TRANSLATE_FROM_LANGUAGE:` Translate from this language

`TRANSLATE_TO_LANGUAGE:` Translate to this language

`WIKI_URL:` Url of the wiki you wish to translate. Make sure to include the /api.php part

`TRANSLATE_ARTICLE_START:` Start translating from this article index

`TRANSLATE_ARTICLE_END:` End translating at this index (not including). Can be 'all' to fetch all articles.
