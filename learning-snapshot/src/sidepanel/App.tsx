function App() {
  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Snapshot Viewer</h1>
      </header>
      <main className="flex-1 p-4 overflow-y-auto">
        <p className="text-muted-foreground">
          (The content of the captured snapshot will be displayed here.)
        </p>
      </main>
      <footer className="p-4 border-t">
        <p className="text-muted-foreground">
          (Annotation and note-taking tools will be here.)
        </p>
      </footer>
    </div>
  );
}

export default App;