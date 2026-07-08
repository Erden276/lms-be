import express from 'express';
import multer from 'multer';
import { PrismaForumDosenRepository } from '../../infrastucture/repositories/PrismaForumDosenRepository.js';
import { DosenForumUseCase } from '../../usecases/DosenForumUseCase.js';
import { DosenForumController } from '../controllers/DosenForumController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

// Setup file upload
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
const repository = new PrismaForumDosenRepository();
const useCase = new DosenForumUseCase(repository);
const controller = new DosenForumController(useCase);

router.use(authMiddleware);

router.get('/mata-kuliah/:idMataKuliah', (req, res) => controller.getThreads(req, res));
router.post('/', upload.single('lampiran'), (req, res) => controller.createThread(req, res));
router.post('/:idForum/reply', (req, res) => controller.addReply(req, res));
router.post('/:idForum/like', (req, res) => controller.toggleLike(req, res));

export default router;