import { prisma } from '../../../lib/prisma.js';

export class PresensiController {
  constructor(presensiUseCase) {
    this.presensiUseCase = presensiUseCase;
  }

  async getDaftarHadir(req, res) {
    try {
      const { idMataKuliah } = req.params;
      const data = await this.presensiUseCase.getDaftarHadir(parseInt(idMataKuliah));
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async scanQR(req, res) {
    try {
      let nim = req.user?.nomorInduk;
      
      // nim sudah berupa actual nim (karena nomorInduk === nim)
      
      const { idMataKuliah, token } = req.body;
      const result = await this.presensiUseCase.scanKehadiran(nim, parseInt(idMataKuliah), token);
      
      res.status(200).json({ status: 'success', message: 'Absen Berhasil!', data: result });
    } catch (error) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getPresensiMahasiswa(req, res) {
    try {
      let nim = req.user?.nomorInduk || req.query.nim;
      // nim sudah berupa actual nim
      const { idMataKuliah } = req.params;
      const data = await this.presensiUseCase.getRiwayatKehadiran(nim, parseInt(idMataKuliah));
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getSummaryPresensi(req, res) {
    try {
      let nim = req.user?.nomorInduk || req.query.nim;
      // nim sudah berupa actual nim
      const { idMataKuliah } = req.params;
      const data = await this.presensiUseCase.getSummaryKehadiran(nim, parseInt(idMataKuliah));
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}