import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { ShopModeProvider } from './context/ShopModeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ShopModeProvider>
          <App />
        </ShopModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
