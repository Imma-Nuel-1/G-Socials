
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// Apply persisted theme on load
try {
  const t = localStorage.getItem('smm_theme');
  if (t && JSON.parse(t) === 'dark') document.documentElement.classList.add('dark');
} catch {}

createRoot(document.getElementById("root")!).render(<App />);

  