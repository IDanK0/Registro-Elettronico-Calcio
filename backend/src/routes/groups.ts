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
    
    // Transform groups to match frontend expectations
    const transformedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      icon: 'Users', // Default icon since it's not in the database schema
      createdAt: group.createdAt,
      users: group.users,
      permissions: {
        teamManagement: group.teamManagement,
        matchManagement: group.matchManagement,
        resultsView: group.resultsView,
        statisticsView: group.statisticsView,
        userManagement: group.userManagement,
        groupManagement: group.groupManagement,
      }
    }));
    
    res.json(transformedGroups);
  } catch (err) {
    next(err);
  }
});

// POST /api/groups
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, icon, permissions } = req.body;

    const createData: Prisma.GroupUncheckedCreateInput = {
      id: uuidv4(),
      name,
      description,
      teamManagement: permissions?.teamManagement || false,
      matchManagement: permissions?.matchManagement || false,
      resultsView: permissions?.resultsView || false,
      statisticsView: permissions?.statisticsView || false,
      userManagement: permissions?.userManagement || false,
      groupManagement: permissions?.groupManagement || false,
    };

    const group = await prisma.group.create({
      data: createData,
    });

    // Transform response to match frontend expectations
    const transformedGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      icon: icon || 'Users',
      createdAt: group.createdAt,
      permissions: {
        teamManagement: group.teamManagement,
        matchManagement: group.matchManagement,
        resultsView: group.resultsView,
        statisticsView: group.statisticsView,
        userManagement: group.userManagement,
        groupManagement: group.groupManagement,
      }
    };

    res.status(201).json(transformedGroup);
  } catch (err) {
    next(err);
  }
});

// PUT /api/groups/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, icon, permissions } = req.body;

    const updateData: Prisma.GroupUncheckedUpdateInput = {
      name,
      description,
      teamManagement: permissions?.teamManagement,
      matchManagement: permissions?.matchManagement,
      resultsView: permissions?.resultsView,
      statisticsView: permissions?.statisticsView,
      userManagement: permissions?.userManagement,
      groupManagement: permissions?.groupManagement,
    };

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
    });

    // Transform response to match frontend expectations
    const transformedGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      icon: icon || 'Users',
      createdAt: group.createdAt,
      permissions: {
        teamManagement: group.teamManagement,
        matchManagement: group.matchManagement,
        resultsView: group.resultsView,
        statisticsView: group.statisticsView,
        userManagement: group.userManagement,
        groupManagement: group.groupManagement,
      }
    };

    res.json(transformedGroup);
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
