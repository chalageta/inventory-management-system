import db from '../config/db.js';

export const getStockLogs = async (req, res) => {
    try {
        const { product_id, action_type, page = 1, limit = 10, search = '' } = req.query;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offsetNum = (pageNum - 1) * limitNum;

        let whereClause = " WHERE 1=1";
        const filterParams = [];

        // 1. Existing Filters
        if (product_id) {
            whereClause += ` AND sl.product_id = ?`;
            filterParams.push(product_id);
        }

        if (action_type) {
            whereClause += ` AND sl.action_type = ?`;
            filterParams.push(action_type);
        }

        // 2. Add Search Logic (Searching product name or serial number)
        if (search) {
            whereClause += ` AND (p.name LIKE ? OR i.serial_number LIKE ?)`;
            const searchVal = `%${search}%`;
            filterParams.push(searchVal, searchVal);
        }

        // 3. Get Total Count for accurate pagination (with filters applied)
        // Note: Joined with products/items so search works in the count too
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM stock_logs sl
            LEFT JOIN products p ON sl.product_id = p.id
            LEFT JOIN inventory_items i ON sl.inventory_item_id = i.id
            ${whereClause}
        `;
        const [countResult] = await db.execute(countQuery, filterParams);
        const total = countResult[0].total;

        // 4. Get logs with joins
        const query = `
            SELECT 
                sl.*, 
                p.name AS product_name, 
                i.serial_number, 
                u.name AS user_name
            FROM stock_logs sl
            LEFT JOIN products p ON sl.product_id = p.id
            LEFT JOIN inventory_items i ON sl.inventory_item_id = i.id
            LEFT JOIN users u ON sl.created_by = u.id
            ${whereClause}
            ORDER BY sl.created_at DESC 
            LIMIT ? OFFSET ?
        `;

        const finalParams = [...filterParams, limitNum, offsetNum];
        const [logs] = await db.execute(query, finalParams);

        res.json({
            data: logs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: "Database fetch failed: " + err.message });
    }
};