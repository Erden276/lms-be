import { prisma } from "../../../lib/prisma.js";
export class PrismaDashboardDosenRepository {
  async getDosenInfo(nomorInduk) {
    return await prisma.dosen.findUnique({
      where: { nip: nomorInduk },
      include: {
        user: true,
      }
    });
  }

  async getPendingTasks(nipDosen) {
    try {
      return await prisma.pengumpulanTugas.findMany({
        where: {
          tugas: {
            mataKuliah: {
              nipDosen: nipDosen
            }
          }
        },
        include: {
          tugas: { include: { mataKuliah: true } },
          mahasiswa: { include: { user: true } },
          kelompok: true
        },
        orderBy: { deadlineTugas: 'asc' },
        take: 5
      });
    } catch (error) {
      console.error("getPendingTasks error:", error.message);
      return [];
    }
  }

  async getSchedule(nipDosen) {
    try {
      return await prisma.mataKuliah.findMany({
        where: { nipDosen: nipDosen },
        take: 5
      });
    } catch (error) {
      console.error("getSchedule error:", error.message);
      return [];
    }
  }

  async getTotalMahasiswa(nipDosen) {
    try {
      const result = await prisma.nilai.groupBy({
        by: ['nomorInduk'],
        where: {
          mataKuliah: {
            nipDosen: nipDosen
          }
        }
      });
      return result.length;
    } catch (error) {
      console.error("getTotalMahasiswa error:", error.message);
      return 0;
    }
  }

  async getMateriList(nipDosen) {
    try {
      return await prisma.modulAjar.findMany({
        where: {
          mataKuliah: {
            nipDosen: nipDosen
          }
        },
        include: {
          mataKuliah: true
        },
        orderBy: { tanggal: 'desc' },
        take: 10
      });
    } catch (error) {
      console.error("getMateriList error:", error.message);
      return [];
    }
  }

  async getSubmissionStats(nipDosen) {
    try {
      const allSubmissions = await prisma.pengumpulanTugas.findMany({
        where: {
          tugas: {
            mataKuliah: {
              nipDosen: nipDosen
            }
          }
        },
        include: {
          kelompok: true
        }
      });

      const individu = allSubmissions.filter(s => !s.kelompok).length;
      const kelompok = allSubmissions.filter(s => s.kelompok).length;

      return { individu, kelompok };
    } catch (error) {
      console.error("getSubmissionStats error:", error.message);
      return { individu: 0, kelompok: 0 };
    }
  }
}