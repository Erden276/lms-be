import express from 'express';
import multer from 'multer';
import { TugasController } from '../controllers/TugasController.js';
import { TugasUseCase } from '../../usecases/TugasUseCase.js';
import { PrismaTugasRepository } from '../../infrastucture/repositories/PrismaTugasRepository.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const router = express.Router();

const repository = new PrismaTugasRepository();
const useCase = new TugasUseCase(repository);
const controller = new TugasController(useCase);

router.use(authMiddleware);

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getDetail(req, res));
router.post('/:idTugas/submit', upload.single('file'), (req, res) => controller.submit(req, res));
router.get('/:idTugas/submission', (req, res) => controller.getSubmission(req, res));
router.delete('/submission/:idPengumpulan', (req, res) => controller.deleteSubmission(req, res));

export default router;
