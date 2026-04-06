import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { RootErrorBoundary } from "./app/components/RootErrorBoundary.tsx";
import "./styles/index.css";
import { isInAppBrowser } from "./utils/browser";

// Apply persisted theme on load
try {
  const t = localStorage.getItem("smm_theme");
  if (t && JSON.parse(t) === "dark")
    document.documentElement.classList.add("dark");
} catch {}

function InAppBrowserFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui,-apple-system,sans-serif",
        background: "#f9fafb",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 24px rgba(0,0,0,.08)",
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "42px", marginBottom: "12px" }}>WEB</div>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#111827",
            margin: "0 0 12px",
          }}
        >
          Open in your browser
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.6,
            margin: "0 0 20px",
          }}
        >
          G-Socials does not work reliably inside in-app browsers. Please open
          this page in Chrome, Safari, or your default browser.
        </p>
        <button
          onClick={() => {
            navigator.clipboard
              ?.writeText(window.location.href)
              .catch(() => {});
          }}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Copy link
        </button>
      </div>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <RootErrorBoundary>
      {isInAppBrowser() ? <InAppBrowserFallback /> : <App />}
    </RootErrorBoundary>,
  );
}
