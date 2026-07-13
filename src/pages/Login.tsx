import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/', { viewTransition: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Welcome Back</h1>
      
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c00', marginBottom: '20px', borderRadius: '4px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-light)' }}>
        Don't have an account? <Link viewTransition to="/register" style={{ color: 'var(--accent-color)' }}>Register here</Link>
      </p>
    </div>
  );
}
