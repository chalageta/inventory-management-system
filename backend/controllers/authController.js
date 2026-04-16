import db from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

// =======================
// 🔐 TOKEN GENERATOR
// =======================
const generateToken = (user, expiresIn = '30m') => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};
const isAdmin = (req) => req.user && req.user.role === 'Admin';

export const getUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [users] = await db.execute(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.is_active,
        u.last_login,
        u.created_at,
        GROUP_CONCAT(r.name) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL
      AND (u.name LIKE ? OR u.email LIKE ?)
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) AS total 
       FROM users 
       WHERE deleted_at IS NULL 
       AND (name LIKE ? OR email LIKE ?)`,
      [`%${search}%`, `%${search}%`]
    );

    // 🔥 Convert roles string → array
    const formattedUsers = users.map(u => ({
      ...u,
      roles: u.roles ? u.roles.split(',') : []
    }));

    res.json({
      data: formattedUsers,
      pagination: {
        total: countResult[0].total,
        page,
        limit
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SINGLE USER DETAILS
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const [rows] = await db.execute(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.gender, u.address,
        u.is_active, u.created_at,
        GROUP_CONCAT(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = ?
      GROUP BY u.id
    `, [userId]);

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    user.roles = user.roles ? user.roles.split(',') : [];

    res.json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const register = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Access denied: Admin only" });
    }

    const {
      name,
      email,
      password,
      phone,
      gender,
      address,
      bio,
      image,
      roleIds // 🔥 CHANGE: ARRAY NOW
    } = req.body;

    if (!name || !email || !password || !roleIds || !roleIds.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashed = await bcrypt.hash(password, 12);

    const [userResult] = await db.execute(
      `INSERT INTO users (
        name, email, password, phone, gender, address, bio, image, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name,
        email,
        hashed,
        phone || null,
        gender || null,
        address || null,
        bio || null,
        image || null
      ]
    );

    const userId = userResult.insertId;

    // 🔥 MULTIPLE ROLES INSERT
    for (const roleId of roleIds) {
      await db.execute(
        `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
        [userId, roleId]
      );
    }

    res.status(201).json({
      message: "User created with roles successfully",
      userId
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
export const updateUser = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { name, email, phone, gender, address, bio } = req.body;
    const userId = req.params.id;

    // ✅ 1. Get existing user (to delete old image)
    const [rows] = await db.execute(
      `SELECT image FROM users WHERE id = ?`,
      [userId]
    );

    const existingUser = rows[0];

    let imagePath = existingUser?.image || null;

    // ✅ 2. If new image uploaded
    if (req.file) {
      imagePath = `/uploads/profile/${req.file.filename}`;

      // 🔥 DELETE OLD IMAGE
      if (existingUser?.image) {
        const oldPath = `.${existingUser.image}`;

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    // ✅ 3. Update DB
    await db.execute(
      `UPDATE users 
       SET 
         name = ?, 
         email = ?, 
         phone = ?, 
         gender = ?,
         address = ?, 
         bio = ?, 
         image = ?
       WHERE id = ?`,
      [
        name,
        email,
        phone || null,
        gender || null,
        address || null,
        bio || null,
        imagePath,
        userId
      ]
    );

    res.json({ message: "User updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete User
// ✅ Simple Sequential Delete Fix
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. First, delete associated entries in user_roles
    // This removes the foreign key dependency
    await db.execute(`DELETE FROM user_roles WHERE user_id = ?`, [id]);

    // 2. Now delete the user from the users table
    const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User and role associations deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 🚫 DEACTIVATE USER
// =======================
export const deactivateUser = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const userId = req.params.id;

    const [result] = await db.execute(
      `UPDATE users SET is_active = 0 WHERE id = ?`,
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deactivated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `UPDATE users SET is_active = 1 WHERE id = ?`,
      [id]
    );

    res.json({ message: "User activated successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// =======================
// 🔐 AUTHENTICATION
// =======================

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email=? AND deleted_at IS NULL`,
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.is_active) return res.status(403).json({ error: "Account inactive please contact the admin" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    await db.execute(`UPDATE users SET last_login = NOW() WHERE id=?`, [user.id]);

    const accessToken = generateToken(user, '30m');
    const refreshToken = crypto.randomBytes(64).toString('hex');

    await db.execute(`UPDATE users SET refresh_token=? WHERE id=?`, [refreshToken, user.id]);

    res
      .cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 30 * 60 * 1000
      })
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .json({
        message: "Login successful",
        user: { id: user.id, name: user.name, role: user.role }
      });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ REFRESH TOKEN
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const [rows] = await db.execute(
      `SELECT * FROM users WHERE refresh_token=?`,
      [token]
    );

    const user = rows[0];
    if (!user) return res.status(403).json({ error: "Invalid refresh token" });

    const newAccessToken = generateToken(user, '15m');

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: "Token refreshed" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ LOGOUT
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await db.execute(
        `UPDATE users SET refresh_token=NULL WHERE refresh_token=?`,
        [token]
      );
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =======================
// 👤 PROFILE
// =======================
export const me = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.gender,
        u.address,
        u.bio,
        u.image,
        r.name as role_name
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    const [perms] = await db.execute(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
      [req.user.id]
    );

    res.json({
      user: rows[0],
      permissions: perms.map(p => p.name),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const body = req.body || {};

    const name = body.name ?? null;
    const email = body.email ?? null;
    const phone = body.phone ?? null;
    const gender = body.gender ?? null;
    const address = body.address ?? null;
    const bio = body.bio ?? null;

    // Get current user
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = rows[0];

    await db.execute(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = ?,
        gender = ?,
        address = ?,
        bio = ?
      WHERE id = ?`,
      [
        name,
        email,
        phone,
        gender,
        address,
        bio,
        userId
      ]
    );

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // 1. Fetch user
    const [rows] = await db.execute(
      `SELECT password FROM users WHERE id=?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Compare (ensure oldPassword is a string and trimmed)
    const match = await bcrypt.compare(String(oldPassword).trim(), rows[0].password);
    
    if (!match) {
      return res.status(400).json({ error: "The current password you entered is incorrect" });
    }

    // 3. Hash and Update
    const hashed = await bcrypt.hash(String(newPassword).trim(), 12);

    await db.execute(
      `UPDATE users SET password=? WHERE id=?`,
      [hashed, req.user.id]
    );

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// =======================
// 🔑 PASSWORD RESET
// =======================

// ✅ FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [rows] = await db.execute(
      `SELECT id FROM users WHERE email=?`,
      [email]
    );

    if (!rows.length) return res.status(404).json({ error: "Email not found" });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      `UPDATE users SET reset_token=?, reset_expires=? WHERE email=?`,
      [token, expires, email]
    );

    res.json({ message: "Reset token generated", token }); // replace with email service later

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    const [rows] = await db.execute(
      `SELECT id, reset_expires FROM users WHERE reset_token=?`,
      [token]
    );

    if (!rows.length || new Date() > rows[0].reset_expires) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(new_password, 12);

    await db.execute(
      `UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?`,
      [hashed, rows[0].id]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};