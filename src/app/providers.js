'use client';

import { ThemeProvider } from '../context/ThemeContext';
import { ShareCartProvider } from '../context/ShareCartContext';
import { AdminProvider } from '../context/AdminContext';

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AdminProvider>
        <ShareCartProvider>
          {children}
        </ShareCartProvider>
      </AdminProvider>
    </ThemeProvider>
  );
}
