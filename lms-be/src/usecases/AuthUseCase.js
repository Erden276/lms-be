import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async login(identifier, password, expectedRole) {
    // 1. Detect identifier type dan cari user
    let user;
    if (identifier.includes('@')) {
      user = await this.userRepository.findByEmail(identifier);
    } else {
      user = await this.userRepository.findByNomorInduk(identifier);
    }
    if (!user) throw new Error('Pengguna tidak ditemukan.');
    if (!user.role) throw new Error('Role user tidak ditemukan.');

    // 2. Validasi Role (Opsional - hanya jika expectedRole diberikan)
    if (expectedRole && user.role.nama.toUpperCase() !== expectedRole.toUpperCase()) {
      throw new Error(`Akses ditolak. Anda tidak terdaftar sebagai ${expectedRole}.`);
    }

    // 3. Verifikasi Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Kata sandi salah.');

    const payload = { 
      nomorInduk: user.nomorInduk, 
      role: user.role.nama 
    };
    
    if (user.dosen) payload.dosen = { nip: user.dosen.nip };
    if (user.mahasiswa) payload.mahasiswa = { nim: user.mahasiswa.nim };

    // 4. Generate Token JWT
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        nomorInduk: user.nomorInduk,
        nama: user.nama,
        email: user.email,
        telepon: user.telepon,
        fotoUrl: user.fotoUrl,
        role: user.role.nama,
        dosen: user.dosen,
        mahasiswa: user.mahasiswa
      }
    };
  }
}