import { useState } from "react";
import "./faq.css";

const FAQ_DATA = {
  umum: {
    label: "Umum",
    icon: "info",
    items: [
      {
        icon: "school",
        question: "Apa itu LeMaS (Learning Management System)?",
        answer: (
          <>
            <p>
              LeMaS adalah platform pengelolaan pembelajaran digital yang digunakan oleh dosen dan mahasiswa untuk
              mendukung kegiatan akademik, meliputi:
            </p>
            <ul>
              <li>Pengelolaan materi perkuliahan</li>
              <li>Pemberian dan pengumpulan tugas</li>
              <li>Presensi digital berbasis QR Code</li>
              <li>Forum diskusi kelas</li>
              <li>Penilaian dan rekap nilai</li>
            </ul>
          </>
        ),
      },
      {
        icon: "person",
        question: "Siapa saja yang bisa menggunakan LeMaS?",
        answer: (
          <p>
            LeMaS dapat digunakan oleh <strong>Dosen</strong> dan <strong>Mahasiswa</strong> yang terdaftar di
            sistem akademik kampus. Akun dibuat oleh administrator dan tidak dapat didaftarkan sendiri.
          </p>
        ),
      },
      {
        icon: "lock",
        question: "Bagaimana cara login ke LeMaS?",
        answer: (
          <>
            <p>Untuk login ke LeMaS:</p>
            <ol>
              <li>Buka halaman login LeMaS.</li>
              <li>Pilih peran: <strong>Mahasiswa</strong> atau <strong>Dosen</strong>.</li>
              <li>Masukkan <strong>Nomor Induk</strong> (NIM untuk mahasiswa / NIP/ID untuk dosen).</li>
              <li>Masukkan <strong>Kata Sandi</strong> yang diberikan oleh administrator.</li>
              <li>Klik tombol <strong>Masuk</strong>.</li>
            </ol>
          </>
        ),
      },
      {
        icon: "manage_accounts",
        question: "Bagaimana cara memperbarui Profil dan Foto/Avatar saya?",
        answer: (
          <>
            <p>Untuk memperbarui data diri dan mengganti foto profil:</p>
            <ol>
              <li>Buka menu <strong>Profil</strong> dari sidebar sebelah kiri.</li>
              <li>Klik tab <strong>Edit Profil</strong>.</li>
              <li>Untuk mengganti foto, klik tombol <strong>Unggah Foto</strong> atau ikon kamera pada area avatar, lalu pilih file gambar dari perangkat Anda.</li>
              <li>Anda juga dapat memperbarui informasi kontak seperti Email, Nomor Telepon, atau Alamat.</li>
              <li>Setelah selesai, klik <strong>Simpan Perubahan</strong>.</li>
            </ol>
          </>
        ),
      },
    ],
  },
  mahasiswa: {
    label: "Mahasiswa",
    icon: "menu_book",
    items: [
      {
        icon: "assignment",
        question: "Bagaimana cara mengumpulkan tugas?",
        answer: (
          <>
            <p>Langkah-langkah mengumpulkan tugas:</p>
            <ol>
              <li>Masuk ke menu <strong>Tugas</strong> di sidebar.</li>
              <li>Semua tugas dari seluruh mata kuliah akan tampil. Pilih tugas yang ingin dikumpulkan.</li>
              <li>Klik tombol <strong>Kumpulkan</strong>.</li>
              <li>Unggah file jawaban (PDF, Word, Zip, dll).</li>
              <li>Klik <strong>Kirim</strong> untuk mengonfirmasi pengumpulan.</li>
            </ol>
            <p>Jika sudah pernah mengumpulkan, nama file sebelumnya akan tampil sebagai <strong>link biru</strong> yang bisa diklik untuk membuka file. Kamu bisa memperbarui pengumpulan selama deadline belum lewat.</p>
          </>
        ),
      },
      {
        icon: "download",
        question: "Bagaimana cara mengakses dan mengunduh materi perkuliahan?",
        answer: (
          <>
            <ol>
              <li>Masuk ke menu <strong>Mata Kuliah</strong> di sidebar.</li>
              <li>Pilih mata kuliah yang ingin Anda pelajari.</li>
              <li>Daftar materi akan tampil di panel sebelah kanan. Pilih materi yang diinginkan.</li>
              <li>
                Klik tombol aksi yang sesuai pada materi aktif:
                <ul>
                  <li><strong>Unduh Modul</strong> untuk menyimpan file PDF/Presentasi/Dokumen ke perangkat Anda.</li>
                  <li><strong>Buka Link</strong> untuk membuka tautan materi eksternal di tab baru.</li>
                  <li><strong>Putar Video</strong> untuk memutar video pembelajaran langsung di aplikasi.</li>
                </ul>
              </li>
            </ol>
          </>
        ),
      },
      {
        icon: "qr_code_scanner",
        question: "Bagaimana cara melakukan presensi dengan QR Code?",
        answer: (
          <>
            <ol>
              <li>Masuk ke menu <strong>Presensi</strong>.</li>
              <li>Pilih mata kuliah yang sedang berlangsung.</li>
              <li>Klik <strong>Pindai QR Code</strong> dan izinkan akses kamera.</li>
              <li>Arahkan kamera ke QR Code yang ditampilkan dosen.</li>
              <li>Atau masukkan kode secara manual jika tidak bisa memindai.</li>
            </ol>
            <p>
              <strong>Catatan:</strong> QR Code hanya valid selama sesi berlangsung (15 menit). Pastikan kamu
              terdaftar di mata kuliah tersebut.
            </p>
          </>
        ),
      },
      {
        icon: "grade",
        question: "Di mana saya bisa melihat nilai saya?",
        answer: (
          <>
            <p>
              Nilai dapat dilihat di menu <strong>Nilai</strong> pada sidebar. Di sana kamu bisa melihat
              rincian nilai tugas, UTS, UAS, dan nilai akhir per mata kuliah yang sudah diinputkan dosen.
            </p>
            <p>
              Tersedia juga fitur <strong>Unduh Transkrip</strong> untuk mencetak atau menyimpan rekap nilai
              seluruh mata kuliah dalam format PDF.
            </p>
          </>
        ),
      },
      {
        icon: "forum",
        question: "Bagaimana cara berpartisipasi di Forum Diskusi?",
        answer: (
          <>
            <p>Untuk berpartisipasi di forum:</p>
            <ol>
              <li>Masuk ke menu <strong>Forum Diskusi</strong>.</li>
              <li>Pilih mata kuliah dan topik diskusi.</li>
              <li>Klik <strong>Balas</strong> untuk merespons atau <strong>Buat Post</strong> untuk topik baru.</li>
            </ol>
          </>
        ),
      },
      {
        icon: "quiz",
        question: "Bagaimana cara mengerjakan Kuis Online?",
        answer: (
          <>
            <p>Untuk mengerjakan kuis online yang ditugaskan dosen:</p>
            <ol>
              <li>Masuk ke menu <strong>Tugas</strong>.</li>
              <li>Pilih kuis di tab <strong>Belum Dikerjakan</strong>.</li>
              <li>Klik tombol <strong>Kerjakan Kuis</strong> (tombol ini hanya aktif jika deadline belum terlewati).</li>
              <li>Jawab semua pertanyaan pilihan ganda yang tersedia dengan teliti.</li>
              <li>Klik <strong>Kumpulkan</strong> setelah selesai sebelum waktu pengerjaan habis.</li>
            </ol>
            <p>Setelah mengumpulkan, kuis akan berpindah ke tab <strong>Sudah Dikerjakan</strong>. Kamu dapat melihat rekap hasil kuis Anda secara langsung beserta skor Anda, dan nilainya bersifat permanen tidak dapat diubah.</p>
          </>
        ),
      },
    ],
  },
  dosen: {
    label: "Dosen",
    icon: "co_present",
    items: [
      {
        icon: "upload_file",
        question: "Bagaimana cara mengunggah materi perkuliahan?",
        answer: (
          <>
            <ol>
              <li>Masuk ke menu <strong>Materi</strong>.</li>
              <li>Pilih mata kuliah yang ingin ditambahkan materi.</li>
              <li>Klik tombol <strong>Tambah Materi</strong>.</li>
              <li>Pilih <strong>Tipe Materi</strong> (PDF, Video, Link, Presentasi, Dokumen, atau Spreadsheet).</li>
              <li>Isi judul materi, deskripsi (opsional), lalu unggah file materi Anda (untuk tipe dokumen/file) atau masukkan URL (untuk tipe Link/Video).</li>
              <li>Klik <strong>Simpan</strong>. Seluruh materi bertipe dokumen otomatis dapat diunduh oleh mahasiswa.</li>
            </ol>
          </>
        ),
      },
      {
        icon: "qr_code",
        question: "Bagaimana cara membuka sesi presensi?",
        answer: (
          <>
            <ol>
              <li>Masuk ke menu <strong>Presensi</strong>.</li>
              <li>Pilih mata kuliah.</li>
              <li>Klik <strong>Buka Sesi</strong> atau <strong>Pilih Tanggal</strong> untuk tanggal tertentu.</li>
              <li>QR Code akan otomatis muncul dan berlaku selama <strong>15 menit</strong>.</li>
              <li>Tampilkan QR Code kepada mahasiswa untuk dipindai.</li>
            </ol>
            <p>Status kehadiran mahasiswa akan diperbarui secara real-time setelah mereka memindai.</p>
          </>
        ),
      },
      {
        icon: "fact_check",
        question: "Bagaimana cara mengubah status kehadiran mahasiswa secara manual?",
        answer: (
          <>
            <p>
              Di halaman Presensi, pada tabel daftar hadir, setiap baris mahasiswa memiliki
              dropdown <strong>Status</strong>. Klik dropdown tersebut dan pilih status yang sesuai:
              <strong> Hadir, Sakit, Izin, atau Alpa</strong>. Perubahan langsung tersimpan.
            </p>
          </>
        ),
      },
      {
        icon: "assignment_turned_in",
        question: "Bagaimana cara memberi nilai tugas individu mahasiswa?",
        answer: (
          <>
            <ol>
              <li>Masuk ke menu <strong>Nilai Individu</strong> di sidebar.</li>
              <li>Pilih <strong>Mata Kuliah</strong> dari dropdown.</li>
              <li>Pilih <strong>Tugas</strong> spesifik yang ingin dinilai.</li>
              <li>Daftar seluruh mahasiswa akan tampil beserta status pengumpulan (Sudah Kumpul / Belum Kumpul).</li>
              <li>Klik tombol <strong>Nilai</strong> di baris mahasiswa yang sudah mengumpulkan.</li>
              <li>Masukkan nilai (0–100) lalu klik <strong>Simpan</strong>.</li>
            </ol>
            <p>Kamu bisa filter mahasiswa berdasarkan status: <strong>Semua</strong>, <strong>Sudah Kumpul</strong>, atau <strong>Belum Kumpul</strong>. Tombol nilai hanya aktif untuk mahasiswa yang sudah mengumpulkan.</p>
          </>
        ),
      },
      {
        icon: "group_remove",
        question: "Bagaimana cara menghapus kelompok kelas?",
        answer: (
          <>
            <p>Untuk menghapus kelompok yang sudah dibuat:</p>
            <ol>
              <li>Masuk ke menu <strong>Kelompok</strong>.</li>
              <li>Pilih mata kuliah yang sesuai.</li>
              <li>Temukan kelompok yang ingin dihapus pada daftar kartu kelompok.</li>
              <li>Klik ikon <strong>Tong Sampah Merah (Hapus Kelompok)</strong> di sebelah kanan status kelompok pada header kartu kelompok.</li>
              <li>Akan muncul modal konfirmasi danger berwarna merah lembut. Konfirmasi tindakan dengan mengklik <strong>Hapus Kelompok</strong>.</li>
            </ol>
            <p><strong>Peringatan:</strong> Menghapus kelompok bersifat permanen dan akan menghapus seluruh data keanggotaan mahasiswa di dalam kelompok tersebut (Cascade Delete) secara bersih dari database.</p>
          </>
        ),
      },
      {
        icon: "quiz",
        question: "Bagaimana cara melihat nilai kuis online mahasiswa?",
        answer: (
          <>
            <p>Untuk memantau skor kuis online mahasiswa:</p>
            <ol>
              <li>Masuk ke menu <strong>Tugas</strong>.</li>
              <li>Cari tugas kuis yang ingin dipantau.</li>
              <li>Klik tombol <strong>Lihat Nilai</strong> (tombol ini khusus tampil untuk tipe tugas kuis setelah mahasiswa mengerjakan).</li>
              <li>Anda akan langsung diarahkan ke halaman <strong>Nilai Individu</strong> yang menyajikan rekap skor kuis mahasiswa secara otomatis.</li>
            </ol>
            <p><strong>Catatan:</strong> Nilai kuis ini dihitung otomatis oleh sistem berdasarkan jawaban pilihan ganda yang benar, dan bersifat 🔒 <strong>Permanen / Read-only</strong> (tidak dapat diedit secara manual oleh dosen demi menjaga keaslian nilai kuis).</p>
          </>
        ),
      },
      {
        icon: "assignment_add",
        question: "Bagaimana cara membuat Tugas atau Kuis baru?",
        answer: (
          <>
            <ol>
              <li>Masuk ke menu <strong>Tugas & Kuis</strong> dari sidebar.</li>
              <li>Klik tombol <strong>Buat Baru</strong> di pojok kanan atas.</li>
              <li>Pilih <strong>Tipe</strong> yang ingin dibuat: <em>Tugas (Pengumpulan File)</em> atau <em>Kuis (Pilihan Ganda)</em>.</li>
              <li>Pilih mata kuliah, isi Judul, Deskripsi/Instruksi, dan tentukan <strong>Tenggat Waktu (Deadline)</strong>.</li>
              <li>Jika membuat kuis, Anda akan diminta untuk memasukkan daftar pertanyaan dan pilihan jawabannya.</li>
              <li>Klik <strong>Simpan dan Publikasikan</strong> agar mahasiswa dapat mulai mengerjakannya.</li>
            </ol>
          </>
        ),
      },
      {
        icon: "group_add",
        question: "Bagaimana cara membuat Kelompok Kelas?",
        answer: (
          <>
            <p>Untuk membuat kelompok belajar mahasiswa:</p>
            <ol>
              <li>Masuk ke menu <strong>Kelompok</strong>.</li>
              <li>Pilih mata kuliah yang ingin diatur kelompoknya.</li>
              <li>Klik tombol <strong>Buat Kelompok</strong>.</li>
              <li>Anda dapat memilih <strong>Pembagian Otomatis</strong> (sistem akan mengacak mahasiswa ke dalam kelompok secara merata) atau <strong>Pembagian Manual</strong> (memilih sendiri anggota untuk setiap kelompok).</li>
              <li>Beri nama kelompok (misal: Kelompok 1, Kelompok 2) dan simpan.</li>
            </ol>
          </>
        ),
      },
    ],
  },
  teknis: {
    label: "Teknis",
    icon: "build",
    items: [
      {
        icon: "password",
        question: "Bagaimana jika saya lupa kata sandi?",
        answer: (
          <p>
            Hubungi <strong>administrator akademik</strong> kampus untuk melakukan reset kata sandi. Administrator
            akan memberikan kata sandi baru yang dapat kamu ganti setelah login.
          </p>
        ),
      },
      {
        icon: "browser_not_supported",
        question: "Browser apa yang direkomendasikan untuk LeMaS?",
        answer: (
          <p>
            LeMaS direkomendasikan menggunakan browser versi terbaru dari <strong>Google Chrome</strong>,
            <strong> Mozilla Firefox</strong>, atau <strong>Microsoft Edge</strong>. Izinkan akses kamera
            di browser untuk menggunakan fitur presensi QR Code.
          </p>
        ),
      },
      {
        icon: "phone_android",
        question: "Apakah LeMaS bisa diakses melalui ponsel?",
        answer: (
          <p>
            Ya, LeMaS dapat diakses melalui browser di ponsel. Fitur pemindaian QR Code pada halaman presensi
            mahasiswa membutuhkan izin kamera di browser.
          </p>
        ),
      },
    ],
  },
};

