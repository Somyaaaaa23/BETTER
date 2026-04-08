import VerdictBadge from "./VerdictBadge.jsx";
import DimensionCard from "./DimensionCard.jsx";

const DIMENSION_ORDER = [
    "problem_clarity",
    "target_customer",
    "alternatives",
    "distribution",
    "defensibility",
    "founder_market_fit",
];

export default function Scorecard({ data, onReset }) {
    const sorted = DIMENSION_ORDER.map((key) =>
        data.dimension_scores.find((d) => d.dimension === key)
    ).filter(Boolean);

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {/* Top bar */}
            <div className="flex items-center justify-between">
                <div className="text-terminal-muted text-xs tracking-widest uppercase">
                    analysis/{data.id.slice(0, 8)}
                </div>
                <button
                    onClick={onReset}
                    className="text-xs text-terminal-muted hover:text-terminal-accent transition-colors tracking-widest uppercase"
                    aria-label="Analyze another idea"
                >
                    ← New Analysis
                </button>
            </div>

            {/* Verdict */}
            <VerdictBadge verdict={data.verdict} score={data.overall_score} />

            {/* Summary */}
            <div className="border border-terminal-border bg-terminal-surface rounded-lg p-4">
                <div className="text-terminal-muted text-xs tracking-widest uppercase mb-2">summary</div>
                <p className="text-terminal-text text-sm leading-relaxed">{data.summary}</p>
            </div>

            {/* Critical question */}
            <div className="border border-terminal-accent/30 bg-terminal-accent/5 rounded-lg p-4">
                <div className="text-terminal-accent text-xs tracking-widest uppercase mb-2">
                    ⚡ critical question
                </div>
                <p className="text-terminal-text text-sm leading-relaxed italic">
                    "{data.critical_question}"
                </p>
            </div>

            {/* Strengths + Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-terminal-green/20 bg-terminal-green/5 rounded-lg p-4">
                    <div className="text-terminal-green text-xs tracking-widest uppercase mb-3">
                        ▲ strengths
                    </div>
                    <ul className="space-y-1.5">
                        {(data.strengths || []).map((s, i) => (
                            <li key={i} className="text-terminal-text text-xs flex gap-2">
                                <span className="text-terminal-green">+</span>
                                {s}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border border-terminal-red/20 bg-terminal-red/5 rounded-lg p-4">
                    <div className="text-terminal-red text-xs tracking-widest uppercase mb-3">
                        ▼ risks
                    </div>
                    <ul className="space-y-1.5">
                        {(data.risks || []).map((r, i) => (
                            <li key={i} className="text-terminal-text text-xs flex gap-2">
                                <span className="text-terminal-red">−</span>
                                {r}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Dimension breakdown */}
            <div>
                <div className="text-terminal-muted text-xs tracking-widest uppercase mb-3">
                    dimension breakdown
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sorted.map((dim, i) => (
                        <DimensionCard key={dim.dimension} {...dim} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
