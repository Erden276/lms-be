import { prisma } from '../../../lib/prisma.js';

// Helper untuk mendapatkan start/end of day dalam UTC
function getStartOfDayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
}

function getEndOfDayUTC() {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0));
}

export class PrismaPresensiRepository {
  
  /**
   * Mengambil daftar hadir mahasiswa untuk ditampilkan di Dashboard Dosen (presensi.jsx)
   * Mengembalikan daftar mahasiswa UNIK yang terdaftar di mata kuliah tersebut
   * @param {number} idMataKuliah 
   */
  async getDaftarHadirMahasiswa(idMataKuliah) {
    // 1. Ambil daftar mahasiswa UNIK yang terdaftar di mata kuliah ini
    // dari berbagai sumber: nilai, presensi, kelompok, tugas
    const mataKuliah = await prisma.mataKuliah.findUnique({
      where: { idMataKuliah: idMataKuliah },
      include: {
        nilai: {
          include: {
            mahasiswa: {
              include: {
                user: { select: { nama: true } }
              }
            }
          }
        },
        presensi: {
          include: {
            mahasiswa: {
              include: {
                user: { select: { nama: true } }
              }
            }
          }
        },
        kelompok: {
          include: {
            anggota: {
              include: {
                mahasiswa: {
                  include: {
                    user: { select: { nama: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    // 2. Kumpulkan semua mahasiswa unik dalam Map (key: nim)
    const mahasiswaMap = new Map();
    
    // Dari nilai
    mataKuliah?.nilai?.forEach(n => {
      if (n.mahasiswa) {
        mahasiswaMap.set(n.mahasiswa.nim, n.mahasiswa);
      }
    });
    
    // Dari presensi
    mataKuliah?.presensi?.forEach(p => {
      if (p.mahasiswa) {
        mahasiswaMap.set(p.mahasiswa.nim, p.mahasiswa);
      }
    });
    
    // Dari kelompok
    mataKuliah?.kelompok?.forEach(k => {
      k.anggota?.forEach(a => {
        if (a.mahasiswa) {
          mahasiswaMap.set(a.mahasiswa.nim, a.mahasiswa);
        }
      });
    });

    // 3. Jika belum ada mahasiswa terdaftar, ambil semua mahasiswa dari sistem
    // sebagai fallback (untuk presensi pertama kali)
    if (mahasiswaMap.size === 0) {
      const allMahasiswa = await prisma.mahasiswa.findMany({
        include: { user: { select: { nama: true } } }
      });
      allMahasiswa.forEach(m => {
        mahasiswaMap.set(m.nim, m);
      });
    }

    // 4. Ambil presensi terbaru untuk setiap mahasiswa di mata kuliah ini
    const today = getStartOfDayUTC();
    const tomorrow = getEndOfDayUTC();

    const mahasiswaList = Array.from(mahasiswaMap.values());
    
    // 4. Untuk setiap mahasiswa, ambil presensi terbaru (hari ini atau terakhir)
    const result = await Promise.all(
      mahasiswaList.map(async (mhs, index) => {
        // Cari presensi untuk HARI INI (sama seperti logic scan QR)
        const presensiTerbaru = await prisma.presensi.findFirst({
          where: {
            nim: mhs.nim,
            idMataKuliah: idMataKuliah,
            tanggalPertemuan: {
              gte: today,
              lt: tomorrow
            }
          },
          orderBy: { tanggalPertemuan: 'desc' }
        });

        // Membuat inisial nama (Misal: "Budi Santoso" -> "BU")
        const initials = mhs.user?.nama?.substring(0, 2).toUpperCase() || 'NA';
        
        // Warna acak untuk avatar frontend
        const colors = ["#8991fe", "#f59e0b", "#10b981", "#ec4899", "#6366f1"];
        const randomColor = colors[index % colors.length];

        return {
          id: presensiTerbaru?.idPresensi || `${mhs.nim}-${Date.now()}`,
          nim: mhs.nim,
          name: mhs.user?.nama || 'Unknown',
          initials: initials,
          color: randomColor,
          status: presensiTerbaru?.statusKehadiran || 'Alpa',
          tanggalPertemuan: presensiTerbaru?.tanggalPertemuan || null,
          waktuPresensi: presensiTerbaru?.waktuPresensi || null
        };
      })
    );

    // 5. Urutkan berdasarkan NIM
    return result.sort((a, b) => a.nim.localeCompare(b.nim));
  }

  /**
   * Mengubah status absensi mahasiswa secara manual (Dosen mengubah lewat UI)
   * @param {number} idPresensi 
   * @param {string} statusKehadiran ('Hadir', 'Izin', 'Sakit', 'Alpha')
   */
  async updateStatus(idPresensi, statusKehadiran) {
    return await prisma.presensi.update({
      where: { idPresensi: idPresensi },
      data: { statusKehadiran: statusKehadiran }
    });
  }

  /**
   * Update atau buat presensi untuk mahasiswa berdasarkan NIM dan mata kuliah
   * Jika belum ada presensi hari ini, buat baru
   * @param {string} nim 
   * @param {number} idMataKuliah 
   * @param {string} statusKehadiran 
   */
  async updateStatusByNim(nim, idMataKuliah, statusKehadiran) {
    // Cari presensi hari ini untuk mahasiswa ini (pakai UTC helper)
    const today = getStartOfDayUTC();
    const tomorrow = getEndOfDayUTC();

    let presensiHariIni = await prisma.presensi.findFirst({
      where: {
        nim: nim,
        idMataKuliah: idMataKuliah,
        tanggalPertemuan: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (presensiHariIni) {
      // Update presensi yang sudah ada
      return await prisma.presensi.update({
        where: { idPresensi: presensiHariIni.idPresensi },
        data: { 
          statusKehadiran: statusKehadiran,
          waktuPresensi: new Date()
        }
      });
    } else {
      // Buat presensi baru untuk hari ini dengan tanggal UTC yang konsisten
      return await prisma.presensi.create({
        data: {
          nim: nim,
          idMataKuliah: idMataKuliah,
          tanggalPertemuan: today,  // Pakai today UTC yang sama
          waktuPresensi: new Date(),
          statusKehadiran: statusKehadiran
        }
      });
    }
  }

  /**
   * Menandai status kehadiran menjadi "Hadir" saat Mahasiswa melakukan Scan QR Code
   * @param {string} nim 
   * @param {number} idMataKuliah 
   */
  async markAsHadir(nim, idMataKuliah, tokenScan) {
    // Validasi nim ada di tabel mahasiswa
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim: nim }
    });

    if (!mahasiswa) {
      throw new Error('Data mahasiswa tidak ditemukan. Silakan login ulang.');
    }

    // Cari record presensi HARI INI untuk mahasiswa ini di mata kuliah ini
    const today = getStartOfDayUTC();
    const tomorrow = getEndOfDayUTC();

    let presensiSesiIni = await prisma.presensi.findFirst({
      where: {
        nim: nim,
        idMataKuliah: idMataKuliah,
        tanggalPertemuan: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        tanggalPertemuan: 'desc'
      }
    });
    
    // Jika belum ada record sama sekali, buat baru
    if (!presensiSesiIni) {
      presensiSesiIni = await prisma.presensi.create({
        data: {
          nim: nim,
          idMataKuliah: idMataKuliah,
          tanggalPertemuan: today,  // Pakai today UTC yang sama
          waktuPresensi: new Date(),
          statusKehadiran: 'Hadir'
        }
      });
      return { message: 'Absen berhasil!', presensi: presensiSesiIni };
    }

    // Update status menjadi Hadir dengan waktu saat ini
    const updated = await prisma.presensi.update({
      where: { idPresensi: presensiSesiIni.idPresensi },
      data: { 
        statusKehadiran: 'Hadir',
        waktuPresensi: new Date()
      }
    });
    return updated;
  }

  async getRiwayatKehadiran(nim, idMataKuliah) {
    return await prisma.presensi.findMany({
      where: { nim, idMataKuliah },
      orderBy: { tanggalPertemuan: 'desc' }
    });
  }

  async buatSesiPresensi(idMataKuliah) {
    const semuaMahasiswa = await prisma.mahasiswa.findMany();
    
    if (semuaMahasiswa.length === 0) {
      throw new Error('Tidak ada mahasiswa yang terdaftar');
    }

    const today = getStartOfDayUTC();
    const tomorrow = getEndOfDayUTC();

    const existingSession = await prisma.presensi.findFirst({
      where: {
        idMataKuliah: idMataKuliah,
        tanggalPertemuan: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingSession) {
      return { message: 'Sesi sudah ada untuk hari ini' };
    }

    const createMany = semuaMahasiswa.map(m => ({
      nim: m.nim,
      idMataKuliah: idMataKuliah,
      tanggalPertemuan: today,
      statusKehadiran: 'Alpha'
    }));

    await prisma.presensi.createMany({
      data: createMany
    });

    return { message: 'Sesi presensi berhasil dibuat', count: semuaMahasiswa.length };
  }
}