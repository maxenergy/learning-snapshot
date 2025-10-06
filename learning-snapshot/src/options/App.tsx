import { useState, useEffect } from 'react';

function App() {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Load the saved API key from storage when the component mounts
  useEffect(() => {
    chrome.storage.local.get(['openaiApiKey'], (result) => {
      if (result.openaiApiKey) {
        setOpenaiApiKey(result.openaiApiKey);
      }
    });
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    chrome.storage.local.set({ openaiApiKey: openaiApiKey }, () => {
      console.log('OpenAI API key saved.');
      setSaveStatus('success');
      // Reset the status message after a couple of seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    });
  };

  return (
    <div className="p-8 bg-background text-foreground max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-8">
        {/* API Key Section */}
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Keys</h2>
          <p className="text-muted-foreground mb-4">
            Enter your API keys for third-party services like OpenAI. Your keys are stored locally and are not shared.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="openai-api-key" className="block text-sm font-medium mb-1">
                OpenAI API Key
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="password"
                  id="openai-api-key"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-grow p-2 border rounded-md bg-input text-foreground"
                />
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="px-4 py-2 font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Other sections remain as placeholders */}
        <div className="p-6 border rounded-lg opacity-50">
          <h2 className="text-xl font-semibold mb-2">Export Settings</h2>
          <p className="text-muted-foreground">
            (Obsidian export settings will be here.)
          </p>
        </div>
        <div className="p-6 border rounded-lg opacity-50">
          <h2 className="text-xl font-semibold mb-2">Data Management</h2>
          <p className="text-muted-foreground">
            (Data statistics and management tools will be here.)
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;