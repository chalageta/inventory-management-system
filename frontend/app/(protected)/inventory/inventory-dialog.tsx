'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getProducts } from '@/lib/products';
import { addInventoryItems, updateInventoryItem } from '@/lib/inventory';

interface InventoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingItemId?: number | null;
    onSuccess?: () => void;
}

interface ProductOption {
    id: number;
    name: string;
}

export default function InventoryDialog({
    open,
    onOpenChange,
    editingItemId = null,
    onSuccess
}: InventoryDialogProps) {
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [productId, setProductId] = useState<number | null>(null);
    const [serialNumbers, setSerialNumbers] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch product list for dropdown
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await getProducts({ page: 1, limit: 100 });
                setProducts(res.data || []);
            } catch (error) {
                toast.error('Failed to load products');
            }
        };
        fetchProducts();
    }, []);

    // Load existing inventory item if editing
    useEffect(() => {
        if (!editingItemId) return;
        const fetchItem = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/inventory-items/${editingItemId}`);
                const data = await res.json();
                setProductId(data.product_id);
                setSerialNumbers(data.serial_number);
            } catch (err) {
                toast.error('Failed to load inventory item');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [editingItemId]);

    const handleSave = async () => {
        if (!productId) return toast.error('Please select a product');
        if (!serialNumbers) return toast.error('Please enter at least one serial number');

        const serialsArray = serialNumbers.split(',').map(sn => sn.trim()).filter(Boolean);

        try {
            setLoading(true);
            if (editingItemId) {
                await updateInventoryItem(editingItemId, { serial_number: serialsArray[0] }); // single update
                toast.success('Inventory item updated');
            } else {
                await addInventoryItems({ product_id: productId, serial_numbers: serialsArray });
                toast.success(`${serialsArray.length} inventory item(s) added`);
            }
            onSuccess?.();
            onOpenChange(false);
            setSerialNumbers('');
            setProductId(null);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to save inventory item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{editingItemId ? 'Edit Inventory Item' : 'Add Inventory Items'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-1">
                        <Label>Product</Label>
                        <select
                            className="border rounded p-2 w-full"
                            value={productId || ''}
                            onChange={(e) => setProductId(Number(e.target.value))}
                        >
                            <option value="" disabled>Select product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid gap-1">
                        <Label>Serial Numbers</Label>
                        <Input
                            value={serialNumbers}
                            onChange={(e) => setSerialNumbers(e.target.value)}
                            placeholder="Enter serial numbers, comma separated"
                        />
                        <p className="text-xs text-slate-500">You can add multiple items by separating serial numbers with commas.</p>
                    </div>
                </div>

                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : editingItemId ? 'Update' : 'Add'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}