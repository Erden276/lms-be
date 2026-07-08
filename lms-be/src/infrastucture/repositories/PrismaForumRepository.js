import { prisma } from "../../../lib/prisma.js";
export class PrismaForumRepository {

  /**
   * Mengambil daftar thread diskusi berdasarkan ID Mata Kuliah.
   * Digunakan oleh halaman forumDiskusi.jsx untuk merender INITIAL_THREADS.
   * @param {number} idMataKuliah 
   */
  async getThreadsByMataKuliah(idMataKuliah) {
    return await prisma.forumDiskusi.findMany({
      where: { 
        idMataKuliah: idMataKuliah 
      },
      // Kita menggunakan "include" bertingkat untuk mengambil data pembuat thread (User & Role)
      // sekaligus mengambil semua balasan/komentar di dalam thread tersebut beserta pembuatnya.
      include: {
        user: {
          select: {
            nama: true,
            role: {
              select: { nama: true } // Mengambil role (Misal: 'DOSEN', 'MAHASISWA')
            }
          }
        },
        komentarForum: {
          include: {
            user: {
              select: { nama: true }
            }
          },
          orderBy: { idKomentar: 'asc' } // Urutkan komentar dari yang paling lama ke terbaru
        },
        likes: true
      },
      orderBy: {
        idForumDiskusi: 'desc' // Urutkan thread dari yang terbaru (paling atas)
      }
    });
  }

  /**
   * Mengambil beberapa diskusi terbaru (Global) untuk ditampilkan di Dashboard.
   * Digunakan oleh halaman dashboard.jsx (Dashboard Mahasiswa).
   * @param {number} limit Batas jumlah diskusi yang diambil (misal: 3)
   */
  async getRecentThreads(limit = 3) {
    return await prisma.forumDiskusi.findMany({
      take: limit,
      include: {
        user: {
          select: { nama: true }
        }
      },
      orderBy: {
        idForumDiskusi: 'desc' // Ambil yang paling baru dibuat
      }
    });
  }

  /**
   * Menyimpan Thread / Diskusi baru ke dalam database.
   * Dipanggil saat pengguna menekan tombol "Kirim Diskusi" di UI.
   * @param {Object} data { idMataKuliah, nomorInduk, judul, isiForum }
   */
  async createThread(data) {
    return await prisma.forumDiskusi.create({
      data: {
        idMataKuliah: data.idMataKuliah,
        nomorInduk: data.nomorInduk, // ID si pembuat diskusi
        judul: data.judul,
        isiForum: data.isiForum,
        lampiran: data.lampiran || null
      },
      // Kembalikan juga data user-nya agar frontend bisa langsung merender nama pembuat
      include: {
        user: {
          select: { nama: true, role: { select: { nama: true } } }
        }
      }
    });
  }

  /**
   * Menyimpan balasan/komentar baru ke dalam sebuah thread diskusi.
   * @param {Object} data { idForum, nomorInduk, isiKomentar }
   */
  async addComment(data) {
    return await prisma.komentarForum.create({
      data: {
        idForum: data.idForum,
        nomorInduk: data.nomorInduk,
        isiKomentar: data.isiKomentar
      },
      include: {
        user: {
          select: { nama: true }
        }
      }
    });
  }

  async toggleLike(idForum, nomorInduk) {
    const existing = await prisma.likeForum.findUnique({
      where: {
        nomorInduk_idForum: {
          nomorInduk,
          idForum
        }
      }
    });

    if (existing) {
      await prisma.likeForum.delete({
        where: { idLike: existing.idLike }
      });
      return { action: 'unliked' };
    } else {
      await prisma.likeForum.create({
        data: { nomorInduk, idForum }
      });
      return { action: 'liked' };
    }
  }

  async updateThread(idForumDiskusi, data) {
    return await prisma.forumDiskusi.update({
      where: { idForumDiskusi },
      data: {
        judul: data.judul,
        isiForum: data.isiForum
      },
      include: {
        user: {
          select: { nama: true, role: { select: { nama: true } } }
        }
      }
    });
  }

  async deleteThread(idForumDiskusi) {
    return await prisma.forumDiskusi.delete({
      where: { idForumDiskusi }
    });
  }

  async updateComment(idKomentar, isiKomentar) {
    return await prisma.komentarForum.update({
      where: { idKomentar },
      data: { isiKomentar },
      include: {
        user: {
          select: { nama: true }
        }
      }
    });
  }

  async deleteComment(idKomentar) {
    return await prisma.komentarForum.delete({
      where: { idKomentar }
    });
  }

  async getCommentById(idKomentar) {
    return await prisma.komentarForum.findUnique({
      where: { idKomentar },
      select: {
        nomorInduk: true,
        user: { select: { nama: true } }
      }
    });
  }

  async getThreadById(idForumDiskusi) {
    return await prisma.forumDiskusi.findUnique({
      where: { idForumDiskusi },
      include: {
        user: {
          select: { nama: true, role: { select: { nama: true } } }
        }
      }
    });
  }
}