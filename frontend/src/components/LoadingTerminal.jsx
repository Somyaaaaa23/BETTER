import { useEffect, useState } from "react";

const STEPS = [
    "Initializing scoring engine...",
    "Parsing idea structure...",
    "Evaluating problem clarity...",
    "Assessing target customer...",
    "Scanning competitive landscape...",
    "Modeling distribution channels...",
    "Stress-testing defensibility...",
    "Checking founder–market fit...",
    "Computing overall verdict...",
];

export default function LoadingTerminal() {
    const [visibleSteps, setVisibleSteps] = useState([]);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < STEPS.length) {
                setVisibleSteps((prev) => [...prev, STEPS[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 400);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="border border-terminal-border bg-terminal-surface rounded-lg p-6 font-mono">
            <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-terminal-accent animate-pulse" />
                <span className="text-terminal-accent text-xs tracking-widest uppercase">
                    Running analysis
                </span>
            </div>
            <div className="space-y-1.5">
                {visibleSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs animate-fade-in">
                        <span className="text-terminal-green">✓</span>
                        <span className="text-terminal-muted">{step}</span>
                    </div>
                ))}
                <div className="flex items-center gap-3 text-xs">
                    <span className="text-terminal-accent animate-blink">▋</span>
                    <span className="text-terminal-text">Waiting for Claude...</span>
                </div>
            </div>
        </div>
    );
}
