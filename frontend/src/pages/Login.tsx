import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      subtitle="Pick up the sprint where your team left it."
      footer={
        <span>
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Create one
          </Link>
        </span>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="label-xs">
            Email address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="input pl-9"
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="label-xs">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="input pl-9"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5 text-sm">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
};

export default Login;
