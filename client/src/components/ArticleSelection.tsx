import React, { useState, useEffect } from 'react';
import type { Config, Article } from '../types';
import './ArticleSelection.scss';

interface ArticleSelectionProps {
  config: Config;
  selectedArticles: string[];
  setSelectedArticles: (articles: string[]) => void;
}

type SelectionMode = 'fetch' | 'manual' | 'range';

function ArticleSelection({
  config,
  selectedArticles,
  setSelectedArticles
}: ArticleSelectionProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(100);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('fetch');

  const loadCachedArticles = async () => {
    try {
      const params = new URLSearchParams({
        wikiUrl: config.wikiUrl,
        outputFolder: config.outputFolder
      });
      const response = await fetch(`/api/wiki/articles?${params}`);
      const data = await response.json();
      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error loading cached articles:', error);
    }
  };

  useEffect(() => {
    // Load cached articles on mount and when config changes
    loadCachedArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.wikiUrl, config.outputFolder]);

  const fetchArticles = async () => {
    if (!config.wikiUrl) {
      alert('Please enter a wiki URL first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/wiki/fetch-articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wikiUrl: config.wikiUrl,
          outputFolder: config.outputFolder
        })
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        return;
      }

      setArticles(data.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      alert('Failed to fetch articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const filtered = getFilteredArticles();
    setSelectedArticles(filtered.map(a => a.title));
  };

  const handleDeselectAll = () => {
    setSelectedArticles([]);
  };

  const handleToggleArticle = (article: string) => {
    if (selectedArticles.includes(article)) {
      setSelectedArticles(selectedArticles.filter(a => a !== article));
    } else {
      setSelectedArticles([...selectedArticles, article]);
    }
  };

  const handleManualSubmit = () => {
    const articleList = manualInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    setSelectedArticles(articleList);
  };

  const handleRangeSelect = () => {
    const start = Math.max(0, rangeStart);
    const end = Math.min(articles.length, rangeEnd);
    const rangeArticles = articles.slice(start, end);
    setSelectedArticles(rangeArticles.map(a => a.title));
  };

  const getFilteredArticles = () => {
    if (!searchTerm) return articles;
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredArticles = getFilteredArticles();

  return (
    <div className="article-selection">
      <h2>Article Selection</h2>

      <div className="selection-modes">
        <button
          className={selectionMode === 'fetch' ? 'active' : ''}
          onClick={() => setSelectionMode('fetch')}
        >
          Fetch & Select
        </button>
        <button
          className={selectionMode === 'manual' ? 'active' : ''}
          onClick={() => setSelectionMode('manual')}
        >
          Manual Input
        </button>
        <button
          className={selectionMode === 'range' ? 'active' : ''}
          onClick={() => setSelectionMode('range')}
          disabled={articles.length === 0}
        >
          Range Select
        </button>
      </div>

      {selectionMode === 'fetch' && (
        <div className="fetch-mode">
          <button onClick={fetchArticles} disabled={loading} className="fetch-btn">
            {loading ? 'Fetching...' : 'Fetch All Articles from Wiki'}
          </button>

          {articles.length > 0 && (
            <>
              <div className="article-controls">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <div className="button-group">
                  <button onClick={handleSelectAll}>Select All ({filteredArticles.length})</button>
                  <button onClick={handleDeselectAll}>Deselect All</button>
                </div>
              </div>

              <div className="article-list">
                {filteredArticles.map((article, index) => (
                  <label
                    key={index}
                    className={`article-item ${article.isTranslated ? 'translated' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.title)}
                      onChange={() => handleToggleArticle(article.title)}
                    />
                    <span>{article.title}</span>
                    {article.isTranslated && <span className="translated-badge">Translated</span>}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selectionMode === 'manual' && (
        <div className="manual-mode">
          <textarea
            placeholder="Enter article titles (one per line)..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            rows={10}
          />
          <button onClick={handleManualSubmit}>Use These Articles</button>
        </div>
      )}

      {selectionMode === 'range' && (
        <div className="range-mode">
          <p>Total articles available: {articles.length}</p>
          <div className="range-inputs">
            <div className="form-group">
              <label>Start Index</label>
              <input
                type="number"
                value={rangeStart}
                onChange={(e) => setRangeStart(parseInt(e.target.value) || 0)}
                min={0}
                max={articles.length}
              />
            </div>
            <div className="form-group">
              <label>End Index</label>
              <input
                type="number"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(parseInt(e.target.value) || 0)}
                min={0}
                max={articles.length}
              />
            </div>
          </div>
          <button onClick={handleRangeSelect}>
            Select Range ({Math.max(0, Math.min(rangeEnd, articles.length) - Math.max(0, rangeStart))} articles)
          </button>
        </div>
      )}

      <div className="selection-summary">
        <strong>{selectedArticles.length}</strong> article(s) selected for translation
      </div>
    </div>
  );
}

export default ArticleSelection;
