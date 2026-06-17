import { Syne, DM_Sans } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import '../index.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'National Welding Works - furniture catalog',
  description: 'Digital catalog for steel furniture items manufactured at National Welding Works in Koppal, Karnataka, India.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${syne.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-surface-primary dark:bg-dark-primary text-ink-primary dark:text-white transition-colors duration-200 selection:bg-brand-500/30">
        <Providers>
          <Header />
          <main className="min-h-screen pt-[56px] pb-[72px]">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
