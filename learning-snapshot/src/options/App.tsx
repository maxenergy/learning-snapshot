function App() {
  return (
    <div className="p-8 bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">API Keys</h2>
          <p className="text-muted-foreground">
            (API Key configuration will be here.)
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Export Settings</h2>
          <p className="text-muted-foreground">
            (Obsidian export settings will be here.)
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Data Management</h2>
          <p className="text-muted-foreground">
            (Data statistics and management tools will be here.)
          </p>
        </div>
      </div>
    </div>
  )
}

export default App