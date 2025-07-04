import express, { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";

const router = express.Router();

// helper: pick only allowed fields for update
function pickUserData(body: any) {
  const allowed = [
    "firstName",
    "lastName",
    "status",
    "expirationDate",
    "groupId",
    "username",
    "password",
    "email",
    "phone",
    "matricola",
  ];
  const data: any = {};
  allowed.forEach((k) => {
    if (body[k] !== undefined) data[k] = body[k];
  });
  if (data.expirationDate) data.expirationDate = new Date(data.expirationDate);
  return data;
}

// GET /api/users
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      include: { group: true },
      orderBy: { lastName: "asc" },
    });
    
    // Transform users to match frontend expectations
    const transformedUsers = users.map(user => ({
      ...user,
      group: user.group ? {
        id: user.group.id,
        name: user.group.name,
        description: user.group.description,
        icon: 'Users', // Default icon since it's not in the database schema
        createdAt: user.group.createdAt,
        permissions: {
          teamManagement: user.group.teamManagement,
          matchManagement: user.group.matchManagement,
          resultsView: user.group.resultsView,
          statisticsView: user.group.statisticsView,
          userManagement: user.group.userManagement,
          groupManagement: user.group.groupManagement,
        }
      } : null
    }));
    
    res.json(transformedUsers);
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = pickUserData(req.body);
    const user = await prisma.user.create({
      data,
      include: { group: true },
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = pickUserData(req.body);
    const user = await prisma.user.update({
      where: { id },
      data,
      include: { group: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if user is referenced in matches as coach/manager
    const refs = await prisma.$transaction([
      prisma.matchCoach.count({ where: { userId: id } }),
      prisma.matchManager.count({ where: { userId: id } }),
    ]);
    if (refs[0] + refs[1] > 0) {
      return res.status(400).json({ error: "Cannot delete user linked to matches" });
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
