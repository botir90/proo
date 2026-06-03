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

export const reportsApi = {
  getStudentReport: (id: string) => api.get(`/reports/student/${id}`),
  getTeacherReport: (id: string) => api.get(`/reports/teacher/${id}`),
  getPaymentReport: (params?: any) => api.get('/reports/payments', { params }),
  getAttendanceReport: (params?: any) => api.get('/reports/attendance', { params }),
};

export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
