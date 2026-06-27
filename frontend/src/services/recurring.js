import api from './api';

export const getRecurring = async () => {
  const response = await api.get('/recurring');
  return response.data.recurrings;
};

export const createRecurring = async (data) => {
  const response = await api.post('/recurring', data);
  return response.data;
};

export const updateRecurringStatus = async (id, status) => {
  const response = await api.put(`/recurring/${id}/status`, { status });
  return response.data;
};

export const deleteRecurring = async (id) => {
  const response = await api.delete(`/recurring/${id}`);
  return response.data;
};
