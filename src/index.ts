import 'dotenv/config';
import express from 'express';
import globalRouter from './global-router';
import { logger } from './logger';
import http from 'http';
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 3838;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST','PUT', 'DELETE'],
  allowedHeaders: '*', 
  exposedHeaders: '*',
  credentials: true
}));


app.use(logger);
app.use(express.json());
app.use('/api/v1/', globalRouter);

app.listen(PORT, () => {
  console.log(`Server runs at http://localhost:${PORT}`);
}
);

// import pinecone from './pinecone';

// async function deleteAllVectors() {
//     if (!process.env.PINECONE_INDEX_NAME) {
//         throw new Error('PINECONE_INDEX_NAME environment variable is not set');
//     }
    
//     const index = pinecone.index(process.env.PINECONE_INDEX_NAME);
//     await index.deleteAll();
// }

// deleteAllVectors();



// server.listen(PORT, () => {
//   console.log(`Server runs at http://localhost:${PORT}`);
// });
