import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Home, PenSquare, LogIn, LogOut, Sun, Moon, Search } from 'lucide-react';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`, { viewTransition: true });
    } else {
      navigate('/', { viewTransition: true });
    }
  };

  return (
    <nav className="navbar">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', gap: '10px' }}>
        <Link viewTransition to="/" className="nav-brand" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Gecko Space Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
          <span><span style={{ color: 'var(--accent-color)' }}>Gecko</span><span className="hide-on-mobile"> Space</span></span>
        </Link>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="nav-search" style={{ flexGrow: 1, maxWidth: '400px', display: 'flex', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '35px', borderRadius: '20px', height: '40px', paddingRight: '15px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-light)' }} />
        </form>

        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => toggleTheme()} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 5px' }}></div>

          <Link viewTransition to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>
            <Home size={18} /> <span className="hide-on-mobile">Home</span>
          </Link>
          
          {user ? (
            <>
              {profile?.role === 'admin' && (
                <Link viewTransition to="/manage" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>
                  <PenSquare size={18} /> <span className="hide-on-mobile">Manage</span>
                </Link>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'
                }} title={profile?.display_name || user.email}>
                  {(profile?.display_name || user.email)?.charAt(0).toUpperCase()}
                </div>
                <button 
                  onClick={signOut} 
                  className="btn" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.9rem', background: 'transparent', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
                >
                  <LogOut size={16} /> <span className="hide-on-mobile">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <Link viewTransition to="/login" className="btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.9rem', borderRadius: '20px' }}>
              <LogIn size={16} /> <span className="hide-on-mobile">Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
