import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are self-hosted (no requests to Google): Instrument Serif, Figtree, JetBrains Mono.
import '@fontsource/instrument-serif/400.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import '@fontsource/jetbrains-mono/400.css';
import './ui/tokens.css';
import './ui/app.css';
import { App } from './App';
import { initTheme } from './ui/theme';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
