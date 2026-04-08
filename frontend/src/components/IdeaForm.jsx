import { useState } from "react";

const PLACEHOLDER = `Describe your startup idea in plain text.

Example: "A B2B SaaS tool that helps small law firms automate client intake forms. 
Lawyers spend 3-4 hours per week on intake. We replace that with a 5-minute 
AI-assisted form builder. Target: solo practitioners and 2-5 person firms in the US."

The more specific you are, the more accurate the scoring.`;

export default function IdeaForm({ onSubmit, loading }) {
    const [idea, setIdea] = useState("");
    const wordCount = idea.trim() ? idea.trim().split(/\s+/).length : 0;
    const charCount = idea.length;
    const canSubmit = idea.trim().length >= 20 && charCount <= 5000 && !loading;

    function handleSubmit(e) {
        e.preventDefault();
        if (canSubmit) onSubmit(idea);
    }

    return (
        <form onSubmit={handleSubmit} className="w-full">
            {/* Terminal header bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-terminal-surface border border-terminal-border rounded-t-lg">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-3 text-terminal-muted text-xs tracking-widest uppercase">
                    idea_input.txt
                </span>
            </div>

            {/* Textarea */}
            <div className="relative border-x border-terminal-border bg-terminal-surface">
                {/* Line numbers */}
                <div className="absolute left-0 top-0 bottom-0 w-10 border-r border-terminal-border flex flex-col pt-3 select-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <span key={i} className="text-terminal-muted text-xs text-right pr-2 leading-6">
                            {i + 1}
                        </span>
                    ))}
                </div>

                <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder={PLACEHOLDER}
                    rows={12}
                    maxLength={5000}
                    className="w-full bg-transparent text-terminal-text text-sm leading-6 pl-12 pr-4 pt-3 pb-3 resize-none placeholder:text-terminal-muted/50 font-mono"
                    aria-label="Startup idea input"
                />
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-terminal-surface border border-t-0 border-terminal-border rounded-b-lg">
                <div className="flex gap-4 text-xs text-terminal-muted">
                    <span>
                        <span className={wordCount < 10 ? "text-terminal-red" : "text-terminal-cyan"}>
                            {wordCount}
                        </span>{" "}
                        words
                    </span>
                    <span>
                        <span className={charCount > 4500 ? "text-terminal-yellow" : "text-terminal-muted"}>
                            {charCount}
                        </span>
                        /5000 chars
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-mono tracking-widest uppercase
            bg-terminal-accent/10 border border-terminal-accent/40 text-terminal-accent
            hover:bg-terminal-accent/20 hover:border-terminal-accent
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-all duration-200 rounded"
                    aria-label="Run analysis"
                >
                    {loading ? (
                        <>
                            <span className="animate-blink">▋</span>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <span>▶</span>
                            <span>Run Analysis</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
