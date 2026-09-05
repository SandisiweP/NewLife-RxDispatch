import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { patientName, medication, item, drugName, name, deliveryAddress, phone, patientPhone, patient_phone, medications } = req.body;
    const medValue = medications || medication || item || drugName || name || "Paracetamol";

    // 1. Find or create a pharmacy — REQUIRED
    let pharmacy = await prisma.pharmacy.findFirst();
    if (!pharmacy) {
      pharmacy = await prisma.pharmacy.create({
        data: { 
          name: "NewLife Main Pharmacy", 
          address: "Nairobi" 
        }
      });
    }

    // 2. Create prescription with CORRECT fields only
    const prescription = await prisma.prescription.create({
      data: {
        patientName: patientName || "Nana Leaks",
        patientPhone: patientPhone || phone || patient_phone || "0700000000",
        deliveryAddress: deliveryAddress || "25 Waters Street, Nairobi",
        medications: typeof medValue === 'string' ? medValue : JSON.stringify(medValue),
        pharmacyId: pharmacy.id,
      },
    });

    res.json(prescription);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});
