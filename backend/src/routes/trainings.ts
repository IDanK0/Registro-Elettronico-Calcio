import express, { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";

const router = express.Router();

// GET /api/trainings
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const trainings = await prisma.training.findMany({
      include: {
        attendance: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    res.json(trainings);
  } catch (err) {
    next(err);
  }
});

// POST /api/trainings
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, time, attendance } = req.body as {
      date: string;
      time: string;
      attendance?: { playerId: string; isPresent: boolean }[];
    };

    const training = await prisma.training.create({
      data: {
        date: new Date(date),
        time,
        attendance: attendance && attendance.length > 0 ? {
          create: attendance.map((a) => ({
            playerId: a.playerId,
            isPresent: a.isPresent,
          })),
        } : undefined,
      },
      include: {
        attendance: true,
      },
    });

    res.status(201).json(training);
  } catch (err) {
    next(err);
  }
});

// PUT /api/trainings/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, time, attendance } = req.body as {
      date: string;
      time: string;
      attendance?: { playerId: string; isPresent: boolean }[];
    };

    // update training fields
    const training = await prisma.training.update({
      where: { id },
      data: {
        date: new Date(date),
        time,
        // first delete existing attendance and recreate
        attendance: attendance ? {
          deleteMany: {},
          create: attendance.map((a) => ({
            playerId: a.playerId,
            isPresent: a.isPresent,
          })),
        } : undefined,
      },
      include: {
        attendance: true,
      },
    });

    res.json(training);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trainings/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.trainingAttendance.deleteMany({ where: { trainingId: id } });
    await prisma.training.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
