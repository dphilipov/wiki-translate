import React, { useState, useEffect } from 'react';
import './ResultsBrowser.scss';

interface ResultsBrowserProps {
  outputFolder: string;
}

interface FileInfo {
  baseName: string;
  original?: string;
  originalPath?: string;
  translated?: string;
  translatedPath?: string;
}

type ViewMode = 'side-by-side' | 'single';

function ResultsBrowser({ outputFolder }: ResultsBrowserProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [originalContent, setOriginalContent] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/files?outputFolder=${encodeURIComponent(outputFolder)}`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputFolder]);

  const loadFileContent = async (file: FileInfo) => {
    setSelectedFile(file);
    setOriginalContent('');
    setTranslatedContent('');

    try {
      if (file.originalPath) {
        const response = await fetch(`/api/files/content?filePath=${encodeURIComponent(file.originalPath)}`);
        const data = await response.json();
        setOriginalContent(data.content || '');
      }

      if (file.translatedPath) {
        const response = await fetch(`/api/files/content?filePath=${encodeURIComponent(file.translatedPath)}`);
        const data = await response.json();
        setTranslatedContent(data.content || '');
      }
    } catch (error) {
      console.error('Error loading file content:', error);
    }
  };

  const downloadFile = (filePath: string) => {
    window.open(`/api/files/download?filePath=${encodeURIComponent(filePath)}`, '_blank');
  };

  const getFilteredFiles = (): FileInfo[] => {
    if (!searchTerm) return files;
    return files.filter(file =>
      file.baseName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredFiles = getFilteredFiles();

  return (
    <div className="results-browser">
      <h2>Translation Results</h2>

      <div className="results-controls">
        <button onClick={loadFiles} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="results-layout">
        <div className="file-list">
          <h3>Files ({filteredFiles.length})</h3>
          {filteredFiles.map((file, index) => (
            <div
              key={index}
              className={`file-item ${selectedFile?.baseName === file.baseName ? 'active' : ''}`}
              onClick={() => loadFileContent(file)}
            >
              <div className="file-name">{file.baseName}</div>
              <div className="file-badges">
                {file.original && <span className="badge original">Original</span>}
                {file.translated && <span className="badge translated">Translated</span>}
              </div>
            </div>
          ))}
          {filteredFiles.length === 0 && !loading && (
            <div className="no-files">No files found</div>
          )}
        </div>

        {selectedFile && (
          <div className="file-viewer">
            <div className="viewer-header">
              <h3>{selectedFile.baseName}</h3>
              <div className="viewer-controls">
                <button
                  className={viewMode === 'side-by-side' ? 'active' : ''}
                  onClick={() => setViewMode('side-by-side')}
                  disabled={!originalContent || !translatedContent}
                >
                  Side by Side
                </button>
                <button
                  className={viewMode === 'single' ? 'active' : ''}
                  onClick={() => setViewMode('single')}
                >
                  Single View
                </button>
              </div>
            </div>

            {viewMode === 'side-by-side' && originalContent && translatedContent ? (
              <div className="viewer-content side-by-side">
                <div className="content-panel">
                  <div className="panel-header">
                    <h4>Original</h4>
                    {selectedFile.originalPath && (
                      <button onClick={() => downloadFile(selectedFile.originalPath)}>
                        Download
                      </button>
                    )}
                  </div>
                  <pre className="content-text">{originalContent}</pre>
                </div>
                <div className="content-panel">
                  <div className="panel-header">
                    <h4>Translated</h4>
                    {selectedFile.translatedPath && (
                      <button onClick={() => downloadFile(selectedFile.translatedPath)}>
                        Download
                      </button>
                    )}
                  </div>
                  <pre className="content-text">{translatedContent}</pre>
                </div>
              </div>
            ) : (
              <div className="viewer-content single">
                {originalContent && (
                  <div className="content-panel">
                    <div className="panel-header">
                      <h4>Original</h4>
                      {selectedFile.originalPath && (
                        <button onClick={() => downloadFile(selectedFile.originalPath)}>
                          Download
                        </button>
                      )}
                    </div>
                    <pre className="content-text">{originalContent}</pre>
                  </div>
                )}
                {translatedContent && (
                  <div className="content-panel">
                    <div className="panel-header">
                      <h4>Translated</h4>
                      {selectedFile.translatedPath && (
                        <button onClick={() => downloadFile(selectedFile.translatedPath)}>
                          Download
                        </button>
                      )}
                    </div>
                    <pre className="content-text">{translatedContent}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultsBrowser;
