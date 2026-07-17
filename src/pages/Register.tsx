import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { SwipeButton } from '../components/SwipeButton';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert([
          { id: data.user.id, display_name: displayName, role: 'user' }
        ]);
        if (profileError) throw profileError;
        
        setSuccess(true);
        setTimeout(() => {
          navigate('/', { viewTransition: true });
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Create an Account</h1>
      
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c00', marginBottom: '20px', borderRadius: '4px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '12px', backgroundColor: '#e6f4ea', color: '#137333', marginBottom: '20px', borderRadius: '4px', fontSize: '0.9rem' }}>
          Account created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleRegister} style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div className="form-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            className="form-control"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
          />
        </div>
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
            minLength={6}
          />
        </div>
        <SwipeButton 
          text="Slide to Register" 
          onSwipeSuccess={handleRegister} 
          loading={loading || success} 
        />
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-light)' }}>
        Already have an account? <Link viewTransition to="/login" style={{ color: 'var(--accent-color)' }}>Login here</Link>
      </p>
    </div>
  );
}
