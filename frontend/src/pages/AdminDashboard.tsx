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
    return users.filter(candidate =>
      candidate.email.toLowerCase().includes(term) || candidate.fullName.toLowerCase().includes(term)
    );
  }, [query, users]);

  const administratorCount = users.filter(candidate => candidate.role === 'ADMINISTRATOR').length;

  if (!isAdministrator) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={28} />
        <h1 className="text-lg font-bold text-slate-900">Platform administration requires an administrator account</h1>
        <p className="text-xs text-slate-500 mt-2">
          You are signed in as {user?.email}. Accounts created through registration are regular users.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 right-0 w-72 h-72 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <ShieldCheck size={20} className="text-orange-400" />
            Platform Administration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage platform roles across every project. Project ownership is separate and stays per project.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <p className="text-lg font-bold text-slate-100">{users.length}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Accounts</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <p className="text-lg font-bold text-orange-400">{administratorCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Administrators</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-800">Registered accounts</h2>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by name or email"
              className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-orange-400"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Capacity</th>
                  <th className="px-4 py-3 font-semibold">Platform role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(candidate => (
                  <tr key={candidate.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                          {candidate.fullName.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                          {candidate.fullName}
                          {candidate.id === user?.id && (
                            <span className="ml-2 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded uppercase">
                              You
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{candidate.email}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{candidate.capacityPoints} SP</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={candidate.role}
                          disabled={savingId === candidate.id}
                          onChange={event => changeRole(candidate, event.target.value as Role)}
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-orange-400 cursor-pointer disabled:opacity-60"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                        </select>
                        {savingId === candidate.id && <Loader2 size={13} className="animate-spin text-orange-500" />}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-xs text-slate-500 italic">
                      No accounts match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
