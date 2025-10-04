import React, { useState, useEffect } from 'react';
import './GlossaryManager.scss';

interface GlossaryManagerProps {
  authKey: string;
}

interface GlossaryTerm {
  source: string;
  target: string;
}

function GlossaryManager({ authKey }: GlossaryManagerProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGlossary();
  }, []);

  const loadGlossary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/glossary');
      const data = await response.json();
      setTerms(data.terms || []);
    } catch (error) {
      console.error('Error loading glossary:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGlossary = async () => {
    if (!authKey) {
      alert('Please enter a DeepL API key in the configuration');
      return;
    }

    if (!confirm('This will create/update the DeepL glossary. Continue?')) {
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/glossary/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey }),
      });

      const data = await response.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        alert('Glossary created successfully!');
      }
    } catch (error) {
      console.error('Error creating glossary:', error);
      alert('Failed to create glossary');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="glossary-manager">
      <h2>Glossary Manager</h2>

      <div className="glossary-info">
        <p>
          The glossary contains {terms.length} term(s) that will be used for
          consistent translation of specific terminology. Terms must be uploaded
          to DeepL before use.
        </p>
      </div>

      <div className="glossary-controls">
        <button onClick={loadGlossary} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <button onClick={createGlossary} disabled={creating || !authKey}>
          {creating ? 'Creating...' : 'Create/Update DeepL Glossary'}
        </button>
      </div>

      {terms.length > 0 && (
        <div className="glossary-table-container">
          <table className="glossary-table">
            <thead>
              <tr>
                <th>Source Term</th>
                <th>Target Term</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((term, index) => (
                <tr key={index}>
                  <td>{term.source}</td>
                  <td>{term.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {terms.length === 0 && !loading && (
        <div className="no-terms">
          No glossary terms found. Check glossary/glossary.js to add terms.
        </div>
      )}

      <div className="glossary-note">
        <strong>Note:</strong> To add or edit glossary terms, modify the{' '}
        <code>glossary/glossary.ts</code> file in the project directory, then
        click "Create/Update DeepL Glossary" to sync with DeepL.
      </div>
    </div>
  );
}

export default GlossaryManager;
