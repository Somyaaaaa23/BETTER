import { useState } from "react";
import { api } from "../api/client.js";

export function useAnalysis() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function submit(idea) {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await api.analyze(idea);
            setResult(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setResult(null);
        setError(null);
    }

    return { result, loading, error, submit, reset };
}
