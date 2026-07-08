export class KelompokUseCase {
constructor(kelompokRepository) {
    this.kelompokRepository = kelompokRepository;
}

async getDaftarKelompok(idMataKuliah) {
    const kelompokData = await this.kelompokRepository.findByMataKuliah(idMataKuliah);
    
    return kelompokData.map(k => {
        const membersArr = [];
        const nilaiObj = {};
        k.anggota.forEach(ang => {
            membersArr.push({
                nim: ang.nim,
                name: ang.mahasiswa?.user?.nama || "Mahasiswa",
                nomorInduk: ang.nim
            });
            nilaiObj[ang.nim] = ang.nilaiTugas ? ang.nilaiTugas.toString() : "";
        });

        const lastSubmission = k.pengumpulan?.[0] || null;
        const totalAnggota = k.anggota.length;
        const nimSudahSubmit = new Set((k.pengumpulan || []).map(p => p.nim));
        const sudahSubmit = k.anggota.filter(a => nimSudahSubmit.has(a.nim)).length;
        const progress = totalAnggota > 0 ? Math.round((sudahSubmit / totalAnggota) * 100) : 0;
        return {
            id: k.idKelompok,
            name: k.namaKelompok,
            color: k.warna || "#4b53bc",
            task: k.tugasName || "–",
            progress,
            status: k.status,
            submitted: lastSubmission !== null,
            fileKumpulan: lastSubmission?.fileJawaban || null,
            judulKumpulan: lastSubmission?.judul || null,
            members: membersArr,
            nilai: nilaiObj
        };
    });
}

async createNewGroup(data) {
    if (!data.name || !data.idMataKuliah) throw new Error("Nama kelompok dan ID Mata Kuliah wajib diisi");
    return await this.kelompokRepository.createKelompok(data);
}

async addMember(idKelompok, nim) {
    return await this.kelompokRepository.addMember(idKelompok, nim);
}

async removeMember(idKelompok, nim) {
    return await this.kelompokRepository.removeMember(idKelompok, nim);
}

async saveGrades(idKelompok, grades) {
    return await this.kelompokRepository.updateGrades(idKelompok, grades);
}

async getAllKelompok(nipDosen) {
    const kelompokData = await this.kelompokRepository.findAll(nipDosen);
    
    return kelompokData.map(k => {
        const membersArr = [];
        const nilaiObj = {};
        k.anggota.forEach(ang => {
            membersArr.push({
                nim: ang.nim,
                name: ang.mahasiswa?.user?.nama || "Mahasiswa",
                nomorInduk: ang.nim
            });
            nilaiObj[ang.nim] = ang.nilaiTugas ? ang.nilaiTugas.toString() : "";
        });

        const lastSubmission = k.pengumpulan?.[0] || null;
        const totalAnggota = k.anggota.length;
        const nimSudahSubmit = new Set((k.pengumpulan || []).map(p => p.nim));
        const sudahSubmit = k.anggota.filter(a => nimSudahSubmit.has(a.nim)).length;
        const progress = totalAnggota > 0 ? Math.round((sudahSubmit / totalAnggota) * 100) : 0;
        return {
            id: k.idKelompok,
            name: k.namaKelompok,
            color: k.warna || "#4b53bc",
            task: k.tugasName || "–",
            progress,
            status: k.status,
            submitted: lastSubmission !== null,
            fileKumpulan: lastSubmission?.fileJawaban || null,
            judulKumpulan: lastSubmission?.judul || null,
            idMataKuliah: k.idMataKuliah,
            mataKuliahName: k.mataKuliah?.namaMataKuliah || "-",
            members: membersArr,
            nilai: nilaiObj
        };
    });
}

async getAllMahasiswa() {
    const data = await this.kelompokRepository.findAllMahasiswa();
    return data.map(m => ({
        nim: m.nim,
        name: m.user?.nama || "Mahasiswa",
        nomorInduk: m.user?.nomorInduk || m.nim
    }));
}

async deleteKelompok(idKelompok) {
    return await this.kelompokRepository.deleteKelompok(idKelompok);
}
}