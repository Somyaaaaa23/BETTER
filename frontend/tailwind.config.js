/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            fontFamily: {
                mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
            },
            colors: {
                terminal: {
                    bg: "#0a0a0f",
                    surface: "#0f0f1a",
                    border: "#1e1e3a",
                    dim: "#2a2a4a",
                    text: "#c8c8e8",
                    muted: "#5a5a8a",
                    accent: "#7c6af7",
                    green: "#4ade80",
                    yellow: "#facc15",
                    red: "#f87171",
                    cyan: "#22d3ee",
                },
            },
            animation: {
                "scan": "scan 3s linear infinite",
                "blink": "blink 1s step-end infinite",
                "fill-bar": "fill-bar 1s ease-out forwards",
                "fade-in": "fade-in 0.4s ease-out forwards",
                "slide-up": "slide-up 0.5s ease-out forwards",
            },
            keyframes: {
                scan: {
                    "0%": { transform: "translateY(-100%)" },
                    "100%": { transform: "translateY(100vh)" },
                },
                blink: {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0 },
                },
                "fill-bar": {
                    "0%": { width: "0%" },
                    "100%": { width: "var(--bar-width)" },
                },
                "fade-in": {
                    "0%": { opacity: 0 },
                    "100%": { opacity: 1 },
                },
                "slide-up": {
                    "0%": { opacity: 0, transform: "translateY(16px)" },
                    "100%": { opacity: 1, transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
