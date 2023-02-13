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

To use this tool:

1. Clone/download the repo
2. Install dependencies via `yarn install`
3. Run `node index.js [option]`

Available options are:

1. `create-glossary`: This is optional and is used to create a glossary, which is attached to your DeepL account. The glossary content is defined in the [glossary.js](glossary/glossary.js) file. You can't edit a glossary. Instead you have to make a new one. Read more [here](https://www.deepl.com/docs-api/glossaries/)
2. `get-articles`: Gets ALL article titles for the target wiki and saves them as a .json file. These titles are then used to get the content of each respective article. **DO NOT try to get all articles from Wikipedia, as it has 6 600 000+ articles and this will require 13 200 requests.** In the case of the German Shadowrun wiki, I already saved them under [articles.json](input/articles.json).
3. `wiki-translate`: The main option that you will use - does the actual saving & translating. The behavior can be modified from the [constants.js](./constants.js) file.

#### constants.js

`ALLOW_FILE_OVERWRITE:` If false, it will not overwrite a file that already exists when you fetch the same content more than once

`ARTICLE_TITLES:` A list of all the article titles you want to get the content of. For example: ['.26k', 'Dunkelzahn', 'Toxischer Geist']. Overrides ARTICLE_TITLES_RANGE

`ARTICLE_TITLES_RANGE:` A range of articles to translate based on article index. Has no effect if a list of titles is added to ARTICLE_TITLES. Control this via `TRANSLATE_ARTICLE_START` and `TRANSLATE_ARTICLE_END`

`AUTH_KEY:` Your DeepL API key

`NO_TRANSLATE:` If enabled, skips the step where it translates and saves the article content. It will only get and save the original untranslated version of the article. Use this if you only want to do a test run without wasting your DeepL usage.

`GLOSSARY_ID:` Id of the glossary to use. Running the `create-glossary` option outputs the ID. You have to create your own.

`OUTPUT_FOLDER:` Folder for the output. Files will be saved here. If the folder doesn't exist, it will be created by the script

`WIKI_URL:` Url of the wiki you wish to translate. Make sure to include the /api.php part

`TRANSLATE_ARTICLE_START:` Start translating from this article index

`TRANSLATE_ARTICLE_END:` End translating at this index (not including). Can be 'all' to fetch all articles.
