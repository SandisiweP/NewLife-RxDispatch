import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: AuthRequest, res: Response) => {
  const { patientName, medication, item, drugName, name, deliveryAddress, phone, patientPhone, patient_phone } = req.body;

  // Grab whichever variation was sent from the frontend form
  const medValue = medication || item || drugName || name;

  if (!medValue || !patientName) {
    return res.status(400).json({ error: 'Patient name and medication description are required' });
  }

  try {
    const newPrescription = await prisma.prescription.create({
      data: {
        patientName,
        medication: medValue, // maps to your Prisma schema field
        medications: medValue,
        deliveryAddress: deliveryAddress || 'Standard Delivery Location',
        patientPhone: patientPhone || phone || patient_phone || '0700000000',
        phone: patientPhone || phone || patient_phone || '0700000000',
      } as any,
    });

    return res.status(201).json(newPrescription);
  } catch (error: any) {
    console.error('Prescription creation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create prescription' });
  }
});

export default router;
