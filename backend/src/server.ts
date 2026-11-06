import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/error';
import { getPublicUploadUrl } from './services/fileStorage';

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') || true, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_, res) => res.json({ status: 'ok' }));
if (process.env.FILE_STORAGE === 'supabase') {
  app.get('/uploads/:filename', (req, res) => {
    res.redirect(302, getPublicUploadUrl(req.params.filename));
  });
} else {
  app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || 'uploads')));
}
app.use('/api', apiRouter);
app.use(errorHandler);
app.listen(Number(process.env.PORT || 3000), () => console.log('TRAZO API listening'));
