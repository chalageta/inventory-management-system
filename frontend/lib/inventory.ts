'use client';
import api from './api';

export interface InventoryItem {
    id?: number;
    product_id: number;
    serial_number?: string;
    serial_numbers?: string[];
    status?: string;
    product_name?: string;
    sale?: { customer_name?: string };
}

export interface InventoryQueryParams {
    product_id?: number | string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

// Fetch all inventory items
export const getInventoryItems = async (params?: InventoryQueryParams) => {
    try {
        const { data } = await api.get('/inventory', { params });
        return data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || 'Failed to fetch inventory items');
    }
};

// Fetch single inventory item by ID
export const getInventoryItem = async (id: number) => {
    try {
        const { data } = await api.get(`/inventory/${id}`);
        return data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || 'Failed to fetch inventory item');
    }
};

// Add inventory items (bulk)
export const addInventoryItems = async (payload: { product_id: number; serial_numbers: string[] }) => {
    try {
        const { data } = await api.post('/inventory/add', payload);
        return data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || 'Failed to add inventory items');
    }
};

// Update inventory item
export const updateInventoryItem = async (id: number, payload: Partial<InventoryItem>) => {
    try {
        const { data } = await api.put(`/inventory/${id}`, payload);
        return data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || 'Failed to update inventory item');
    }
};

// Archive (soft delete)
export const archiveInventoryItem = async (id: number) => {
    try {
        const { data } = await api.delete(`/inventory/${id}`);
        return data;
    } catch (error: any) {
        throw new Error(error?.response?.data?.error || 'Failed to archive inventory item');
    }
};