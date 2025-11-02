import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfigPanel from './components/ConfigPanel';
import ArticleSelection from './components/ArticleSelection';
import TranslationProgress from './components/TranslationProgress';
import ResultsBrowser from './components/ResultsBrowser';
import GlossaryManager from './components/GlossaryManager';
import type { Config, TranslationResult } from './types';
import './App.scss';

const CONFIG_STORAGE_KEY = 'wiki-translate-config';

const DEFAULT_CONFIG: Config = {
  wikiUrl: 'https://shadowhelix.de/api.php',
  sourceLang: 'DE',
  targetLang: 'EN-US',
  authKey: '',
  outputFolder: 'output',
  chunkThreshold: 50000,
  allowOverwrite: false,
  dryRun: false,
  useGlossary: true,
};

function loadConfigFromStorage(): Config {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
  }
  return DEFAULT_CONFIG;
}

function App() {
  const [config, setConfig] = useState<Config>(loadConfigFromStorage);

  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationResults, setTranslationResults] =
    useState<TranslationResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    'translate' | 'results' | 'glossary'
  >('translate');

  useEffect(() => {
    try {
      const { authKey, ...configWithoutAuthKey } = config;
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configWithoutAuthKey));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }, [config]);

  return (
    <div className="app">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="app-header">
        <h1>Wiki Translator</h1>
        <nav className="tabs">
          <button
            className={activeTab === 'translate' ? 'active' : ''}
            onClick={() => setActiveTab('translate')}
          >
            Translate
          </button>
          <button
            className={activeTab === 'results' ? 'active' : ''}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
          <button
            className={activeTab === 'glossary' ? 'active' : ''}
            onClick={() => setActiveTab('glossary')}
          >
            Glossary
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'translate' && (
          <div className="translate-view">
            <TranslationProgress
              config={config}
              selectedArticles={selectedArticles}
              isTranslating={isTranslating}
              setIsTranslating={setIsTranslating}
              translationResults={translationResults}
              setTranslationResults={setTranslationResults}
            />

            <div className="main-content-container">
              <ConfigPanel config={config} setConfig={setConfig} />

              <ArticleSelection
                config={config}
                selectedArticles={selectedArticles}
                setSelectedArticles={setSelectedArticles}
              />
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <ResultsBrowser outputFolder={config.outputFolder} />
        )}

        {activeTab === 'glossary' && (
          <GlossaryManager authKey={config.authKey} />
        )}
      </main>
    </div>
  );
}

export default App;
