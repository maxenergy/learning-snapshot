import { useState, useEffect } from 'react';
import type { Snapshot } from '../storage/models/Snapshot';
import type { TranslationResult } from '../types/translation';

type ViewMode = 'original' | 'bilingual';
type TranslatedPair = { original: string; translated: string };

function App() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedPairs, setTranslatedPairs] = useState<TranslatedPair[]>([]);

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        setLoading(true);
        const result = await chrome.storage.session.get(['selectedSnapshotId']);
        const snapshotId = result.selectedSnapshotId;

        if (!snapshotId) {
          setError('No snapshot selected.');
          setLoading(false);
          return;
        }

        const response = await chrome.runtime.sendMessage({ type: 'GET_SNAPSHOT', payload: snapshotId });
        if (response.success) {
          setSnapshot(response.data);
        } else {
          setError(response.error || 'Failed to load snapshot.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      } finally {
        setLoading(false);
      }
    };
    loadSnapshot();
  }, []);

  const handleTranslate = async () => {
    if (!snapshot) return;
    setIsTranslating(true);
    setError(null);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = snapshot.content.html;
    const paragraphs = Array.from(tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'))
      .map(p => p.textContent || '')
      .filter(t => t.trim().length > 10);

    try {
      const translationPromises = paragraphs.map(p =>
        chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          payload: { text: p, from: snapshot.metadata.language, to: 'en' },
        })
      );

      const results = await Promise.all(translationPromises);
      const pairs = results.map((res: any, i: number) => ({
        original: paragraphs[i],
        translated: res.success ? (res.data as TranslationResult).translated : `Error: ${res.error}`,
      }));

      setTranslatedPairs(pairs);
      setViewMode('bilingual');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExport = () => {
    if (!snapshot) return;
    chrome.runtime.sendMessage({
      type: 'EXPORT_TO_OBSIDIAN',
      payload: snapshot,
    }, (response: any) => {
      if (chrome.runtime.lastError) {
        setError(`Export failed: ${chrome.runtime.lastError.message}`);
      } else if (response && !response.success) {
        setError(`Export failed: ${response.error}`);
      }
    });
  };

  const renderContent = () => {
    if (loading) return <p className="text-muted-foreground p-6">Loading snapshot...</p>;
    if (error && !isTranslating) return <p className="text-destructive p-6">{error}</p>;
    if (!snapshot) return <p className="text-muted-foreground p-6">Select a snapshot to view it here.</p>;

    if (viewMode === 'bilingual') {
      return (
        <div className="space-y-6">
          {translatedPairs.map((pair, index) => (
            <div key={index} className="p-4 border rounded-md">
              <p className="mb-2 text-gray-600">{pair.original}</p>
              <p className="font-semibold text-primary">{pair.translated}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <article className="prose prose-lg max-w-none">
        <h1>{snapshot.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: snapshot.content.html }} />
      </article>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        <h1 className="text-xl font-bold truncate pr-4">{snapshot?.title || 'Snapshot Viewer'}</h1>
        {snapshot && (
          <div className="flex-shrink-0 flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={!snapshot}
            >
              Export
            </button>
            {viewMode === 'original' ? (
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isTranslating ? 'Translating...' : 'Translate'}
              </button>
            ) : (
              <button
                onClick={() => setViewMode('original')}
                className="px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                View Original
              </button>
            )}
          </div>
        )}
      </header>
      <main className="flex-1 p-6 overflow-y-auto">
        {renderContent()}
        {error && isTranslating && <p className="text-destructive mt-4">{error}</p>}
      </main>
    </div>
  );
}

export default App;