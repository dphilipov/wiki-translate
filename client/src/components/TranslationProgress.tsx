import React, { useState, useRef, useEffect } from 'react';
import type { Config, TranslationResult } from '../types';
import './TranslationProgress.scss';

interface TranslationProgressProps {
  config: Config;
  selectedArticles: string[];
  isTranslating: boolean;
  setIsTranslating: (isTranslating: boolean) => void;
  translationResults: TranslationResult | null;
  setTranslationResults: (results: TranslationResult | null) => void;
}

interface LogEntry {
  message: string;
  status: 'fetching' | 'translating' | 'success' | 'error' | 'skipped' | 'info' | 'complete';
}

interface Progress {
  current: number;
  total: number;
}

function TranslationProgress({
  config,
  selectedArticles,
  isTranslating,
  setIsTranslating,
  translationResults,
  setTranslationResults
}: TranslationProgressProps) {
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });
  const [currentArticle, setCurrentArticle] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Auto-scroll logs to bottom
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const startTranslation = async () => {
    if (selectedArticles.length === 0) {
      alert('Please select articles to translate');
      return;
    }

    if (!config.dryRun && !config.authKey) {
      alert('Please enter a DeepL API key');
      return;
    }

    setIsTranslating(true);
    setProgress({ current: 0, total: selectedArticles.length });
    setLogs([]);
    setTranslationResults(null);

    try {
      const response = await fetch('/api/translation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: selectedArticles,
          authKey: config.authKey,
          sourceLang: config.sourceLang,
          targetLang: config.targetLang,
          wikiUrl: config.wikiUrl,
          dryRun: config.dryRun,
          allowOverwrite: config.allowOverwrite,
          outputFolder: config.outputFolder,
          chunkThreshold: config.chunkThreshold,
          useGlossary: config.useGlossary
        })
      });

      // Set up EventSource for SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'session') {
              setSessionId(data.sessionId);
            } else if (data.type === 'progress') {
              setProgress({ current: data.current, total: data.total });
              setCurrentArticle(data.articleTitle);

              let logMessage = `[${data.current}/${data.total}] ${data.articleTitle}`;

              if (data.status === 'fetching') {
                logMessage += ' - Fetching...';
              } else if (data.status === 'translating') {
                logMessage += ' - Translating...';
              } else if (data.status === 'success') {
                logMessage += ` - ✓ Success ${data.message ? '(' + data.message + ')' : ''}`;
              } else if (data.status === 'error') {
                logMessage += ` - ✗ Error: ${data.message}`;
              } else if (data.status === 'skipped') {
                logMessage += ` - ⊘ Skipped: ${data.message}`;
              }

              setLogs(prev => [...prev, { message: logMessage, status: data.status }]);
            } else if (data.type === 'error') {
              setLogs(prev => [...prev, {
                message: `Error in ${data.articleTitle}: ${data.error}`,
                status: 'error'
              }]);
            } else if (data.type === 'complete') {
              setIsTranslating(false);
              setTranslationResults(data);

              const summaryMessage = data.stopped
                ? `Translation stopped. Completed: ${data.successCount}, Errors: ${data.errorCount}`
                : `Translation complete! Success: ${data.successCount}, Errors: ${data.errorCount}`;

              setLogs(prev => [...prev, {
                message: summaryMessage,
                status: 'complete'
              }]);
            }
          }
        }
      }
    } catch (error) {
      console.error('Translation error:', error);
      setLogs(prev => [...prev, {
        message: `Fatal error: ${error.message}`,
        status: 'error'
      }]);
      setIsTranslating(false);
    }
  };

  const stopTranslation = async () => {
    if (sessionId) {
      try {
        await fetch(`/api/translation/stop/${sessionId}`, { method: 'POST' });
        setLogs(prev => [...prev, {
          message: 'Stopping translation...',
          status: 'info'
        }]);
      } catch (error) {
        console.error('Error stopping translation:', error);
      }
    }
  };

  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="translation-progress">
      <h2>Translation</h2>

      <div className="progress-controls">
        {!isTranslating ? (
          <button onClick={startTranslation} className="start-btn" disabled={selectedArticles.length === 0}>
            Start Translation
          </button>
        ) : (
          <button onClick={stopTranslation} className="stop-btn">
            Stop Translation
          </button>
        )}
      </div>

      {(isTranslating || translationResults) && (
        <>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${percentage}%` }} />
            <div className="progress-text">
              {progress.current} / {progress.total} articles
              {percentage > 0 && ` (${percentage.toFixed(1)}%)`}
            </div>
          </div>

          {currentArticle && isTranslating && (
            <div className="current-article">
              Currently processing: <strong>{currentArticle}</strong>
            </div>
          )}

          {translationResults && (
            <div className="translation-summary">
              <div className="summary-item success">
                <span className="label">Success:</span>
                <span className="value">{translationResults.successCount}</span>
              </div>
              <div className="summary-item error">
                <span className="label">Errors:</span>
                <span className="value">{translationResults.errorCount}</span>
              </div>
            </div>
          )}

          <div className="logs-container">
            <h3>Translation Log</h3>
            <div className="logs">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.status}`}>
                  {log.message}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TranslationProgress;
