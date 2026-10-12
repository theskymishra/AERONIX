const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  getAccessToken: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('aeronix_access_token')
      : null,
  getRefreshToken: () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('aeronix_refresh_token')
      : null,
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aeronix_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('aeronix_refresh_token', refreshToken);
      }
    }
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aeronix_access_token');
      localStorage.removeItem('aeronix_refresh_token');
    }
  },
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = tokenStorage.getAccessToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/')) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            tokenStorage.setTokens(data.accessToken, data.refreshToken);
            isRefreshing = false;
            onRefreshed(data.accessToken);
          } else {
            isRefreshing = false;
            tokenStorage.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            throw new ApiError(401, 'Session expired. Please log in again.');
          }
        } catch (err) {
          isRefreshing = false;
          tokenStorage.clearTokens();
          throw err;
        }
      }

      return new Promise<T>((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryRes = await fetch(url, { ...options, headers });
          resolve(await retryRes.json());
        });
      });
    }
  }

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message = Array.isArray(errorData?.message)
      ? errorData.message.join(', ')
      : errorData?.message || 'An unexpected error occurred';

    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationName: string;
    }) =>
      request<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<any>('/auth/me'),

    logout: (refreshToken: string) =>
      request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
  },

  // Employees
  employees: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number; page: number }>(
        `/employees${q ? `?${q}` : ''}`,
      );
    },
    get: (id: string) => request<any>(`/employees/${id}`),
    create: (data: any) =>
      request<any>('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/employees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    get360: (id: string) => request<any>(`/employees/${id}/360`),
    getCareerTimeline: (id: string) =>
      request<any>(`/employees/${id}/career-timeline`),
    deactivate: (id: string, reason?: string) =>
      request<any>(`/employees/${id}/deactivate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  // Attendance
  attendance: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/attendance${q ? `?${q}` : ''}`,
      );
    },
    record: (employeeId: string, data: any) =>
      request<any>(`/attendance/employees/${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getByEmployee: (employeeId: string, params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(
        `/attendance/employees/${employeeId}${q ? `?${q}` : ''}`,
      );
    },
  },

  // Leave
  leave: {
    getTypes: async () => {
      const res = await request<any>('/leave-types');
      return Array.isArray(res) ? res : res?.items || [];
    },
    getRequests: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/leave-requests${q ? `?${q}` : ''}`,
      );
    },
    getMine: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/leave-requests/mine${q ? `?${q}` : ''}`,
      );
    },
    createRequest: (employeeId: string, leaveTypeId: string, data: any) =>
      request<any>(`/leave-requests/employees/${employeeId}/leave-types/${leaveTypeId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    approveRequest: (id: string) =>
      request<any>(`/leave-requests/${id}/approve`, {
        method: 'POST',
      }),
    rejectRequest: (id: string, reason: string) =>
      request<any>(`/leave-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    getBalances: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any[]>(`/leave-balances${q ? `?${q}` : ''}`);
    },
    getMineBalances: () => request<any[]>('/leave-balances/me'),
  },

  // Payroll
  payroll: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/payroll${q ? `?${q}` : ''}`,
      );
    },
    get: (id: string) => request<any>(`/payroll/${id}`),
    create: (employeeId: string, data: any) =>
      request<any>(`/payroll/employees/${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    process: (id: string, notes?: string) =>
      request<any>(`/payroll/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    approve: (id: string, notes?: string) =>
      request<any>(`/payroll/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    pay: (id: string, notes?: string) =>
      request<any>(`/payroll/${id}/pay`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    cancel: (id: string, notes?: string) =>
      request<any>(`/payroll/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }),
    getMine: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/payroll/mine${q ? `?${q}` : ''}`);
    },
  },

  // Performance & Goals
  performance: {
    getReviews: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/performance-reviews${q ? `?${q}` : ''}`,
      );
    },
    getMine: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/performance-reviews/mine${q ? `?${q}` : ''}`,
      );
    },
    createReview: (employeeId: string, data: any) =>
      request<any>(`/performance-reviews/employees/${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitReview: (id: string) =>
      request<any>(`/performance-reviews/${id}/submit`, { method: 'POST' }),
    acknowledgeReview: (id: string) =>
      request<any>(`/performance-reviews/${id}/acknowledge`, { method: 'POST' }),
    completeReview: (id: string) =>
      request<any>(`/performance-reviews/${id}/complete`, { method: 'POST' }),
  },

  goals: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/goals${q ? `?${q}` : ''}`,
      );
    },
    create: (employeeId: string, data: any) =>
      request<any>(`/goals/employees/${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    activate: (id: string) =>
      request<any>(`/goals/${id}/activate`, { method: 'POST' }),
    complete: (id: string) =>
      request<any>(`/goals/${id}/complete`, { method: 'POST' }),
    cancel: (id: string) =>
      request<any>(`/goals/${id}/cancel`, { method: 'POST' }),
  },

  // Recruitment
  recruitment: {
    getOpenings: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/job-openings${q ? `?${q}` : ''}`,
      );
    },
    createOpening: (data: any) =>
      request<any>('/job-openings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    publishOpening: (id: string) =>
      request<any>(`/job-openings/${id}/publish`, { method: 'POST' }),
    closeOpening: (id: string) =>
      request<any>(`/job-openings/${id}/close`, { method: 'POST' }),

    getCandidates: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/candidates${q ? `?${q}` : ''}`,
      );
    },
    createCandidate: (data: any) =>
      request<any>('/candidates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getApplications: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/applications${q ? `?${q}` : ''}`,
      );
    },
    createApplication: (jobOpeningId: string, data: any) =>
      request<any>(`/applications/job-openings/${jobOpeningId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    screenApplication: (id: string) =>
      request<any>(`/applications/${id}/screen`, { method: 'POST' }),
    shortlistApplication: (id: string) =>
      request<any>(`/applications/${id}/shortlist`, { method: 'POST' }),
    interviewApplication: (id: string) =>
      request<any>(`/applications/${id}/interview`, { method: 'POST' }),
    offerApplication: (id: string) =>
      request<any>(`/applications/${id}/offer`, { method: 'POST' }),
    hireApplication: (id: string) =>
      request<any>(`/applications/${id}/hire`, { method: 'POST' }),
    rejectApplication: (id: string, reason?: string) =>
      request<any>(`/applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    getInterviews: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; pagination: any }>(
        `/interviews${q ? `?${q}` : ''}`,
      );
    },
    scheduleInterview: (applicationId: string, data: any) =>
      request<any>(`/interviews/applications/${applicationId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    confirmInterview: (id: string) =>
      request<any>(`/interviews/${id}/confirm`, { method: 'POST' }),
    completeInterview: (id: string, data: any) =>
      request<any>(`/interviews/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancelInterview: (id: string, reason: string) =>
      request<any>(`/interviews/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    rescheduleInterview: (id: string, data: any) =>
      request<any>(`/interviews/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    noShowInterview: (id: string) =>
      request<any>(`/interviews/${id}/no-show`, { method: 'POST' }),
  },

  // Notifications
  notifications: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; pagination: any }>(
        `/notifications${q ? `?${q}` : ''}`,
      );
    },
    getUnreadCount: () =>
      request<{ unreadCount: number }>('/notifications/unread-count'),
    markRead: (id: string) =>
      request<any>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () =>
      request<{ modifiedCount: number }>('/notifications/mark-all-read', {
        method: 'POST',
      }),
    getPreferences: () => request<any>('/notifications/preferences'),
    updatePreferences: (data: any) =>
      request<any>('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Announcements
  announcements: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; pagination: any }>(
        `/announcements${q ? `?${q}` : ''}`,
      );
    },
    get: (id: string) => request<any>(`/announcements/${id}`),
    create: (data: any) =>
      request<any>('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/announcements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    publish: (id: string) =>
      request<any>(`/announcements/${id}/publish`, { method: 'POST' }),
    archive: (id: string) =>
      request<any>(`/announcements/${id}/archive`, { method: 'POST' }),
  },

  // Documents
  documents: {
    listOrg: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; pagination: any }>(
        `/organization-documents${q ? `?${q}` : ''}`,
      );
    },
    uploadOrg: async (data: { title: string; category: string; description?: string }, file: File) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('category', data.category);
      if (data.description) formData.append('description', data.description);
      formData.append('file', file);

      return request<any>('/organization-documents', {
        method: 'POST',
        body: formData,
      });
    },
    archiveOrg: (id: string) =>
      request<any>(`/organization-documents/${id}`, { method: 'DELETE' }),
    downloadOrgUrl: (id: string) =>
      `${API_URL}/organization-documents/${id}/download`,

    listEmployee: (employeeId: string, params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number }>(
        `/employees/${employeeId}/documents${q ? `?${q}` : ''}`,
      );
    },
    uploadEmployee: async (employeeId: string, data: { name: string; type: string; description?: string }, file: File) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('type', data.type);
      if (data.description) formData.append('description', data.description);
      formData.append('file', file);

      return request<any>(`/employees/${employeeId}/documents`, {
        method: 'POST',
        body: formData,
      });
    },
    downloadEmployeeUrl: (employeeId: string, documentId: string) =>
      `${API_URL}/employees/${employeeId}/documents/${documentId}/download`,
  },

  // Audit Logs
  auditLogs: {
    list: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{ items: any[]; total: number; totalPages: number }>(
        `/audit-logs${q ? `?${q}` : ''}`,
      );
    },
    getByEntity: (entity: string, entityId: string) =>
      request<any[]>(`/audit-logs/${entity}/${entityId}`),
  },

  // Reports & Workforce Intelligence
  reports: {
    getHeadcount: () => request<any>('/reports/headcount'),
    getAttendanceLeave: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/reports/attendance-leave${q ? `?${q}` : ''}`);
    },
    getPayroll: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/reports/payroll${q ? `?${q}` : ''}`);
    },
    getRecruitmentFunnel: () => request<any>('/reports/recruitment-funnel'),
    getPerformanceGoals: () => request<any>('/reports/performance-goals'),
    getWorkforceIntelligence: () => request<any>('/reports/workforce-intelligence'),
    exportUrl: (params: { type: string; format?: string; startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return `${API_URL}/reports/export?${q}`;
    },
  },
};
