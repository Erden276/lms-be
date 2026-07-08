export class ForumController {
    constructor(forumUseCase) {
        this.forumUseCase = forumUseCase;
    }

async getThreads(req, res) {
    try {
        const { idMataKuliah } = req.params;
        const nomorInduk = req.user?.nomorInduk || null;
        const data = await this.forumUseCase.getThreads(parseInt(idMataKuliah), nomorInduk);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async getCommentById(req, res) {
    try {
        const { idKomentar } = req.params;
        const comment = await this.forumUseCase.getCommentById(parseInt(idKomentar));
        if (!comment) {
            return res.status(404).json({ status: 'error', message: 'Komentar tidak ditemukan' });
        }
        res.status(200).json({ status: 'success', data: comment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async createThread(req, res) {
    try {
        const nomorInduk = req.user.nomorInduk; // Dari middleware JWT
        const { idMataKuliah, judul, isiForum } = req.body;
        const lampiran = req.file ? `/uploads/${req.file.filename}` : null;

        const newThread = await this.forumUseCase.createThread(
            parseInt(idMataKuliah), nomorInduk, judul, isiForum, lampiran
        );
        res.status(201).json({ status: 'success', data: newThread });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}

async addComment(req, res) {
    try {
        const { idForum, isiKomentar } = req.body;
        const nomorInduk = req.user.nomorInduk;

        const comment = await this.forumUseCase.addComment(
            parseInt(idForum), nomorInduk, isiKomentar
        );
        res.status(201).json({ status: 'success', data: comment });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}

async toggleLike(req, res) {
    try {
        const { idForum } = req.body;
        const nomorInduk = req.user.nomorInduk;
        const result = await this.forumUseCase.toggleLike(parseInt(idForum), nomorInduk);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}

async updateThread(req, res) {
    try {
        const nomorInduk = req.user.nomorInduk;
        const { idForumDiskusi } = req.params;
        const { judul, isiForum } = req.body;
        
        const updated = await this.forumUseCase.updateThread(
            parseInt(idForumDiskusi), nomorInduk, judul, isiForum
        );
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}

async deleteThread(req, res) {
    try {
        const nomorInduk = req.user.nomorInduk;
        const { idForumDiskusi } = req.params;
        
        await this.forumUseCase.deleteThread(parseInt(idForumDiskusi), nomorInduk);
        res.status(200).json({ status: 'success', message: 'Thread berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}

async updateComment(req, res) {
    try {
        const nomorInduk = req.user.nomorInduk;
        const { idKomentar } = req.params;
        const { isiKomentar } = req.body;
        
        const updated = await this.forumUseCase.updateComment(
            parseInt(idKomentar), nomorInduk, isiKomentar
        );
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}

async deleteComment(req, res) {
    try {
        const nomorInduk = req.user.nomorInduk;
        const { idKomentar } = req.params;
        
        await this.forumUseCase.deleteComment(parseInt(idKomentar), nomorInduk);
        res.status(200).json({ status: 'success', message: 'Komentar berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
}
}