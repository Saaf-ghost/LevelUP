import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, User as UserIcon, Building2, AlertCircle } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';

const SKILLS = ['Frontend', 'Backend', 'UI/UX Designer', 'DevOps', 'QA'];

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    skills: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(item => item !== skill) : [...prev.skills, skill],
    }));
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        capacityPoints: 40,
      });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New account"
      title="Create your account"
      subtitle="You will join as a regular member. Project ownership is granted when you create a project."
      footer={
        <span>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="label-xs">
              First name
            </label>
            <div className="relative">
              <UserIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={event => setFormData({ ...formData, firstName: event.target.value })}
                className="input pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="label-xs">
              Last name
            </label>
            <div className="relative">
              <UserIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={event => setFormData({ ...formData, lastName: event.target.value })}
                className="input pl-9"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="regEmail" className="label-xs">
            Email address
          </label>
          <div className="relative">
            <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="regEmail"
              type="email"
              value={formData.email}
              onChange={event => setFormData({ ...formData, email: event.target.value })}
              className="input pl-9"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="org" className="label-xs">
            Organization
          </label>
          <div className="relative">
            <Building2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              id="org"
              type="text"
              value={formData.organizationName}
              onChange={event => setFormData({ ...formData, organizationName: event.target.value })}
              className="input pl-9"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="regPassword" className="label-xs">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="regPassword"
                type="password"
                value={formData.password}
                onChange={event => setFormData({ ...formData, password: event.target.value })}
                className="input pl-9"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="label-xs">
              Confirm
            </label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={event => setFormData({ ...formData, confirmPassword: event.target.value })}
                className="input pl-9"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="label-xs">Your skills</span>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(skill => {
              const selected = formData.skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  aria-pressed={selected}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selected
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-line bg-surface text-ink-soft hover:border-line-strong'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-2.5 text-sm">
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
