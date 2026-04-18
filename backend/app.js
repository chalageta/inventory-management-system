import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path'; // ✅ Add this for cleaner path handling

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import categoriesRoutes from './routes/categories.js';
import inventoryRoutes from './routes/inventory.js';
import reportsRoutes from './routes/reports.js';
import stockLogsRoutes from './routes/stockLogs.js';
import rbacRoutes from './routes/rbac.js';
import purchaseRoutes from './routes/purchase.js';

const app = express();

// ✅ 1. Fix Helmet: Allow Cross-Origin for Images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({
  origin: [
  'http://localhost:3000',
  // 'http://192.168.1.10:3000'
],
credentials: true,
}));

// ✅ 3. Middleware
app.use(express.json());
app.use(cookieParser());

// ✅ 4. Fix Static Serving
// Explicitly setting the path ensures it finds the folder regardless of where you start the server
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ✅ 5. Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/stock-logs', stockLogsRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/purchases', purchaseRoutes);


app.get('/', (req, res) => {
  res.send('Gilando Backend is running 🚀');
});

export default app;