import api from './api';

/**
 * 📦 PURCHASE APIs
 * Updated to support pagination, searching, and status filtering.
 */

// GET ALL (with params)
export const getPurchases = async (params: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  status?: string | null 
}) => {
  // api.get standardly handles object-to-query-string conversion
  const response = await api.get('/purchases', { params });
  return response; 
};

// CREATE
export const createPurchase = async (payload: any) => {
  const { data } = await api.post('/purchases', payload);
  return data;
};

// APPROVE
export const approvePurchase = async (id: number) => {
  const { data } = await api.put(`/purchases/${id}/approve`);
  return data;
};

// RECEIVE (🔥 creates inventory automatically)
export const receivePurchase = async (id: number) => {
  const { data } = await api.put(`/purchases/${id}/receive`);
  return data;
};

// REJECT
export const rejectPurchase = async (id: number, reason: string) => {
  const { data } = await api.put(`/purchases/${id}/reject`, { reason });
  return data;
};

// DELETE (soft delete)
export const deletePurchase = async (id: number) => {
  const { data } = await api.delete(`/purchases/${id}`);
  return data;
};

// UPDATE (only available for 'pending' status)
export const updatePurchase = async (id: number, payload: any) => {
  const { data } = await api.put(`/purchases/${id}`, payload);
  return data;
};

// GET SINGLE PURCHASE DETAIL
export const getPurchaseDetail = async (id: number) => {
  const { data } = await api.get(`/purchases/${id}`);
  return data;
};