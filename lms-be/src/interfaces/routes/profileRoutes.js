import express from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../../../lib/prisma.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Multer config for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user.nomorInduk}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'));
    }
  }
});

// All routes require auth
router.use(authMiddleware);

// Upload profile photo
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'File foto tidak ditemukan' });
    }

    const fotoUrl = `/uploads/${req.file.filename}`;
    
    await prisma.user.update({
      where: { nomorInduk: req.user.nomorInduk },
      data: { fotoUrl }
    });

    res.status(200).json({ 
      status: 'success', 
      message: 'Foto profil berhasil diperbarui',
      data: { fotoUrl }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get current user profile (works for both dosen & mahasiswa)
router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { nomorInduk: req.user.nomorInduk },
      select: {
        nomorInduk: true,
        nama: true,
        email: true,
        telepon: true,
        fotoUrl: true,
        role: { select: { nama: true } }
      }
    });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update own profile (email and telepon only)
router.patch('/me', async (req, res) => {
  try {
    const { email, telepon } = req.body;
    
    // Validasi email format
    if (email && !email.includes('@')) {
      return res.status(400).json({ status: 'error', message: 'Format email tidak valid' });
    }
    
    // Validasi telepon (minimal 10 digit)
    if (telepon && telepon.length < 10) {
      return res.status(400).json({ status: 'error', message: 'Nomor telepon minimal 10 digit' });
    }

    const updatedUser = await prisma.user.update({
      where: { nomorInduk: req.user.nomorInduk },
      data: { email, telepon },
      select: {
        nomorInduk: true,
        nama: true,
        email: true,
        telepon: true,
        fotoUrl: true,
        role: { select: { nama: true } }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Profil berhasil diperbarui',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Change password (works for both dosen & mahasiswa)
router.post('/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Password lama dan baru wajib diisi' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi baru minimal 6 karakter' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi baru harus mengandung huruf besar' });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi baru harus mengandung huruf kecil' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi baru harus mengandung angka' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword)) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi baru harus mengandung simbol' });
    }

    const user = await prisma.user.findUnique({
      where: { nomorInduk: req.user.nomorInduk }
    });
    
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Kata sandi lama salah' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { nomorInduk: req.user.nomorInduk },
      data: { password: hashedPassword }
    });

    res.status(200).json({ status: 'success', message: 'Kata sandi berhasil diubah' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
