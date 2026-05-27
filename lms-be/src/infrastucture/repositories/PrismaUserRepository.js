import { prisma } from "../../prismaClient.js";

export class PrismaUserRepository {
  async create(user) {
    return await prisma.user.create({ data: user });
  }

  // Menghitung jumlah user berdasarkan role untuk menentukan urutan ID
  async countByRoleId(roleId) {
    return await prisma.user.count({
      where: { roleId }
    });
  }

  // Menghitung jumlah mahasiswa untuk menentukan urutan NIM
  async countMahasiswa() {
    return await prisma.mahasiswa.count();
  }

  async createWithProfile(userData, profileData, roleType) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Buat User utama
        const user = await tx.user.create({ data: userData });

        // 2. Buat Profil berdasarkan Role
        if (roleType === 'MAHASISWA') {
          await tx.mahasiswa.create({
            data: {
              nim: user.nomorInduk
            }
          });
        } else if (roleType === 'DOSEN') {
          await tx.dosen.create({
            data: {
              nip: user.nomorInduk
            }
          });
        }

        return user;
      });
    } catch (error) {
      // Handle specific database errors
      if (error.code === 'P2002') {
        // Unique constraint violation
        const field = error.meta?.target?.[0] || 'field';
        throw new Error(`${field} sudah terdaftar dalam sistem`);
      }
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw new Error("Role atau data referensi tidak ditemukan");
      }
      throw error;
    }
  }

  async findRoleById(roleId) {
    return await prisma.role.findUnique({ where: { id: roleId } });
  }

  async findAllRoles() {
    return await prisma.role.findMany();
  }

  async findAll() {
    return await prisma.user.findMany();
  }

  async findByNomorInduk(nomorInduk) {
    return await prisma.user.findUnique({
      where: { nomorInduk },
      include: { role: true, dosen: true, mahasiswa: true }
    });
  }

  async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
      include: { role: true, dosen: true, mahasiswa: true }
    });
  }

  async findByNim(nim) {
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { nim },
      include: {
        user: {
          include: { role: true }
        }
      }
    });
    return mahasiswa ? mahasiswa.user : null;
  }

  async findByNip(nip) {
    const dosen = await prisma.dosen.findUnique({
      where: { nip },
      include: {
        user: {
          include: { role: true }
        }
      }
    });
    return dosen ? dosen.user : null;
  }

  async update(nomorInduk, data) {
    return await prisma.user.update({
      where: { nomorInduk },
      data: data,
      include: {
        role: true, // Kembalikan info role setelah update
        mahasiswa: true,
        dosen: true
      }
    });
  }

  async delete(nomorInduk) {
    return await prisma.user.delete({
      where: { nomorInduk }
    });
  }
}