import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { env } from './config/env';

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(','),
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../', env.uploadPath)));

app.use('/api', routes);

app.use(errorMiddleware);

export default app;
