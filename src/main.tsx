import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/index.css';
import './Demo01';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ul>
      <li>Demo01</li>
      <li>Demo02</li>
      <li>Demo03</li>
    </ul>
  </StrictMode>
);
