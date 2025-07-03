import { Router } from "express";
import prisma from "../prismaClient";

const router = Router();

// GET /api/players
router.get("/", async (_req, res, next) => {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        documents: true,
      },
    });
    res.json(players);
  } catch (err) {
    next(err);
  }
});

// POST /api/players
router.post("/", async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      birthDate,
      licenseNumber,
      isActive = true,
      phone,
      email,
      parentName,
      parentPhone,
      parentEmail,
      documents = [],
    } = req.body;

    const player = await prisma.player.create({
      data: {
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        licenseNumber,
        isActive,
        phone,
        email,
        parentName,
        parentPhone,
        parentEmail,
        documents: {
          create: documents.map((d: any) => ({
            fileName: d.fileName,
            mimeType: d.mimeType,
            data: d.data,
          })),
        },
      },
      include: { documents: true },
    });
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
});

// PUT /api/players/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      birthDate,
      licenseNumber,
      isActive = true,
      phone,
      email,
      parentName,
      parentPhone,
      parentEmail,
      documents = [],
    } = req.body;

    // Delete existing documents then recreate (simpler logic)
    await prisma.playerDocument.deleteMany({ where: { playerId: id } });

    const player = await prisma.player.update({
      where: { id },
      data: {
        firstName,
        lastName,
        birthDate: new Date(birthDate),
        licenseNumber,
        isActive,
        phone,
        email,
        parentName,
        parentPhone,
        parentEmail,
        documents: {
          create: documents.map((d: any) => ({
            fileName: d.fileName,
            mimeType: d.mimeType,
            data: d.data,
          })),
        },
      },
      include: { documents: true },
    });

    res.json(player);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/players/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.player.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
