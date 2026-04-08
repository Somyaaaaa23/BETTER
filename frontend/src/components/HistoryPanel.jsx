import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const VERDICT_COLORS = {
    STRONG: "text-terminal-green",
    PROMISING: "text-terminal-cyan",
    RISKY: "text-terminal-yellow",
    WEAK: "text-terminal-red",
};

export default function HistoryPanel({ onSelect, currentId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { session_id } = await api.getCurrentSession();
                if (!session_id) return;
                const data = await api.getHistory(session_id);
                setHistory(data);
            } catch {
                // History is non-critical — fail silently
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentId]); // Reload when a new analysis completes

    if (loading || history.length === 0) return null;

    return (
        <div className="border border-terminal-border bg-terminal-surface rounded-lg p-4">
            <div className="text-terminal-muted text-xs tracking-widest uppercase mb-3">
                session history
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {history.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded
              border transition-colors text-xs
              ${currentId === item.id
                                ? "border-terminal-accent/40 bg-terminal-accent/10"
                                : "border-transparent hover:border-terminal-border hover:bg-terminal-dim/30"
                            }`}
                        aria-label={`View analysis from ${new Date(item.created_at).toLocaleDateString()}`}
                    >
                        <span className="text-terminal-muted truncate max-w-[60%]">
                            {item.raw_input.slice(0, 50)}…
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className={`font-bold ${VERDICT_COLORS[item.verdict] || "text-terminal-muted"}`}>
                                {item.verdict}
                            </span>
                            <span className="text-terminal-muted">{item.overall_score}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
