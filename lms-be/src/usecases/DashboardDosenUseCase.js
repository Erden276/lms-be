export class DashboardDosenUseCase {
  constructor(dosenRepository) {
    this.dosenRepository = dosenRepository;
  }

  async getDashboardData(nomorInduk) {
    const dosen = await this.dosenRepository.getDosenInfo(nomorInduk);
    if (!dosen) throw new Error("Data dosen tidak ditemukan");

    const nip = dosen.nip;

    // Ambil semua data secara paralel agar respons API lebih cepat
    const [materiList, totalMahasiswa, submissionStats] = await Promise.all([
      this.dosenRepository.getMateriList(nip),
      this.dosenRepository.getTotalMahasiswa(nip),
      this.dosenRepository.getSubmissionStats(nip)
    ]);

    // Format daftar materi
    const formattedMateri = (materiList || []).map(m => ({
      id: m.idModulAjar,
      judul: m.judul,
      tipe: m.tipe_modul || "Dokumen",
      mataKuliah: m.mataKuliah?.namaMataKuliah || "-",
      tanggal: m.tanggal ? new Date(m.tanggal).toLocaleDateString('id-ID') : "-",
      ukuran: m.ukuran || "-"
    }));

    return {
      lecturerName: dosen?.user?.nama || "Dosen",
      stats: {
        totalMahasiswa: totalMahasiswa || 0,
        tugasIndividu: submissionStats?.individu || 0,
        tugasKelompok: submissionStats?.kelompok || 0
      },
      daftarMateri: formattedMateri
    };
  }
}