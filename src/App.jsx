import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { ProductListPage } from './pages/ProductListPage';
import { AdminPage } from './pages/AdminPage';
import { SearchPage } from './pages/SearchPage';
import { ShareCartPage } from './pages/ShareCartPage';

function App() {
  return (
    <div className="font-body min-h-screen bg-surface-primary dark:bg-dark-primary transition-colors duration-200 selection:bg-brand-500/30">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/products/:cat/:sub" element={<ProductListPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/share-cart" element={<ShareCartPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
