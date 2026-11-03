import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';

// Mount the React app using the local stylesheet and the HTML entry point
createRoot(document.getElementById('root')!).render(<App />);
