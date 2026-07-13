import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { ArticleDetail } from './pages/ArticleDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

function App() {
  return (
    <HelmetProvider>
      <Toaster position="top-center" toastOptions={{ 
        style: { 
          borderRadius: '10px', 
          background: 'var(--bg-card)', 
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        } 
      }} />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manage" element={
            <Suspense fallback={<div className="container"><p>Loading Dashboard...</p></div>}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </HelmetProvider>
  );
}

export default App;
