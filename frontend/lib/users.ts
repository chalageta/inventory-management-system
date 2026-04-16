'use client';
import api from './api';

// =========================
// 👥 USER MANAGEMENT API
// =========================

// GET USERS with optional search & pagination
export const getUsers = async (params: { search?: string; page?: number; limit?: number }) => {
  const res = await api.get('/auth/users', { params });
  return res.data; // { data: [...users], pagination: { total, page, limit } }
};

// CREATE NEW USER (Admin only)
export const createUser = async (data: { name: string; email: string; password: string; role: string }) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

// UPDATE USER (Admin only)
export const updateUser = async (id: number, data: { name?: string; email?: string; role?: string; is_active?: boolean }) => {
  const res = await api.put(`/auth/users/${id}`, data);
  return res.data;
};

// DELETE USER (Admin only)
export const deleteUser = async (id: number) => {
  const res = await api.delete(`/auth/users/${id}`);
  return res.data;
};

// UPDATE LOGGED-IN USER PROFILE
export const updateProfile = async (data: { name?: string; email?: string }) => {
  const res = await api.put('/auth/profile', data);
  return res.data;
};

// CHANGE LOGGED-IN USER PASSWORD
export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
  const res = await api.put('/auth/change-password', data);
  return res.data;
};