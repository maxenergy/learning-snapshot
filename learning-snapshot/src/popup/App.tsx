import { useState, useEffect } from 'react';
import type { Snapshot } from '../storage/models/Snapshot';

function App() {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch snapshots when the component mounts
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'LIST_SNAPSHOTS' }, (response: any) => {
      if (response.success) {
        setSnapshots(response.data);
      } else {
        console.error('Failed to fetch snapshots:', response.error);
      }
      setLoading(false);
    });
  }, []);

  const handleCapture = () => {
    setStatus('capturing');
    setErrorMessage('');
    chrome.runtime.sendMessage({ type: 'CAPTURE_SNAPSHOT' }, (response: any) => {
      if (chrome.runtime.lastError) {
        setStatus('error');
        setErrorMessage(chrome.runtime.lastError.message || 'An unknown error occurred.');
        return;
      }
      if (response && response.status === 'request_sent') {
        setStatus('success');
        setTimeout(() => window.close(), 1500);
      } else {
        setStatus('error');
        setErrorMessage(response?.error || 'Failed to send capture request.');
      }
    });
  };

  const handleViewSnapshot = async (snapshotId: string) => {
    // Logic to open the side panel and display the snapshot
    // This requires Chrome 114+ and sidePanel permission.
    // We'll store the selected snapshot ID in storage for the side panel to pick up.
    await chrome.storage.session.set({ selectedSnapshotId: snapshotId });
    // @ts-ignore - chrome.sidePanel is a new API
    await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
  };

  return (
    <div className="w-80 p-4 bg-background text-foreground" style={{ minHeight: '20rem' }}>
      <h1 className="text-xl font-bold mb-4">Learning Snapshot</h1>
      <div className="space-y-4">
        <button
          onClick={handleCapture}
          disabled={status === 'capturing' || status === 'success'}
          className="w-full px-4 py-2 font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {status === 'capturing' ? 'Capturing...' : status === 'success' ? 'Success!' : 'Create Main Content Snapshot'}
        </button>
        {status === 'error' && <p className="text-sm text-destructive text-center">{errorMessage}</p>}
      </div>
      <div className="mt-4 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">Recent Snapshots</h2>
        {loading ? (
          <p className="text-muted-foreground text-center">Loading...</p>
        ) : snapshots.length > 0 ? (
          <ul className="space-y-2">
            {snapshots.slice(0, 5).map((snapshot) => ( // Show latest 5
              <li key={snapshot.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <span className="truncate flex-1 pr-2">{snapshot.title}</span>
                <button
                  onClick={() => handleViewSnapshot(snapshot.id)}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center">No snapshots yet.</p>
        )}
      </div>
    </div>
  );
}

export default App;