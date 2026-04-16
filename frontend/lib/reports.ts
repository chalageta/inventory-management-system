"use client";

import api from "./api";

// ================= DASHBOARD =================
export const getDashboard = async () => {
  const res = await api.get("/reports/dashboard");
  return res.data?.data || res.data;
};

// ================= SALES REPORT =================
export const getSalesReport = async (params: any = {}) => {
  const res = await api.get("/reports/sales", { params });
  return res.data?.data || res.data;
};

// ================= PURCHASE REPORT =================
export const getPurchaseReport = async (params: any = {}) => {
  const res = await api.get("/reports/purchases", { params });
  return res.data?.data || res.data;
};

// ================= INVENTORY REPORT =================
export const getInventoryReport = async (params: any = {}) => {
  const res = await api.get("/reports/inventory", { params });
  return res.data?.data || res.data;
};

// ================= STOCK MOVEMENT REPORT =================
export const getStockReport = async (params: any = {}) => {
  const res = await api.get("/reports/stock-movements", { params });
  return res.data?.data || res.data;
};