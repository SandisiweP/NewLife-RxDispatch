import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create an order from a prescription
router.post('/', async (req: AuthRequest, res: Response) => {
  const { prescriptionId } = req.body;

  if (!prescriptionId) {
    return res.status(400).json({ error: 'prescriptionId is required' });
  }

  try {
    const existingOrder = await prisma.order.findFirst({
      where: { prescriptionId },
      include: { prescription: true, rider: true },
    });

    if (existingOrder) {
      return res.status(200).json(existingOrder);
    }

    const newOrder = await prisma.order.create({
      data: { prescriptionId },
      include: { prescription: true, rider: true },
    });

    return res.status(201).json(newOrder);
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Fetch all orders
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { prescription: true, rider: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Assign rider route
router.patch('/:id/assign', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { riderId, riderName } = req.body;

  if (!riderId) {
    return res.status(400).json({ error: 'riderId is required for assignment' });
  }

  try {
    const rider = await prisma.user.upsert({
      where: { id: riderId },
      update: { name: riderName || 'Courier Team' },
      create: {
        id: riderId,
        name: riderName || 'Courier Team',
        email: `rider_${riderId.slice(0, 6)}@newliferx.com`,
        passwordHash: 'password123',
        role: 'RIDER',
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id as string },
      data: {
        riderId: rider.id,
        status: 'ASSIGNED',
      },
      include: { prescription: true, rider: true },
    });

    return res.json(updatedOrder);
  } catch (error: any) {
    console.error('Assign rider error:', error);
    return res.status(500).json({ error: error.message || 'Failed to assign rider' });
  }
});

// Update order status route with safe enum mapping
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const cleanStatus = status.toString().toUpperCase().trim();
  
  // Map frontend values safely to match your schema's OrderStatus enum
  let dbStatus = 'UNASSIGNED';
  if (cleanStatus.includes('PICK') || cleanStatus.includes('TRANSIT')) {
    dbStatus = 'IN_TRANSIT';
  } else if (cleanStatus.includes('DELIVER')) {
    dbStatus = 'DELIVERED';
  } else if (cleanStatus.includes('ASSIGN')) {
    dbStatus = 'ASSIGNED';
  } else if (cleanStatus.includes('FAIL')) {
    dbStatus = 'FAILED';
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { 
        status: dbStatus as any 
      },
      include: { prescription: true, rider: true },
    });

    return res.json(updatedOrder);
  } catch (error: any) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update status' });
  }
});

export default router;