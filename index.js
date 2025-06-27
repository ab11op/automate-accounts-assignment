import express from 'express';
import receiptRouter from './controllers/receipt.js';

const app = express();
const PORT = 3000;


app.use(express.json());


app.get('/', (req, res) => {
    res.status(200).send('API working');
});

app.use(receiptRouter)

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err, origin) => {
    console.error(' Uncaught Exception:', err.message);
    console.error('Origin:', origin);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
