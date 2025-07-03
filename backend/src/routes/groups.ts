import express, { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

const router = express.Router();

// GET /api/groups
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await prisma.group.findMany({
      include: { users: true },
      orderBy: { name: "asc" },
    });
    res.json(groups);
  } catch (err) {
    next(err);
  }
});

// POST /api/groups
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      teamManagement = false,
      matchManagement = false,
      resultsView = false,
      statisticsView = false,
      userManagement = false,
      groupManagement = false,
    } = req.body;

    const createData: Prisma.GroupUncheckedCreateInput = {
      id: uuidv4(),
      name,
      description,
      teamManagement,
      matchManagement,
      resultsView,
      statisticsView,
      userManagement,
      groupManagement,
    };

    const group = await prisma.group.create({
      data: createData,
    });

    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
});

// PUT /api/groups/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const group = await prisma.group.update({
      where: { id },
      data: data as Prisma.GroupUncheckedUpdateInput,
    });

    res.json(group);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // if there are users, prevent deletion
    const usersCount = await prisma.user.count({ where: { groupId: id } });
    if (usersCount > 0) {
      return res.status(400).json({ error: "Cannot delete group with users" });
    }

    await prisma.group.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
