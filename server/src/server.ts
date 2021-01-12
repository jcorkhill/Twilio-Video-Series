import express from 'express';
import { generateToken } from './api/controller';

const PORT = parseInt(process.env.PORT as string) || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoints 
app.post('/create-token', generateToken);

app.listen(PORT, () => console.log(`Server is up on port ${PORT}`));