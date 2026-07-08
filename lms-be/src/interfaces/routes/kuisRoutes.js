import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { prisma } from "../../../lib/prisma.js";

const router = express.Router();
router.use(authMiddleware);

/**
 * GET /api/kuis
 * Mengambil semua kuis (digunakan di dosenTugas untuk manajemen kuis)
 */
router.get("/", async (req, res) => {
  try {
    const { idMataKuliah } = req.query;
    const where = idMataKuliah ? { idMataKuliah: parseInt(idMataKuliah) } : {};

    const kuisList = await prisma.kuis.findMany({
      where,
      include: {
        mataKuliah: true,
        soal: {
          include: { pilihanJawaban: true },
        },
      },
      orderBy: { idKuis: "desc" },
    });

    res.json(
      kuisList.map((k) => ({
        id: k.idKuis,
        idMataKuliah: k.idMataKuliah,
        judul: k.judul,
        deadlineKuis: k.deadlineKuis,
        jumlahSoal: k.soal.length,
        mataKuliah: k.mataKuliah?.namaMataKuliah || "",
      })),
    );
  } catch (error) {
    console.error("GET /kuis error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/kuis/mata-kuliah/:idMataKuliah
 * Mengambil daftar kuis per mata kuliah (untuk mahasiswa)
 */
router.get("/mata-kuliah/:idMataKuliah", async (req, res) => {
  try {
    const { idMataKuliah } = req.params;

    const kuisList = await prisma.kuis.findMany({
      where: { idMataKuliah: parseInt(idMataKuliah) },
      include: {
        mataKuliah: true,
        _count: { select: { soal: true } },
      },
      orderBy: { idKuis: "desc" },
    });

    const kuisWithCounts = await Promise.all(
      kuisList.map(async (k) => {
        const jumlahPengerjaan = await prisma.jawabanKuis.count({
          where: { idKuis: k.idKuis }
        });
        
        const totalMahasiswa = await prisma.nilai.count({
          where: { idMataKuliah: k.idMataKuliah }
        });

        return {
          id: k.idKuis,
          idMataKuliah: k.idMataKuliah,
          judul: k.judul,
          deadlineKuis: k.deadlineKuis,
          jumlahSoal: k._count.soal,
          jumlahPengerjaan,
          totalMahasiswa,
          mataKuliah: k.mataKuliah?.namaMataKuliah || "",
        };
      })
    );

    res.json(kuisWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/kuis/:idKuis/detail
 * Mengambil detail kuis lengkap dengan soal dan jawaban benar (untuk dosen edit kuis)
 * HANYA untuk dosen yang punya akses ke kuis ini
 */
router.get("/:idKuis/detail", async (req, res) => {
  try {
    const { idKuis } = req.params;

    const kuis = await prisma.kuis.findUnique({
      where: { idKuis: parseInt(idKuis) },
      include: {
        mataKuliah: true,
        soal: {
          include: { pilihanJawaban: true },
          orderBy: { idSoal: "asc" },
        },
      },
    });

    if (!kuis) {
      return res.status(404).json({ error: "Kuis tidak ditemukan" });
    }

    // Format soal untuk keperluan edit dosen
    // Include jawaban benar dan semua pilihan jawaban
    const formattedSoal = (kuis.soal || []).map((s) => {
      const options = (s.pilihanJawaban || []).map((p) => p.teksJawaban);
      const correctIndex = ["A", "B", "C", "D"].indexOf(
        (s.kunciJawaban || "A").toUpperCase(),
      );
      return {
        id: s.idSoal,
        text: s.pertanyaan,
        options,
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
      };
    });

    res.json({
      id: kuis.idKuis,
      title: kuis.judul,
      idMataKuliah: kuis.idMataKuliah,
      matkulName: kuis.mataKuliah?.namaMataKuliah || "",
      deadline: kuis.deadlineKuis,
      soal: formattedSoal,
    });
  } catch (error) {
    console.error("GET /kuis/:idKuis/detail error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/kuis/:idKuis/soal
 * Mengambil soal kuis berdasarkan ID kuis (untuk mahasiswa mengerjakan kuis)
 * Format output sesuai kebutuhan frontend QuizKuis component
 */
router.get("/:idKuis/soal", async (req, res) => {
  try {
    const { idKuis } = req.params;

    const kuis = await prisma.kuis.findUnique({
      where: { idKuis: parseInt(idKuis) },
      include: {
        mataKuliah: true,
        soal: {
          include: { pilihanJawaban: true },
          orderBy: { idSoal: "asc" },
        },
      },
    });

    if (!kuis) {
      return res.status(404).json({ error: "Kuis tidak ditemukan" });
    }

    // Format soal sesuai kebutuhan frontend QuizKuis component
    // Component mengharapkan: { id, question, options[], correct (index 0-3) }
    const formattedSoal = (kuis.soal || []).map((s) => {
      const options = (s.pilihanJawaban || []).map((p) => p.teksJawaban);
      // kunciJawaban berisi huruf (A, B, C, D) -> convert ke index 0-3
      const correctIndex = ["A", "B", "C", "D"].indexOf(
        (s.kunciJawaban || "A").toUpperCase(),
      );
      return {
        id: s.idSoal,
        question: s.pertanyaan,
        options,
        correct: correctIndex >= 0 ? correctIndex : 0,
      };
    });

    res.json(formattedSoal);
  } catch (error) {
    console.error("GET /kuis/:idKuis/soal error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/kuis
 * Membuat kuis baru beserta soal-soalnya (dari dosen)
 * Body: { idMataKuliah, judul, deadlineKuis, soal: [{ pertanyaan, pilihanJawaban: [...], kunciJawaban }] }
 */
router.post("/", async (req, res) => {
  try {
    const { idMataKuliah, judul, deadlineKuis, soal } = req.body;

    if (!idMataKuliah || !judul) {
      return res
        .status(400)
        .json({ error: "idMataKuliah dan judul wajib diisi" });
    }

    const newKuis = await prisma.kuis.create({
      data: {
        idMataKuliah: parseInt(idMataKuliah),
        judul,
        deadlineKuis: deadlineKuis ? new Date(deadlineKuis) : null,
        soal:
          soal && soal.length > 0
            ? {
                create: soal.map((s) => ({
                  pertanyaan: s.pertanyaan || s.question,
                  kunciJawaban:
                    s.kunciJawaban ||
                    (typeof s.correct === "number"
                      ? ["A", "B", "C", "D"][s.correct]
                      : "A"),
                  skor: s.skor || 1,
                  pilihanJawaban: {
                    create: (s.pilihanJawaban || s.options || []).map(
                      (opt) => ({
                        teksJawaban:
                          typeof opt === "string" ? opt : opt.teksJawaban,
                      }),
                    ),
                  },
                })),
              }
            : undefined,
      },
      include: {
        soal: { include: { pilihanJawaban: true } },
        mataKuliah: true,
      },
    });

    try {
      const relatedData = await prisma.nilai.findMany({
        where: { idMataKuliah: parseInt(idMataKuliah) },
        select: { nomorInduk: true },
      });
      const relatedNomorInduk = [
        ...new Set(relatedData.map((r) => r.nomorInduk)),
      ];
      if (relatedNomorInduk.length > 0) {
        const mahasiswas = await prisma.mahasiswa.findMany({
          where: { nim: { in: relatedNomorInduk } },
          select: { nim: true },
        });
        const relatedNIMs = mahasiswas.map((m) => m.nim);
        if (relatedNIMs.length > 0) {
          const mataKuliahData = await prisma.mataKuliah.findUnique({
            where: { idMataKuliah: parseInt(idMataKuliah) },
          });
          await prisma.notifikasi.createMany({
            data: relatedNIMs.map((nim) => ({
              nim,
              judul: "Kuis Baru",
              pesan: `Kuis "${judul}" untuk mata kuliah ${mataKuliahData?.namaMataKuliah || "ini"} telah tersedia. Ayo kerjakan sekarang!`,
              tipe: "kuis",
              idRef: newKuis.idKuis,
              tipeRef: "kuis",
            })),
          });
        }
      }
    } catch (e) {
      console.error("Gagal mengirim notifikasi kuis:", e.message);
    }

    res.status(201).json({ message: "Kuis berhasil dibuat", data: newKuis });
  } catch (error) {
    console.error("POST /kuis error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/kuis/:idKuis
 * Update kuis (hapus soal lama & buat soal baru)
 */
router.put("/:idKuis", async (req, res) => {
  try {
    const { idKuis } = req.params;
    const { judul, deadlineKuis, soal, idMataKuliah } = req.body;

    // Hapus soal lama jika ada soal baru
    if (soal) {
      const soalLama = await prisma.soal.findMany({
        where: { idKuis: parseInt(idKuis) },
      });
      for (const s of soalLama) {
        await prisma.pilihanJawaban.deleteMany({ where: { idSoal: s.idSoal } });
      }
      await prisma.soal.deleteMany({ where: { idKuis: parseInt(idKuis) } });
    }

    const updated = await prisma.kuis.update({
      where: { idKuis: parseInt(idKuis) },
      data: {
        idMataKuliah: idMataKuliah ? parseInt(idMataKuliah) : undefined,
        judul: judul || undefined,
        deadlineKuis: deadlineKuis ? new Date(deadlineKuis) : undefined,
        soal:
          soal && soal.length > 0
            ? {
                create: soal.map((s) => ({
                  pertanyaan: s.pertanyaan || s.question,
                  kunciJawaban:
                    s.kunciJawaban ||
                    (typeof s.correct === "number"
                      ? ["A", "B", "C", "D"][s.correct]
                      : "A"),
                  skor: s.skor || 1,
                  pilihanJawaban: {
                    create: (s.pilihanJawaban || s.options || []).map(
                      (opt) => ({
                        teksJawaban:
                          typeof opt === "string" ? opt : opt.teksJawaban,
                      }),
                    ),
                  },
                })),
              }
            : undefined,
      },
      include: { soal: { include: { pilihanJawaban: true } } },
    });

    res.json({ message: "Kuis berhasil diperbarui", data: updated });
  } catch (error) {
    console.error("PUT /kuis/:idKuis error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/kuis/:idKuis
 */
router.delete("/:idKuis", async (req, res) => {
  try {
    const { idKuis } = req.params;
    // Hapus pilihan jawaban dulu, lalu soal, lalu kuis
    const soalList = await prisma.soal.findMany({
      where: { idKuis: parseInt(idKuis) },
    });
    for (const s of soalList) {
      await prisma.pilihanJawaban.deleteMany({ where: { idSoal: s.idSoal } });
    }
    await prisma.soal.deleteMany({ where: { idKuis: parseInt(idKuis) } });
    await prisma.kuis.delete({ where: { idKuis: parseInt(idKuis) } });
    res.json({ message: "Kuis berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/kuis/:idKuis/submit
 * Mahasiswa submit jawaban kuis & hitung skor
 */
router.post("/:idKuis/submit", async (req, res) => {
  try {
    const { idKuis } = req.params;
    const { answers } = req.body;
    const user = req.user;

    const kuis = await prisma.kuis.findUnique({
      where: { idKuis: parseInt(idKuis) },
      include: {
        soal: {
          include: { pilihanJawaban: true },
          orderBy: { idSoal: "asc" },
        },
      },
    });

    if (!kuis) return res.status(404).json({ error: "Kuis tidak ditemukan" });

    // Cek apakah sudah pernah submit
    const sudahSubmit = await prisma.jawabanKuis.findUnique({
      where: { idKuis_nim: { idKuis: parseInt(idKuis), nim: user.nomorInduk } }
    });
    if (sudahSubmit) {
      return res.status(400).json({ error: "Anda sudah mengerjakan kuis ini", sudahDikerjakan: true });
    }

    // Hitung skor
    let correct = 0;
    kuis.soal.forEach((soal, idx) => {
      const correctIdx = ["A", "B", "C", "D"].indexOf((soal.kunciJawaban || "A").toUpperCase());
      if (answers[idx] === correctIdx) correct++;
    });
    const score = kuis.soal.length > 0 ? Math.round((correct / kuis.soal.length) * 100) : 0;

    // Simpan ke JawabanKuis
    await prisma.jawabanKuis.create({
      data: {
        idKuis: parseInt(idKuis),
        nim: user.nomorInduk,
        skor: score,
        jawaban: JSON.stringify(answers),
        tanggalKerja: new Date(),
      },
    });

    // Update/Insert ke Nilai (nilaiKuis)
    const existingNilai = await prisma.nilai.findFirst({
      where: { nomorInduk: user.nomorInduk, idMataKuliah: kuis.idMataKuliah }
    });
    if (existingNilai) {
      await prisma.nilai.update({
        where: { idNilai: existingNilai.idNilai },
        data: { nilaiKuis: score }
      });
    } else {
      await prisma.nilai.create({
        data: {
          nomorInduk: user.nomorInduk,
          idMataKuliah: kuis.idMataKuliah,
          nilaiKuis: score,
        },
      });
    }

    res.json({ message: "Kuis berhasil dikumpulkan", score, correct, total: kuis.soal.length });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/kuis/:idKuis/status
 * Cek apakah mahasiswa sudah mengerjakan kuis ini
 */
router.get("/:idKuis/status", async (req, res) => {
  try {
    const { idKuis } = req.params;
    const user = req.user;

    const jawaban = await prisma.jawabanKuis.findUnique({
      where: { idKuis_nim: { idKuis: parseInt(idKuis), nim: user.nomorInduk } }
    });

    if (jawaban) {
      const answers = jawaban.jawaban ? JSON.parse(jawaban.jawaban) : [];
      res.json({ sudahDikerjakan: true, skor: jawaban.skor, tanggalKerja: jawaban.tanggalKerja, answers });
    } else {
      res.json({ sudahDikerjakan: false, skor: null, tanggalKerja: null, answers: [] });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/kuis/:idKuis/hasil
 * Ambil hasil kuis mahasiswa (jawaban + detail soal + jawaban benar)
 */
router.get("/:idKuis/hasil", async (req, res) => {
  try {
    const { idKuis } = req.params;
    const user = req.user;

    const jawaban = await prisma.jawabanKuis.findUnique({
      where: { idKuis_nim: { idKuis: parseInt(idKuis), nim: user.nomorInduk } }
    });

    if (!jawaban) {
      return res.status(404).json({ error: "Anda belum mengerjakan kuis ini" });
    }

    const kuis = await prisma.kuis.findUnique({
      where: { idKuis: parseInt(idKuis) },
      include: {
        soal: {
          include: { pilihanJawaban: true },
          orderBy: { idSoal: "asc" },
        },
      },
    });

    res.json({
      skor: jawaban.skor,
      tanggalKerja: jawaban.tanggalKerja,
      answers: jawaban.jawaban ? JSON.parse(jawaban.jawaban) : [],
      soal: kuis.soal.map(s => {
        const correctIdx = ["A", "B", "C", "D"].indexOf((s.kunciJawaban || "A").toUpperCase());
        return {
          id: s.idSoal,
          pertanyaan: s.pertanyaan,
          options: s.pilihanJawaban.map(p => p.teksJawaban),
          jawabanBenar: correctIdx,
        };
      }),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
