export class DosenForumController {
constructor(dosenForumUseCase) {
    this.dosenForumUseCase = dosenForumUseCase;
}

async getThreads(req, res) {
    try {
        const { idMataKuliah } = req.params;
        const nomorInduk = req.user.nomorInduk; // Diasumsikan dari authMiddleware
        const data = await this.dosenForumUseCase.getThreads(idMataKuliah, nomorInduk);
        res.status(200).json(data);
        } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async createThread(req, res) {
    try {
      // Jika menggunakan multer, lampiran ada di req.file
        const data = {
        ...req.body,
        nomorInduk: req.user.nomorInduk,
        lampiran: req.file ? `/uploads/${req.file.filename}` : null 
    };
        const result = await this.dosenForumUseCase.createNewThread(data);
        res.status(201).json({ message: "Diskusi berhasil dibuat", data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async addReply(req, res) {
    try {
        const { idForum } = req.params;
        const { isiKomentar } = req.body;
        const nomorInduk = req.user.nomorInduk;
        const result = await this.dosenForumUseCase.replyToThread(idForum, nomorInduk, isiKomentar);
        res.status(201).json({ message: "Balasan berhasil dikirim", data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async toggleLike(req, res) {
    try {
        const { idForum } = req.params;
        const nomorInduk = req.user.nomorInduk;
        const result = await this.dosenForumUseCase.toggleLike(idForum, nomorInduk);
        res.status(200).json(result);
        } catch (error) {
        res.status(400).json({ error: error.message });
        }
    }
}