import db from './config/db.js';
import bcrypt from 'bcrypt';

async function seedUsers() {
    try {
        console.log("Seeding training users...");

        // Find roles
        const [roles] = await db.execute('SELECT id, name FROM roles WHERE name IN ("Admin", "Administrator", "Storeman")');
        
        let adminRoleId = null;
        let storemanRoleId = null;

        for (const role of roles) {
            if (role.name.toLowerCase().includes('admin')) adminRoleId = role.id;
            if (role.name.toLowerCase() === 'storeman') storemanRoleId = role.id;
        }

        // Create roles if they don't exist
        if (!adminRoleId) {
            const [adminRes] = await db.execute('INSERT INTO roles (name) VALUES ("Admin")');
            adminRoleId = adminRes.insertId;
            console.log("Created Admin role.");
        }
        if (!storemanRoleId) {
            const [storemanRes] = await db.execute('INSERT INTO roles (name) VALUES ("Storeman")');
            storemanRoleId = storemanRes.insertId;
            console.log("Created Storeman role.");
        }

        // Passwords
        const defaultPassword = await bcrypt.hash('password123', 12);

        // Administrator
        const adminEmail = 'admin@training.com';
        const [adminCheck] = await db.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);
        if (adminCheck.length === 0) {
            const [res] = await db.execute(
                'INSERT INTO users (name, email, password, is_active) VALUES (?, ?, ?, 1)',
                ['Training Administrator', adminEmail, defaultPassword]
            );
            await db.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [res.insertId, adminRoleId]);
            console.log(`Created Training Administrator (Email: ${adminEmail}, Password: password123)`);
        } else {
            console.log(`Training Administrator already exists (${adminEmail})`);
        }

        // Storeman
        const storemanEmail = 'storeman@training.com';
        const [storemanCheck] = await db.execute('SELECT id FROM users WHERE email = ?', [storemanEmail]);
        if (storemanCheck.length === 0) {
            const [res] = await db.execute(
                'INSERT INTO users (name, email, password, is_active) VALUES (?, ?, ?, 1)',
                ['Training Storeman', storemanEmail, defaultPassword]
            );
            await db.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [res.insertId, storemanRoleId]);
            console.log(`Created Training Storeman (Email: ${storemanEmail}, Password: password123)`);
        } else {
            console.log(`Training Storeman already exists (${storemanEmail})`);
        }

        console.log("Seeding complete.");
        process.exit(0);

    } catch (err) {
        console.error("Error seeding users:", err);
        process.exit(1);
    }
}

seedUsers();
