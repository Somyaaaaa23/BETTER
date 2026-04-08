const DIMENSION_LABELS = {
    problem_clarity: "Problem Clarity",
    target_customer: "Target Customer",
    alternatives: "Existing Alternatives",
    distribution: "Distribution",
    defensibility: "Defensibility",
    founder_market_fit: "Founder–Market Fit",
};

const DIMENSION_WEIGHTS = {
    problem_clarity: 20,
    target_customer: 15,
    alternatives: 15,
    distribution: 20,
    defensibility: 15,
    founder_market_fit: 15,
};

function scoreColor(score) {
    if (score >= 7) return "bg-terminal-green";
    if (score >= 4) return "bg-terminal-yellow";
    return "bg-terminal-red";
}

function scoreTextColor(score) {
    if (score >= 7) return "text-terminal-green";
    if (score >= 4) return "text-terminal-yellow";
    return "text-terminal-red";
}

export default function DimensionCard({ dimension, score, reasoning, flags, index }) {
    const label = DIMENSION_LABELS[dimension] || dimension;
    const weight = DIMENSION_WEIGHTS[dimension] || 0;
    const barWidth = `${score * 10}%`;

    return (
        <div
            className="border border-terminal-border bg-terminal-surface rounded-lg p-4 animate-slide-up"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both", opacity: 0 }}
        >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                    <div className="text-terminal-muted text-xs tracking-widest uppercase mb-0.5">
                        [{String(index + 1).padStart(2, "0")}] weight: {weight}%
                    </div>
                    <div className="text-terminal-text text-sm font-medium">{label}</div>
                </div>
                <div className={`text-2xl font-bold tabular-nums ${scoreTextColor(score)}`}>
                    {score.toFixed(1)}
                </div>
            </div>

            {/* Score bar */}
            <div className="h-1 bg-terminal-dim rounded-full mb-3 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreColor(score)}`}
                    style={{ width: barWidth }}
                />
            </div>

            {/* Reasoning */}
            <p className="text-terminal-muted text-xs leading-relaxed mb-3">{reasoning}</p>

            {/* Flags */}
            {flags && flags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {flags.map((flag, i) => (
                        <span
                            key={i}
                            className="text-xs px-2 py-0.5 border border-terminal-red/30 text-terminal-red/80 rounded bg-terminal-red/5"
                        >
                            ⚑ {flag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
