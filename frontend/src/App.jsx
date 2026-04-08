import { useState } from "react";
import IdeaForm from "./components/IdeaForm.jsx";
import Scorecard from "./components/Scorecard.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import LoadingTerminal from "./components/LoadingTerminal.jsx";
import { useAnalysis } from "./hooks/useAnalysis.js";

export default function App() {
    const { result, loading, error, submit, reset } = useAnalysis();
    const [selectedResult, setSelectedResult] = useState(null);

    const displayed = selectedResult || result;

    function handleReset() {
        reset();
        setSelectedResult(null);
    }

    function handleHistorySelect(item) {
        setSelectedResult(item);
        reset();
    }

    return (
        <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono">
            {/* Header */}
            <header className="border-b border-terminal-border px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-terminal-accent text-lg font-bold tracking-tight">
                            ◈ IDEA VALIDATOR
                        </div>
                        <div className="hidden sm:block text-terminal-muted text-xs tracking-widest uppercase">
                            v1.0.0 — startup stress-tester
                        </div>
                    </div>
                    <div className="text-terminal-muted text-xs">
                        <span className="text-terminal-green">●</span> online
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* Intro — only shown before first analysis */}
                {!displayed && !loading && (
                    <div className="space-y-1 animate-fade-in">
                        <div className="text-terminal-muted text-xs tracking-widest uppercase">
                            system ready
                        </div>
                        <h1 className="text-terminal-text text-xl font-medium">
                            Stress-test your startup idea.
                        </h1>
                        <p className="text-terminal-muted text-sm leading-relaxed max-w-xl">
                            Scored across 6 investor dimensions. Brutal honesty. No fluff.
                        </p>
                    </div>
                )}

                {/* Input form — shown when no result displayed */}
                {!displayed && (
                    <>
                        <IdeaForm onSubmit={submit} loading={loading} />
                        {loading && <LoadingTerminal />}
                        {error && (
                            <div className="border border-terminal-red/30 bg-terminal-red/5 rounded-lg p-4 text-terminal-red text-sm">
                                ✗ {error}
                            </div>
                        )}
                    </>
                )}

                {/* Scorecard */}
                {displayed && !loading && (
                    <Scorecard data={displayed} onReset={handleReset} />
                )}

                {/* History */}
                <HistoryPanel
                    onSelect={handleHistorySelect}
                    currentId={displayed?.id}
                />
            </main>

            {/* Footer */}
            <footer className="border-t border-terminal-border px-6 py-4 mt-12">
                <div className="max-w-4xl mx-auto text-terminal-muted text-xs flex items-center justify-between">
                    <span>Built for Better — 0→1 product studio</span>
                    <span className="text-terminal-dim">Powered by Claude</span>
                </div>
            </footer>
        </div>
    );
}
