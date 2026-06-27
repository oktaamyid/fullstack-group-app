import api from './api';

export const getBudgets = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  
  const response = await api.get('/budgets', { params });
  return response.data.budgets;
};

export const setBudget = async (data) => {
  const response = await api.post('/budgets', data);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};

export const getBudgetProgress = async (month, year) => {
  const params = {};
  if (month) params.month = month;
  if (year) params.year = year;
  
  const response = await api.get('/budgets/progress', { params });
  return response.data;
};
