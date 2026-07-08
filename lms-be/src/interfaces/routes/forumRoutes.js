import express from 'express';
import multer from 'multer';
import { PrismaForumRepository } from '../../infrastucture/repositories/PrismaForumRepository.js';
import { ForumUseCase } from '../../usecases/ForumUseCase.js';
import { ForumController } from '../controllers/ForumController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Setup multer for forum file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Only PDF, JPG, JPEG, PNG, GIF are allowed.'), false);
    }
  }
});

const router = express.Router();
const forumRepo = new PrismaForumRepository();
const forumUseCase = new ForumUseCase(forumRepo);
const controller = new ForumController(forumUseCase);

router.get('/mata-kuliah/:idMataKuliah', authMiddleware, (req, res) => controller.getThreads(req, res));
router.get('/comment/:idKomentar', (req, res) => controller.getCommentById(req, res));
router.post('/thread', authMiddleware, upload.single('lampiran'), (req, res) => controller.createThread(req, res));
router.post('/upload-image', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  res.status(200).json({ status: 'success', url: `/uploads/${req.file.filename}` });
});
router.put('/thread/:idForumDiskusi', authMiddleware, (req, res) => controller.updateThread(req, res));
router.delete('/thread/:idForumDiskusi', authMiddleware, (req, res) => controller.deleteThread(req, res));
router.post('/comment', authMiddleware, (req, res) => controller.addComment(req, res));
router.put('/comment/:idKomentar', authMiddleware, (req, res) => controller.updateComment(req, res));
router.delete('/comment/:idKomentar', authMiddleware, (req, res) => controller.deleteComment(req, res));
router.post('/like', authMiddleware, (req, res) => controller.toggleLike(req, res));

export default router;