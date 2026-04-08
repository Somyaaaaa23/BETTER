// ✅ FIXED
const BASE = "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });

    const data = await res.json().catch(() => ({ error: "Invalid server response" }));

    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }

    return data;
}

export const api = {
    analyze: (idea) =>
        request("/analyze", { method: "POST", body: JSON.stringify({ idea }) }),

    getAnalysis: (id) => request(`/analyses/${id}`),

    getHistory: (sessionId) => request(`/sessions/${sessionId}/analyses`),

    getCurrentSession: () => request("/session/current"),

    getAdminStats: () => request("/admin/stats"),
};
