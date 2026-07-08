import { prisma } from "../../prismaClient.js";
export class PrismaModulAjarRepository {
async findAllByDosen(filterMatkul, filterTipe, nipDosen) {
    const where = {};
    if (filterMatkul && filterMatkul !== "Semua") {
        where.idMataKuliah = parseInt(filterMatkul);
    }
    if (filterTipe && filterTipe !== "Semua") {
        where.tipe_modul = filterTipe;
    }
    if (nipDosen) {
        where.mataKuliah = { nipDosen: nipDosen };
    }

    return await prisma.modulAjar.findMany({
        where,
        include: { mataKuliah: true },
        orderBy: { tanggal: 'desc' }
    });
}

async create(data) {
    const newModul = await prisma.modulAjar.create({
        data: {
            idMataKuliah: parseInt(data.idMataKuliah),
            judul: data.judul,
            tipe_modul: data.tipe_modul,
            deskripsi: data.deskripsi,
            url: data.url,
            fileUrl: data.fileUrl,
            ukuran: data.ukuran,
            diunduh: 0,
            canDownload: data.canDownload === 'true' || data.canDownload === true,
        }
    });

    // Kirim notifikasi ke semua mahasiswa yang terkait
    try {
        const relatedData = await prisma.nilai.findMany({
            where: { idMataKuliah: parseInt(data.idMataKuliah) },
            select: { nomorInduk: true }
        });
        const relatedNomorInduk = [...new Set(relatedData.map(r => r.nomorInduk))];
        if (relatedNomorInduk.length > 0) {
            const mahasiswas = await prisma.mahasiswa.findMany({
                where: { nim: { in: relatedNomorInduk } },
                select: { nim: true }
            });
            const relatedNIMs = mahasiswas.map(m => m.nim);
            if (relatedNIMs.length > 0) {
                const mataKuliah = await prisma.mataKuliah.findUnique({
                    where: { idMataKuliah: parseInt(data.idMataKuliah) }
                });
                await prisma.notifikasi.createMany({
                    data: relatedNIMs.map(nim => ({
                        nim,
                        judul: 'Materi Baru',
                        pesan: `Materi "${data.judul}" untuk mata kuliah ${mataKuliah?.namaMataKuliah || 'ini'} telah tersedia. Silakan dipelajari!`,
                        tipe: 'materi',
                        idRef: newModul.idModulAjar,
                        tipeRef: 'materi'
                    }))
                });
            }
        }
    } catch (e) {
        console.error('Gagal mengirim notifikasi materi:', e.message);
    }

    return newModul;
}

async update(id, data) {
    return await prisma.modulAjar.update({
        where: { idModulAjar: parseInt(id) },
        data: {
            ...data,
            idMataKuliah: data.idMataKuliah ? parseInt(data.idMataKuliah) : undefined
        }
    });
}

async delete(id) {
    return await prisma.modulAjar.delete({
        where: { idModulAjar: parseInt(id) }
    });
}

async incrementDownload(id) {
    return await prisma.modulAjar.update({
        where: { idModulAjar: parseInt(id) },
        data: { diunduh: { increment: 1 } }
        });
    }
}
