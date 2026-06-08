import api from '../axios';

export const studentsApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getOne: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.patch(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/students/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const teachersApi = {
  getAll: (params?: any) => api.get('/teachers', { params }),
  getOne: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post('/teachers', data),
  update: (id: string, data: any) => api.patch(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
};

export const coursesApi = {
  getAll: (params?: any) => api.get('/courses', { params }),
  getOne: (id: string) => api.get(`/courses/${id}`),
  create: (data: any) => api.post('/courses', data),
  update: (id: string, data: any) => api.patch(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
};

export const groupsApi = {
  getAll: (params?: any) => api.get('/groups', { params }),
  getMyGroups: () => api.get('/groups/my-groups'),
  getMyStudentGroups: () => api.get('/groups/my-student-groups'),
  getOne: (id: string) => api.get(`/groups/${id}`),
  findOne: (id: string) => api.get(`/groups/${id}`),
  create: (data: any) => api.post('/groups', data),
  update: (id: string, data: any) => api.patch(`/groups/${id}`, data),
  delete: (id: string) => api.delete(`/groups/${id}`),
  getStudents: (id: string) => api.get(`/groups/${id}/students`),
  addStudent: (id: string, studentId: string) => api.post(`/groups/${id}/students`, { studentId }),
  removeStudent: (id: string, studentId: string) => api.delete(`/groups/${id}/students/${studentId}`),
};

export const attendanceApi = {
  create: (data: any) => api.post('/attendance', data),
  getByGroup: (groupId: string, params?: any) => api.get(`/attendance/group/${groupId}`, { params }),
  getByStudent: (studentId: string, params?: any) => api.get(`/attendance/student/${studentId}`, { params }),
  getGroupStats: (groupId: string) => api.get(`/attendance/group/${groupId}/stats`),
  update: (id: string, data: any) => api.patch(`/attendance/${id}`, data),
};

export const paymentsApi = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getOne: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  update: (id: string, data: any) => api.patch(`/payments/${id}`, data),
  delete: (id: string) => api.delete(`/payments/${id}`),
  getStudentDebt: (studentId: string) => api.get(`/payments/student/${studentId}/debt`),
  getMonthlyRevenue: (year: number) => api.get(`/payments/revenue/${year}`),
  generateInvoices: (data: any) => api.post('/payments/generate-invoices', data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
  getRevenueChart: (year?: number) => api.get('/dashboard/revenue-chart', { params: { year } }),
  getGroupsOverview: () => api.get('/dashboard/groups-overview'),
};

export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const homeworkApi = {
  getByGroup: (groupId: string) => api.get(`/homework/group/${groupId}`),
  getMyHomeworks: () => api.get('/homework/my'),
  create: (data: { groupId: string; title: string; description?: string; dueDate?: string }, file?: File | null) => {
    const form = new FormData();
    form.append('groupId', data.groupId);
    form.append('title', data.title);
    if (data.description) form.append('description', data.description);
    if (data.dueDate) form.append('dueDate', data.dueDate);
    if (file) form.append('file', file);
    return api.post('/homework', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  submit: (id: string, note?: string, file?: File | null) => {
    const form = new FormData();
    if (note) form.append('note', note);
    if (file) form.append('file', file);
    return api.post(`/homework/${id}/submit`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getSubmissions: (id: string) => api.get(`/homework/${id}/submissions`),
  grade: (submissionId: string, points: number) => api.patch(`/homework/submissions/${submissionId}/grade`, { points }),
  delete: (id: string) => api.delete(`/homework/${id}`),
};

export const quizApi = {
  getByGroup: (groupId: string) => api.get(`/quiz/group/${groupId}`),
  getMyQuizzes: () => api.get('/quiz/my'),
  getOne: (id: string) => api.get(`/quiz/${id}`),
  getResults: (id: string) => api.get(`/quiz/${id}/results`),
  create: (data: any) => api.post('/quiz', data),
  submit: (id: string, answers: Record<string, number>) => api.post(`/quiz/${id}/submit`, { answers }),
  toggle: (id: string) => api.patch(`/quiz/${id}/toggle`),
  delete: (id: string) => api.delete(`/quiz/${id}`),
};

export const expensesApi = {
  getAll: (params?: { month?: number; year?: number; category?: string }) =>
    api.get('/expenses', { params }),
  create: (data: { title: string; amount: number; category: string; description?: string; date?: string }) =>
    api.post('/expenses', data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const myPaymentsApi = {
  getMyPayments: () => api.get('/payments/my-payments'),
  pay: (id: string, data: { amount: number; method?: string; description?: string }) =>
    api.post(`/payments/${id}/pay`, data),
};

export const reportsApi = {
  getStudentReport: (id: string) => api.get(`/reports/student/${id}`),
  getTeacherReport: (id: string) => api.get(`/reports/teacher/${id}`),
  getPaymentReport: (params?: any) => api.get('/reports/payments', { params }),
  getAttendanceReport: (params?: any) => api.get('/reports/attendance', { params }),
};

const EXPORT_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/reports/export';

async function downloadBlob(url: string, filename?: string) {
  const token = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('educrm-auth') || '{}')?.state?.accessToken ?? ''
    : '';
  const blob = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.blob());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  if (filename) a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const exportApi = {
  downloadStudents: () =>
    downloadBlob(`${EXPORT_BASE}/students`, `oquvchilar_${new Date().toISOString().slice(0, 10)}.xlsx`),

  downloadPayments: (params?: { month?: number; year?: number; groupId?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)])
          )
        )
      : '';
    return downloadBlob(`${EXPORT_BASE}/payments${qs}`, `tolovlar_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  downloadAttendance: (groupId: string) =>
    downloadBlob(`${EXPORT_BASE}/attendance/${groupId}`, `davomat_${new Date().toISOString().slice(0, 10)}.xlsx`),
};

export const lessonsApi = {
  create: (data: { groupId: string; title: string; description?: string; lessonDate: string; duration?: number; topic?: string }) =>
    api.post('/lessons', data),
  getMyLessons: () => api.get('/lessons/my'),
  getStudentLessons: () => api.get('/lessons/student'),
  getByGroup: (groupId: string) => api.get(`/lessons/group/${groupId}`),
  update: (id: string, data: any) => api.patch(`/lessons/${id}`, data),
  delete: (id: string) => api.delete(`/lessons/${id}`),
};

export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
