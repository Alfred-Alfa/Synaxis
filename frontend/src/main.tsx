import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'

console.log('Main.tsx: Script started (Simplified)');

try {
  const rootElement = document.getElementById('root');
  console.log('Main.tsx: Root element found:', rootElement);

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  console.log('Main.tsx: Root created');

  root.render(
    <StrictMode>
      <div><h1>Frontend Working!</h1><p>If you see this, basic React is pending.</p></div>
    </StrictMode>,
  );
  console.log('Main.tsx: Render called');
} catch (error) {
  console.error('Main.tsx: Error during mount:', error);
}
