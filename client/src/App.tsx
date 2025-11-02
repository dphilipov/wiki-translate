import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfigPanel from './components/ConfigPanel';
import ArticleSelection from './components/ArticleSelection';
import TranslationProgress from './components/TranslationProgress';
import ResultsBrowser from './components/ResultsBrowser';
import GlossaryManager from './components/GlossaryManager';
import type { Config, TranslationResult } from './types';
import './App.scss';

function App() {
  const [config, setConfig] = useState<Config>({
    wikiUrl: 'https://shadowhelix.de/api.php',
    sourceLang: 'DE',
    targetLang: 'EN-US',
    authKey: '',
    outputFolder: 'output',
    chunkThreshold: 50000,
    allowOverwrite: false,
    dryRun: false,
    useGlossary: true,
  });

  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationResults, setTranslationResults] =
    useState<TranslationResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    'translate' | 'results' | 'glossary'
  >('translate');

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
