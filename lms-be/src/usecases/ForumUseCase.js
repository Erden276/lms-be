export class ForumUseCase {
    constructor(forumRepository) {
    this.forumRepository = forumRepository;
    }

  // Mengambil daftar thread berdasarkan Mata Kuliah
    async getThreads(idMataKuliah, nomorInduk) {
        try {
          const threads = await this.forumRepository.getThreadsByMataKuliah(idMataKuliah);
      
          // Mapping format data agar sesuai dengan frontend
          return threads.map(thread => ({
              id: thread.idForumDiskusi,
              authorName: thread.user?.nama || 'Unknown',
              authorRole: thread.user?.role?.nama || 'Unknown',
              time: thread.createdAt,
              title: thread.judul,
              content: thread.isiForum,
              lampiran: thread.lampiran,
              comments: (thread.komentarForum || []).map(k => ({
              id: k.idKomentar,
              authorName: k.user?.nama || 'Unknown',
              content: k.isiKomentar,
              time: k.createdAt
              })),
              likesCount: thread.likes ? thread.likes.length : 0,
              isLiked: nomorInduk ? (thread.likes || []).some(l => l.nomorInduk === nomorInduk) : false
              }));
        } catch (error) {
          console.error('ForumUseCase.getThreads error:', error);
          return [];
        }
    }

    async getCommentById(idKomentar) {
        const comment = await this.forumRepository.getCommentById(idKomentar);
        if (!comment) return null;
        return {
            id: comment.idKomentar,
            authorName: comment.user?.nama || 'Unknown',
            content: comment.isiKomentar,
            time: comment.createdAt
        };
    }

  // Membuat Diskusi Baru
async createThread(idMataKuliah, nomorInduk, judul, isiForum, lampiran) {
    if (!judul || !isiForum) throw new Error("Judul dan isi forum tidak boleh kosong");
    
    return await this.forumRepository.createThread({
        idMataKuliah,
        nomorInduk,
        judul,
        isiForum,
        lampiran
        });
    }

  // Menambahkan komentar/balasan pada sebuah thread
  async addComment(idForum, nomorInduk, isiKomentar) {
    if (!isiKomentar || isiKomentar.trim() === "") throw new Error("Komentar tidak boleh kosong");
    
    return await this.forumRepository.addComment({
        idForum,
        nomorInduk,
        isiKomentar
        });
    }

  async toggleLike(idForum, nomorInduk) {
    return await this.forumRepository.toggleLike(idForum, nomorInduk);
  }

  async updateThread(idForumDiskusi, nomorInduk, judul, isiForum) {
    const thread = await this.forumRepository.getThreadById(idForumDiskusi);
    if (!thread) throw new Error("Thread tidak ditemukan");
    if (thread.nomorInduk !== nomorInduk) throw new Error("Anda tidak berhak mengedit thread ini");
    
    return await this.forumRepository.updateThread(idForumDiskusi, { judul, isiForum });
  }

  async deleteThread(idForumDiskusi, nomorInduk) {
    const thread = await this.forumRepository.getThreadById(idForumDiskusi);
    if (!thread) throw new Error("Thread tidak ditemukan");
    if (thread.nomorInduk !== nomorInduk) throw new Error("Anda tidak berhak menghapus thread ini");
    
    return await this.forumRepository.deleteThread(idForumDiskusi);
  }

  async updateComment(idKomentar, nomorInduk, isiKomentar) {
    const comment = await this.forumRepository.getCommentById(idKomentar);
    if (!comment) throw new Error("Komentar tidak ditemukan");
    if (comment.nomorInduk !== nomorInduk) throw new Error("Anda tidak berhak mengedit komentar ini");
    
    return await this.forumRepository.updateComment(idKomentar, isiKomentar);
  }

  async deleteComment(idKomentar, nomorInduk) {
    const comment = await this.forumRepository.getCommentById(idKomentar);
    if (!comment) throw new Error("Komentar tidak ditemukan");
    if (comment.nomorInduk !== nomorInduk) throw new Error("Anda tidak berhak menghapus komentar ini");
    
    return await this.forumRepository.deleteComment(idKomentar);
  }
}