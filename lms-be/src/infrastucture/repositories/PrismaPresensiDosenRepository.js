import { prisma } from "../../../lib/prisma.js";

// Helper untuk mendapatkan start/end of day dalam UTC
function getStartOfDayUTC() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    return d;
}

function getEndOfDayUTC() {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0));
    return d;
}

export class PrismaPresensiDosenRepository {
    async getMahasiswaByMatkul(idMataKuliah) {
        
        const mataKuliah = await prisma.mataKuliah.findUnique({
            where: { idMataKuliah: parseInt(idMataKuliah) },
            include: {
                nilai: { include: { user: true } },
                presensi: { include: { mahasiswa: { include: { user: true } } } },
                kelompok: { include: { anggota: { include: { mahasiswa: { include: { user: true } } } } } },
                tugas: { include: { mahasiswa: { include: { user: true } } } }
            }
        });

        const mahasiswaMap = new Map();
        const nomorIndukSet = new Set();
        
        mataKuliah?.nilai?.forEach(n => { if (n.nomorInduk) nomorIndukSet.add(n.nomorInduk); });
        mataKuliah?.presensi?.forEach(p => { if (p.mahasiswa) mahasiswaMap.set(p.mahasiswa.nim, p.mahasiswa); });
        mataKuliah?.kelompok?.forEach(k => { k.anggota?.forEach(a => { if (a.mahasiswa) mahasiswaMap.set(a.mahasiswa.nim, a.mahasiswa); }); });
        mataKuliah?.tugas?.forEach(t => { if (t.mahasiswa) mahasiswaMap.set(t.mahasiswa.nim, t.mahasiswa); });

        if (nomorIndukSet.size > 0) {
            const mahasiswaFromNilai = await prisma.mahasiswa.findMany({
                where: { nim: { in: Array.from(nomorIndukSet) } },
                include: { user: true }
            });
            mahasiswaFromNilai.forEach(m => mahasiswaMap.set(m.nim, m));
        }

        if (mahasiswaMap.size === 0) {
            const allMahasiswa = await prisma.mahasiswa.findMany({ include: { user: true } });
            allMahasiswa.forEach(m => mahasiswaMap.set(m.nim, m));
        }

        const mahasiswaList = Array.from(mahasiswaMap.values());
        const today = getStartOfDayUTC();
        const tomorrow = getEndOfDayUTC();
        
        const result = await Promise.all(mahasiswaList.map(async (mhs, index) => {
            const presensiTerbaru = await prisma.presensi.findFirst({
                where: { nim: mhs.nim, idMataKuliah: parseInt(idMataKuliah), tanggalPertemuan: { gte: today, lt: tomorrow } },
                orderBy: { tanggalPertemuan: 'desc' }
            });

            const nama = mhs.user?.nama || 'Unknown';
            const initials = nama.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            const statusUI = presensiTerbaru?.statusKehadiran === "Alpha" ? "Alpa" : (presensiTerbaru?.statusKehadiran || "Alpa");
            const colors = ["#8991fe", "#f59e0b", "#10b981", "#ec4899", "#6366f1", "#2f9696"];
            
            return {
                id: presensiTerbaru?.idPresensi || `mhs-${mhs.nim}`,
                nim: mhs.nim, name: nama, initials, color: colors[index % colors.length], status: statusUI,
                tanggalPertemuan: presensiTerbaru?.tanggalPertemuan || null,
                waktuPresensi: presensiTerbaru?.waktuPresensi || null
            };
        }));

        return result.sort((a, b) => a.nim.localeCompare(b.nim));
    }

    async updateStatusPresensi(idPresensi, statusKehadiran) {
        const statusDB = statusKehadiran === "Alpa" ? "Alpha" : statusKehadiran;
        return await prisma.presensi.update({
            where: { idPresensi: parseInt(idPresensi) },
            data: { statusKehadiran: statusDB, waktuPresensi: new Date() }
        });
    }

    async updateStatusByNim(nim, idMataKuliah, statusKehadiran) {
        const statusDB = statusKehadiran === "Alpa" ? "Alpha" : statusKehadiran;
        const today = getStartOfDayUTC();
        const tomorrow = getEndOfDayUTC();

        let presensiHariIni = await prisma.presensi.findFirst({
            where: { nim, idMataKuliah: parseInt(idMataKuliah), tanggalPertemuan: { gte: today, lt: tomorrow } }
        });

        if (presensiHariIni) {
            return await prisma.presensi.update({
                where: { idPresensi: presensiHariIni.idPresensi },
                data: { statusKehadiran: statusDB, waktuPresensi: new Date() }
            });
        } else {
            return await prisma.presensi.create({
                data: { nim, idMataKuliah: parseInt(idMataKuliah), tanggalPertemuan: today, waktuPresensi: new Date(), statusKehadiran: statusDB }
            });
        }
    }

    async getAllPresensiDates(idMataKuliah) {
        const presensiList = await prisma.presensi.findMany({
            where: { idMataKuliah: parseInt(idMataKuliah) },
            select: { tanggalPertemuan: true },
            distinct: ['tanggalPertemuan'],
            orderBy: { tanggalPertemuan: 'desc' }
        });
        return presensiList.map(p => p.tanggalPertemuan);
    }

    async getDaftarHadirByTanggal(idMataKuliah, tanggal) {
        const targetDate = new Date(tanggal);
        const startOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate() + 1, 0, 0, 0, 0));
        
        const allMahasiswa = await prisma.mahasiswa.findMany({ include: { user: true } });
        const presensiList = await prisma.presensi.findMany({
            where: { idMataKuliah: parseInt(idMataKuliah), tanggalPertemuan: { gte: startOfDay, lt: endOfDay } }
        });
        // Untuk setiap NIM, ambil yang statusnya "Hadir" jika ada, kalau tidak ambil yang terbaru
        const presensiMap = new Map();
        presensiList.forEach(p => {
            const existing = presensiMap.get(p.nim);
            if (!existing) {
                presensiMap.set(p.nim, p);
            } else if (p.statusKehadiran === 'Hadir') {
                // Prioritaskan yang Hadir
                presensiMap.set(p.nim, p);
            } else if (existing.statusKehadiran !== 'Hadir' && p.waktuPresensi > existing.waktuPresensi) {
                // Kalau keduanya bukan Hadir, ambil yang paling baru
                presensiMap.set(p.nim, p);
            }
        });
        
        const colors = ["#8991fe", "#f59e0b", "#10b981", "#ec4899", "#6366f1", "#2f9696"];
        
        return allMahasiswa.map((mhs, index) => {
            const presensi = presensiMap.get(mhs.nim);
            const nama = mhs.user?.nama || 'Unknown';
            const initials = nama.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            const statusUI = presensi?.statusKehadiran === "Alpha" ? "Alpa" : (presensi?.statusKehadiran || "Alpa");
            
            return {
                id: presensi?.idPresensi || `mhs-${mhs.nim}`,
                nim: mhs.nim, name: nama, initials, color: colors[index % colors.length], status: statusUI,
                tanggalPertemuan: presensi?.tanggalPertemuan || null,
                waktuPresensi: presensi?.waktuPresensi || null
            };
        });
    }
}
