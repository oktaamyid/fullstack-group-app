import api from './api';

export const getDebts = async (type, status) => {
  const params = {};
  if (type) params.type = type;
  if (status) params.status = status;
  
  const response = await api.get('/debts', { params });
  return response.data.debts;
};

export const createDebt = async (data) => {
  const response = await api.post('/debts', data);
  return response.data;
};

export const updateDebt = async (id, data) => {
  const response = await api.put(`/debts/${id}`, data);
  return response.data;
};

export const deleteDebt = async (id) => {
  const response = await api.delete(`/debts/${id}`);
  return response.data;
};

export const payDebt = async (id, walletId) => {
  const response = await api.put(`/debts/${id}/pay`, { walletId });
  return response.data;
};
