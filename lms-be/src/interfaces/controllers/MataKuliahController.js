import { prisma } from '../../../lib/prisma.js';

export class MataKuliahController {

  constructor(mataKuliahUseCase) {
    this.mataKuliahUseCase = mataKuliahUseCase;
  }

  async create(req, res) {
    try {
      const result = await this.mataKuliahUseCase.addMataKuliah(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req, res) {
    try {
      if (req.user && req.user.role === 'DOSEN' && req.user.dosen) {
        const result = await this.mataKuliahUseCase.getByDosen(req.user.dosen.nip);
        return res.json(result);
      }
      
      if (req.user && req.user.role === 'MAHASISWA') {
        let nim = req.user?.nomorInduk;
        const actualNim = nim;
        const result = await this.mataKuliahUseCase.getByNim(actualNim);
        return res.json(result);
      }
      
      const result = await this.mataKuliahUseCase.getAll();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMine(req, res) {
    try {
      let nim = req.user?.nomorInduk;
      // Map nomorInduk to actual nim if possible
      const actualNim = nim;
      
      const result = await this.mataKuliahUseCase.getByNim(actualNim);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req, res) {
    try {
      const result = await this.mataKuliahUseCase.getById(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await this.mataKuliahUseCase.updateMataKuliah(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await this.mataKuliahUseCase.deleteMataKuliah(req.params.id);
      res.json({ message: "Mata Kuliah berhasil dihapus" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getDetail(req, res) {
    try {
      const { idMataKuliah } = req.params;
      const data = await this.mataKuliahUseCase.getDetailMataKuliah(parseInt(idMataKuliah));
      
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  }
}