const VERDICT_CONFIG = {
    STRONG: {
        color: "text-terminal-green",
        border: "border-terminal-green/40",
        bg: "bg-terminal-green/5",
        glow: "shadow-[0_0_20px_rgba(74,222,128,0.15)]",
        symbol: "◆",
        label: "STRONG",
    },
    PROMISING: {
        color: "text-terminal-cyan",
        border: "border-terminal-cyan/40",
        bg: "bg-terminal-cyan/5",
        glow: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
        symbol: "◈",
        label: "PROMISING",
    },
    RISKY: {
        color: "text-terminal-yellow",
        border: "border-terminal-yellow/40",
        bg: "bg-terminal-yellow/5",
        glow: "shadow-[0_0_20px_rgba(250,204,21,0.15)]",
        symbol: "◇",
        label: "RISKY",
    },
    WEAK: {
        color: "text-terminal-red",
        border: "border-terminal-red/40",
        bg: "bg-terminal-red/5",
        glow: "shadow-[0_0_20px_rgba(248,113,113,0.15)]",
        symbol: "◻",
        label: "WEAK",
    },
};

export default function VerdictBadge({ verdict, score }) {
    const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.WEAK;

    return (
        <div className={`flex items-center gap-6 p-6 border ${cfg.border} ${cfg.bg} ${cfg.glow} rounded-lg animate-fade-in`}>
            {/* Big symbol stamp */}
            <div className={`text-6xl font-bold ${cfg.color} select-none leading-none`}>
                {cfg.symbol}
            </div>

            <div className="flex flex-col gap-1">
                <div className="text-terminal-muted text-xs tracking-widest uppercase">
                    verdict
                </div>
                <div className={`text-3xl font-bold tracking-widest ${cfg.color}`}>
                    {cfg.label}
                </div>
                <div className="text-terminal-muted text-xs">
                    overall score:{" "}
                    <span className={`${cfg.color} font-bold`}>{score}/10</span>
                </div>
            </div>
        </div>
    );
}
