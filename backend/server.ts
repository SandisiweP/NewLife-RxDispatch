import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import prescriptionsRouter from './routes/prescriptions';
import ordersRouter from './routes/orders';
import { Order } from './models/order'; // Assuming you have an Order model defined 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
// ✅ CORRECT: Preserve existing rider relation during status update
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  
  const order = await Order.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Update only status; leave order.riderId untouched
  order.status = status;
  await order.save();

  // Re-fetch with associations included so the updated response includes the rider object
  const updatedOrder = await Order.findByPk(req.params.id, {
    include: ['prescription', 'rider']
  });

  res.json(updatedOrder);
});
