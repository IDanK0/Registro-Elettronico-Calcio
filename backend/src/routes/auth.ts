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

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      message: "Login successful"
    });

  } catch (err) {
    next(err);
  }
});

export default router;
