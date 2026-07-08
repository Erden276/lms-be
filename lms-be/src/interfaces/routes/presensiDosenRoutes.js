import express from 'express';
import { PrismaPresensiDosenRepository } from '../../infrastucture/repositories/PrismaPresensiDosenRepository.js';
import { PresensiDosenUseCase } from '../../usecases/PresensiDosenUseCase.js';
import { PresensiDosenController } from '../controllers/PresensiDosenController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { prisma } from '../../../lib/prisma.js';

// Helper untuk normalisasi tanggal ke UTC
function normalizeDateToUTC(date) {
    const d = new Date(date);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

const router = express.Router();

// Dependency Injection
const repository = new PrismaPresensiDosenRepository();
const usecase = new PresensiDosenUseCase(repository);
const controller = new PresensiDosenController(usecase);

// Semua rute presensi dilindungi middleware
router.use(authMiddleware);

router.get('/matkul/:idMataKuliah/daftar-hadir', (req, res) => controller.getDaftarHadir(req, res));
router.put('/:idPresensi/status', (req, res) => controller.updateStatus(req, res));
router.put('/nim/:nim/matkul/:idMataKuliah/status', (req, res) => controller.updateStatusByNim(req, res));

/**
 * POST /api/dosen/presensi/matkul/:idMataKuliah/generate
 * Dosen membuat sesi presensi baru untuk tanggal tertentu
 */
router.post('/matkul/:idMataKuliah/generate', async (req, res) => {
  try {
    const { idMataKuliah } = req.params;
    const { tanggal } = req.body;
    
    // Use provided date or current timestamp
    let targetDate = new Date();
    if (tanggal) {
      // Create date and set to noon UTC to prevent timezone shifts when saving
      targetDate = new Date(`${tanggal}T12:00:00.000Z`);
    } else {
      targetDate.setUTCHours(12, 0, 0, 0);
    }
    
    // Ambil SEMUA mahasiswa yang ada di sistem
    const mahasiswaList = await prisma.mahasiswa.findMany();

    if (mahasiswaList.length === 0) {
      return res.status(400).json({ error: 'Tidak ada mahasiswa terdaftar' });
    }

    // Generate token QR unik
    const token = `LeMaS-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Cek apakah sudah ada sesi untuk tanggal yang sama (gunakan UTC)
    const targetDateNormalized = normalizeDateToUTC(targetDate);
    const startOfDay = new Date(Date.UTC(targetDateNormalized.getUTCFullYear(), targetDateNormalized.getUTCMonth(), targetDateNormalized.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(targetDateNormalized.getUTCFullYear(), targetDateNormalized.getUTCMonth(), targetDateNormalized.getUTCDate() + 1, 0, 0, 0, 0));

    const existingSession = await prisma.presensi.findFirst({
      where: {
        idMataKuliah: parseInt(idMataKuliah),
        tanggalPertemuan: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    if (existingSession) {
      // Sesi sudah ada, generate token baru dan return success
      const newToken = `LeMaS-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      return res.status(200).json({
        message: `Sesi presensi untuk tanggal ${targetDate.toISOString().split('T')[0]} sudah ada`,
        token: newToken,
        tanggal: targetDate.toISOString(),
        existing: true
      });
    }

    // Buat sesi presensi untuk setiap mahasiswa pada tanggal tersebut
    // Cek dulu per mahasiswa - hanya buat kalau belum ada untuk tanggal ini
    const sessionTime = normalizeDateToUTC(targetDate);
    
    const createdRecords = await Promise.allSettled(
      mahasiswaList.map(async m => {
        const existing = await prisma.presensi.findFirst({
          where: {
            nim: m.nim,
            idMataKuliah: parseInt(idMataKuliah),
            tanggalPertemuan: { gte: startOfDay, lt: endOfDay }
          }
        });
        if (existing) return existing; // Sudah ada, skip
        return prisma.presensi.create({
          data: {
            nim: m.nim,
            idMataKuliah: parseInt(idMataKuliah),
            statusKehadiran: 'Alpha',
            tanggalPertemuan: sessionTime
          }
        });
      })
    );

    const successCount = createdRecords.filter(r => r.status === 'fulfilled').length;

    res.status(201).json({
      message: `Sesi presensi berhasil dibuat untuk ${successCount} mahasiswa`,
      token,
      tanggal: sessionTime.toISOString()
    });
  } catch (error) {
    console.error('Generate presensi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get daftar hadir untuk tanggal tertentu
router.get('/daftar-hadir/:idMataKuliah/:tanggal', authMiddleware, async (req, res) => {
  try {
    const { idMataKuliah, tanggal } = req.params;
    const data = await repository.getDaftarHadirByTanggal(idMataKuliah, tanggal);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get daftar hadir by tanggal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get semua tanggal presensi yang tersedia
router.get('/dates/:idMataKuliah', authMiddleware, async (req, res) => {
  try {
    const { idMataKuliah } = req.params;
    const dates = await repository.getAllPresensiDates(idMataKuliah);
    res.status(200).json({ success: true, dates });
  } catch (error) {
    console.error('Get all dates error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;