const ALL_CATEGORIES = ["semua", ...Object.keys(FAQ_DATA)];

export default function FAQ() {
  const [activeTab, setActiveTab] = useState("semua");
  const [openIndex, setOpenIndex] = useState(null);

  const getCategories = () => {
    if (activeTab === "semua") return Object.entries(FAQ_DATA);
    return [[activeTab, FAQ_DATA[activeTab]]];
  };

  const toggle = (key) => setOpenIndex(openIndex === key ? null : key);

  return (
    <main className="faq-main">
      <div className="faq-container animate-fade-in-up">
        {/* Header */}
        <div className="faq-header">
          <div className="faq-badge">
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>help</span>
            Pusat Bantuan
          </div>
          <h1 className="faq-title">Pertanyaan yang Sering Diajukan</h1>
          <p className="faq-subtitle">
            Temukan jawaban atas pertanyaan umum seputar penggunaan LeMaS.
          </p>
        </div>

        {/* Tabs */}
        <div className="faq-tabs">
          {ALL_CATEGORIES.map((cat) => {
            const info = cat === "semua" ? { label: "Semua", icon: "apps" } : FAQ_DATA[cat];
            return (
              <button
                key={cat}
                className={`faq-tab ${activeTab === cat ? "active" : ""}`}
                onClick={() => { setActiveTab(cat); setOpenIndex(null); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>{info.icon}</span>
                {info.label}
              </button>
            );
          })}
        </div>

        {/* Accordion */}
        {getCategories().map(([catKey, catData]) => (
          <div key={catKey}>
            {activeTab === "semua" && (
              <p className="faq-section-title">{catData.label}</p>
            )}
            <div className="faq-list">
              {catData.items.map((item, i) => {
                const key = `${catKey}-${i}`;
                const isOpen = openIndex === key;
                return (
                  <div 
                    key={key} 
                    className={`faq-item animate-fade-in-up ${isOpen ? "open" : ""}`}
                    style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
                  >
                    <button className="faq-question" onClick={() => toggle(key)}>
                      <span className="faq-q-left">
                        <span className="faq-q-icon">
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>{item.icon}</span>
                        </span>
                        {item.question}
                      </span>
                      <span className="material-symbols-outlined faq-chevron">expand_more</span>
                    </button>
                    <div className="faq-answer">
                      {item.answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="faq-contact">
          <h3>Masih butuh bantuan?</h3>
          <p>Jika pertanyaanmu belum terjawab, hubungi administrator akademik kampus.</p>
          <a className="faq-contact-btn" href="https://wa.me/628112222136" target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>chat</span>
            Hubungi Admin via WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
