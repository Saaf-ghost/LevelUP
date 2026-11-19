import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../context/AuthContext';
import { ShieldCheck, Search, Loader2, AlertTriangle } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  capacityPoints: number;
}

const AdminDashboard: React.FC = () => {
  const { isAdministrator, user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<AdminUser[]>('/admin/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load platform accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdministrator) void loadUsers();
  }, [isAdministrator, loadUsers]);

  const changeRole = async (target: AdminUser, role: Role) => {
    if (target.role === role) return;
    setSavingId(target.id);
    setError('');
    try {
      const response = await api.put<AdminUser>(`/admin/users/${target.id}/role`, { role });
      setUsers(prev => prev.map(candidate => (candidate.id === target.id ? response.data : candidate)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not update that account.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      candidate => candidate.email.toLowerCase().includes(term) || candidate.fullName.toLowerCase().includes(term),
    );
  }, [query, users]);

  const administratorCount = users.filter(candidate => candidate.role === 'ADMINISTRATOR').length;

  if (!isAdministrator) {
    return (
      <div className="card mx-auto max-w-3xl p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 text-brand" size={26} />
        <h1 className="font-display text-xl font-semibold text-ink">Administrator access required</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You are signed in as {user?.email}. Accounts created through registration are regular users.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-xs">Platform</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold text-ink">
            <ShieldCheck size={20} className="text-brand" />
            Administration
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Platform roles only. Project ownership stays separate and is managed inside each project.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="min-w-[92px] rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-center">
            <p className="font-display text-2xl font-semibold text-ink tnum">{users.length}</p>
            <p className="label-xs mt-0.5">Accounts</p>
          </div>
          <div className="min-w-[92px] rounded-xl border border-brand/25 bg-brand-soft px-4 py-2.5 text-center">
            <p className="font-display text-2xl font-semibold text-brand tnum">{administratorCount}</p>
            <p className="label-xs mt-0.5">Admins</p>
          </div>
        </div>
      </header>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-ink">Registered accounts</h2>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search name or email"
              className="input w-full pl-9 sm:w-64"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-ink-faint">
            <Loader2 size={16} className="animate-spin" />
            Loading accounts…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <th className="px-4 py-2.5 font-semibold">Account</th>
                  <th className="px-4 py-2.5 font-semibold">Email</th>
                  <th className="px-4 py-2.5 font-semibold">Capacity</th>
                  <th className="px-4 py-2.5 font-semibold">Platform role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map(candidate => (
                  <tr key={candidate.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#f6b544] text-[10px] font-bold uppercase text-white">
                          {candidate.fullName.charAt(0)}
                        </span>
                        <span className="text-xs font-semibold text-ink">
                          {candidate.fullName}
                          {candidate.id === user?.id && (
                            <span className="ml-2 rounded border border-brand/25 bg-brand-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-soft">{candidate.email}</td>
                    <td className="px-4 py-3 text-xs text-ink-soft tnum">{candidate.capacityPoints} SP</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={candidate.role}
                          disabled={savingId === candidate.id}
                          onChange={event => changeRole(candidate, event.target.value as Role)}
                          className="input w-auto cursor-pointer py-1.5 text-xs disabled:opacity-60"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                        </select>
                        {savingId === candidate.id && <Loader2 size={13} className="animate-spin text-brand" />}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-xs italic text-ink-faint">
                      No accounts match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
