import { useState } from 'react';
import { toast } from 'react-toastify';
import type { Config } from '../types';
import './ConfigPanel.scss';

const WIKI_PRESETS = [
  {
    name: 'Shadowhelix (German Shadowrun)',
    url: 'https://shadowhelix.de/api.php',
  },
  { name: 'Wikipedia (EN)', url: 'https://en.wikipedia.org/w/api.php' },
  { name: 'Wikipedia (DE)', url: 'https://de.wikipedia.org/w/api.php' },
  { name: 'Fandom Wiki', url: 'https://[wiki-name].fandom.com/api.php' },
  { name: 'Custom', url: '' },
];

const LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'DE', name: 'German' },
  { code: 'FR', name: 'French' },
  { code: 'ES', name: 'Spanish' },
  { code: 'IT', name: 'Italian' },
  { code: 'PT', name: 'Portuguese' },
  { code: 'RU', name: 'Russian' },
  { code: 'JA', name: 'Japanese' },
  { code: 'ZH', name: 'Chinese' },
];

interface ConfigPanelProps {
  config: Config;
  setConfig: (config: Config) => void;
}

interface UsageData {
  count: number;
  limit: number;
  remaining: number;
  percentage: string;
}

function ConfigPanel({ config, setConfig }: ConfigPanelProps) {
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [validating, setValidating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [fetchingUsage, setFetchingUsage] = useState(false);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = WIKI_PRESETS.find(p => p.name === e.target.value);
    if (preset && preset.url) {
      setConfig({ ...config, wikiUrl: preset.url });
    }
  };

  const validateApiKey = async () => {
    if (!config.authKey) {
      setApiKeyValid(false);
      toast.error('Please enter an API key');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/translation/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: config.authKey }),
      });

      const data = await response.json();
      setApiKeyValid(data.valid);

      if (data.valid) {
        toast.success('API key is valid!');
      } else {
        toast.error('Invalid API key');
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      setApiKeyValid(false);
      toast.error('Failed to validate API key');
    } finally {
      setValidating(false);
    }
  };

  const fetchUsage = async () => {
    if (!config.authKey) {
      toast.error('Please enter an API key');
      return;
    }

    setFetchingUsage(true);
    try {
      const response = await fetch('/api/translation/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: config.authKey }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error('Failed to fetch usage');
        setUsage(null);
      } else {
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      toast.error('Failed to fetch usage');
      setUsage(null);
    } finally {
      setFetchingUsage(false);
    }
  };

  return (
    <div className="config-panel">
      <div className="config-panel-header">
        <h2>Configuration</h2>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      <div className={`config-grid ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="config-section">
          <h3>Wiki Settings</h3>

          <div className="form-group">
            <label>Wiki Preset</label>
            <select
              onChange={handlePresetChange}
              defaultValue="Shadowhelix (German Shadowrun)"
            >
              {WIKI_PRESETS.map(preset => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Wiki URL</label>
            <input
              type="text"
              value={config.wikiUrl}
              onChange={e => setConfig({ ...config, wikiUrl: e.target.value })}
              placeholder="https://example.com/api.php"
            />
          </div>
        </div>

        <div className="config-section">
          <h3>Translation Settings</h3>

          <div className="form-group">
            <label>DeepL API Key</label>
            <div className="input-with-button">
              <input
                type="password"
                value={config.authKey}
                onChange={e => {
                  setConfig({ ...config, authKey: e.target.value });
                  setApiKeyValid(null);
                  setUsage(null);
                }}
                placeholder="Enter your DeepL API key"
              />
              <button
                onClick={validateApiKey}
                disabled={validating || !config.authKey}
                className={`validate-btn ${
                  apiKeyValid === true
                    ? 'valid'
                    : apiKeyValid === false
                    ? 'invalid'
                    : ''
                }`}
              >
                {validating
                  ? '...'
                  : apiKeyValid === true
                  ? '✓'
                  : apiKeyValid === false
                  ? '✗'
                  : 'Validate'}
              </button>
            </div>
            <div className="usage-info">
              {usage ? (
                <>
                  <div className="usage-stats">
                    <span className="usage-label">Usage:</span>
                    <span className="usage-value">
                      {usage.count.toLocaleString()} /{' '}
                      {usage.limit.toLocaleString()} chars ({usage.percentage}%)
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div
                      className="usage-bar-fill"
                      style={{ width: `${usage.percentage}%` }}
                    />
                  </div>
                  <div className="usage-remaining">
                    <span>
                      {usage.remaining.toLocaleString()} characters remaining
                    </span>
                    <button
                      onClick={fetchUsage}
                      disabled={fetchingUsage || !config.authKey}
                      className="refresh-usage"
                    >
                      {fetchingUsage ? '⟳' : '↻'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="usage-prompt">
                  <span>Click to check your DeepL quota</span>
                  <button
                    onClick={fetchUsage}
                    disabled={fetchingUsage || !config.authKey}
                    className="refresh-usage"
                  >
                    {fetchingUsage ? '⟳' : '↻'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Source Language</label>
              <select
                value={config.sourceLang}
                onChange={e =>
                  setConfig({ ...config, sourceLang: e.target.value })
                }
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Target Language</label>
              <select
                value={config.targetLang}
                onChange={e =>
                  setConfig({ ...config, targetLang: e.target.value })
                }
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3>Output Settings</h3>

          <div className="form-group">
            <label>Output Folder</label>
            <input
              type="text"
              value={config.outputFolder}
              onChange={e =>
                setConfig({ ...config, outputFolder: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Chunk Threshold (characters)</label>
            <input
              type="number"
              value={config.chunkThreshold}
              min={1}
              max={100000}
              onChange={e =>
                setConfig({
                  ...config,
                  chunkThreshold: parseInt(e.target.value),
                })
              }
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.allowOverwrite}
                onChange={e =>
                  setConfig({ ...config, allowOverwrite: e.target.checked })
                }
              />
              Allow file overwrite
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.dryRun}
                onChange={e =>
                  setConfig({ ...config, dryRun: e.target.checked })
                }
              />
              Dry run (save original only)
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={config.useGlossary}
                onChange={e =>
                  setConfig({ ...config, useGlossary: e.target.checked })
                }
              />
              Use glossary
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigPanel;
