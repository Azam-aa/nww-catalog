import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { ShopModeProvider } from './context/ShopModeContext';
import { ShareCartProvider } from './context/ShareCartContext';

import { CategoryProvider } from './context/CategoryContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <CategoryProvider>
          <ShopModeProvider>
            <ShareCartProvider>
              <App />
            </ShareCartProvider>
          </ShopModeProvider>
        </CategoryProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
