import express, { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: { group: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password (in a real app, this should be hashed)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user is active and not expired
    if (user.status !== "active") {
      return res.status(401).json({ error: "User account is inactive" });
    }

    if (user.expirationDate && new Date() > user.expirationDate) {
      return res.status(401).json({ error: "User account has expired" });
    }

    // Return user data (excluding password) with transformed group
    const { password: _, ...userWithoutPassword } = user;
    const transformedUser = {
      ...userWithoutPassword,
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
    };
    
    res.json({
      user: transformedUser,
      message: "Login successful"
    });

  } catch (err) {
    next(err);
  }
});

export default router;
