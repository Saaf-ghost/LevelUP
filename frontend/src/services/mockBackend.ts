// ============================================================
// Mock Backend Service — Simulated JWT API Layer
// ============================================================
// Provides realistic async API calls with configurable latency.
// All user data is stored in-memory. The "token" is a base64-
// encoded JSON payload mimicking a JWT structure.
// ============================================================

export interface User {
  id: string;
  role: 'OWNER' | 'MEMBER' | 'VIEWER' | 'MANAGER';
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
  organizationName?: string;
  organizationWebsite?: string;
  skills?: string[];
}

// --------------- helpers ---------------
const mockLatency = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createMockJwt = (userId: string, role: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    role,
    iat: Date.now(),
    exp: Date.now() + 86400000, // 24 h
  }));
  return `${header}.${payload}.mock-signature`;
};

// --------------- in-memory "database" ---------------
const usersDb: User[] = [
  {
    id: 'u-owner',
    role: 'OWNER',
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'owner@levelup.com',
    avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Morgan&background=6366f1&color=fff',
    organizationName: 'LevelUP Inc',
    organizationWebsite: 'https://levelup.io',
    skills: ['Frontend', 'UI/UX Designer'],
  },
  {
    id: 'u-manager',
    role: 'MANAGER',
    firstName: 'Taylor',
    lastName: 'Brooks',
    email: 'manager@levelup.com',
    avatarUrl: 'https://ui-avatars.com/api/?name=Taylor+Brooks&background=f59e0b&color=fff',
    organizationName: 'LevelUP Inc',
    skills: ['Backend', 'DevOps'],
  },
];

// --------------- API methods ---------------
export const mockBackend = {
  login: async (email: string, _password: string): Promise<{ token: string; user: User }> => {
    await mockLatency(700);

    const found = usersDb.find(u => u.email === email);
    if (found) {
      return { token: createMockJwt(found.id, found.role), user: { ...found } };
    }

    // Fallback: any email+password succeeds with MEMBER role
    const fallbackUser: User = {
      id: `u-${Date.now()}`,
      role: 'MEMBER',
      firstName: 'Jane',
      lastName: 'Doe',
      email,
      avatarUrl: `https://ui-avatars.com/api/?name=Jane+Doe&background=10b981&color=fff`,
      organizationName: 'Acme Corp',
      skills: ['Backend'],
    };
    usersDb.push(fallbackUser);
    return { token: createMockJwt(fallbackUser.id, fallbackUser.role), user: { ...fallbackUser } };
  },

  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    organizationName?: string;
    skills?: string[];
  }): Promise<{ token: string; user: User }> => {
    await mockLatency(900);

    const newUser: User = {
      id: `u-${Date.now()}`,
      role: 'MEMBER',
      firstName: data.firstName || 'New',
      lastName: data.lastName || 'User',
      email: data.email,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName)}+${encodeURIComponent(data.lastName)}&background=8b5cf6&color=fff`,
      organizationName: data.organizationName,
      skills: data.skills ?? [],
    };

    usersDb.push(newUser);
    return { token: createMockJwt(newUser.id, newUser.role), user: { ...newUser } };
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    await mockLatency(600);

    const idx = usersDb.findIndex(u => u.id === data.id);
    const base = idx >= 0 ? usersDb[idx] : ({} as User);

    const updated: User = {
      id: data.id ?? base.id ?? 'u1',
      role: data.role ?? base.role ?? 'MEMBER',
      firstName: data.firstName ?? base.firstName ?? '',
      lastName: data.lastName ?? base.lastName ?? '',
      email: data.email ?? base.email ?? '',
      avatarUrl: data.avatarUrl ?? base.avatarUrl ?? '',
      organizationName: data.organizationName ?? base.organizationName,
      organizationWebsite: data.organizationWebsite ?? base.organizationWebsite,
      skills: data.skills ?? base.skills ?? [],
    };

    if (idx >= 0) usersDb[idx] = updated;
    return { ...updated };
  },
};
