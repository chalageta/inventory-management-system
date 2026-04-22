'use client';
import api from './api';

export const getProducts = async (params: any = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProduct = async (id: number) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const createProduct = async (payload: any) => {
  const { data } = await api.post('/products', payload);
  return data;
};

export const updateProduct = async (id: number, payload: any) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
};

export const archiveProduct = async (id: number) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

export const uploadProductsExcel = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/products/upload-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};