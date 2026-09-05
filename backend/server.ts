import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import prescriptionsRouter from './routes/prescriptions';
import ordersRouter from './routes/orders';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/prescriptions', prescriptionsRouter);
app.use('/api/orders', ordersRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NewLife Rx Dispatch API running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// CORRECT: Preserve existing rider relation during status update
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;

  const existingOrder = await prisma.order.findUnique({
    where: { id: req.params.id }
  });

  if (!existingOrder) return res.status(404).json({ error: 'Order not found' });

  const updatedOrder = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { prescription: true, rider: true }
  });

  res.json(updatedOrder);
});
