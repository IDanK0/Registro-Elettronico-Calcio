// @ts-nocheck
import express, { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";

const router = express.Router();

// Utility types
interface LineupInput {
  playerId: string;
  position: string;
  jerseyNumber: number;
}
interface SubstitutionInput {
  playerOutId: string;
  playerInId: string;
  minute: number;
}
// future: define event creation when needed
// MatchOpponentLineup currently only stores jerseyNumber. Adjust when schema changes.
// MatchPeriod requires type, label, duration, periodIndex. Not created currently.
interface CoachInput { userId: string }
interface ManagerInput { userId: string }

// GET /api/matches
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const matches = await prisma.match.findMany({
      include: {
        lineups: { include: { player: true } },
        substitutions: true,
        events: true,
        opponentLineup: true,
        periods: true,
        coaches: true,
        managers: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

// POST /api/matches
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      date,
      time,
      opponent,
      homeAway,
      location,
      field,
      firstHalfDuration,
      secondHalfDuration,
      lineups,
      substitutions,
      events,
      opponentLineup,
      periods,
      coaches,
      managers,
    } = req.body as {
      date: string;
      time?: string;
      opponent: string;
      homeAway: "home" | "away";
      location?: string;
      field?: string;
      firstHalfDuration?: number;
      secondHalfDuration?: number;
      lineups?: LineupInput[];
      substitutions?: SubstitutionInput[];
      // events?: any[];
      // opponentLineup?: any[];
      // periods?: any[];
      coaches?: CoachInput[];
      managers?: ManagerInput[];
    };

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        time,
        opponent,
        homeAway,
        location,
        field,
        firstHalfDuration,
        secondHalfDuration,
        lineups: lineups && lineups.length > 0 ? {
          create: lineups.map((l) => ({
            playerId: l.playerId,
            position: l.position,
            jerseyNumber: l.jerseyNumber,
          })),
        } : undefined,
        substitutions: substitutions && substitutions.length > 0 ? {
          create: substitutions.map((s) => ({
            playerOutId: s.playerOutId,
            playerInId: s.playerInId,
            minute: s.minute,
          })),
        } : undefined,
        
        
        
        coaches: coaches && coaches.length > 0 ? {
          create: coaches.map((c) => ({
            user: { connect: { id: c.userId } },
          })),
        } : undefined,
        managers: managers && managers.length > 0 ? {
          create: managers.map((m) => ({
            user: { connect: { id: m.userId } },
          })),
        } : undefined,
      },
      include: {
        lineups: true,
        substitutions: true,
        events: true,
        opponentLineup: true,
        periods: true,
        coaches: true,
        managers: true,
      },
    });

    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
});

// PUT /api/matches/:id
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      date,
      time,
      opponent,
      homeAway,
      location,
      field,
      firstHalfDuration,
      secondHalfDuration,
      lineups,
      substitutions,
      events,
      opponentLineup,
      periods,
      coaches,
      managers,
    } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        time,
        opponent,
        homeAway,
        location,
        field,
        firstHalfDuration,
        secondHalfDuration,
        // replace nested relations completely for simplicity
        lineups: lineups ? {
          deleteMany: {},
          create: lineups.map((l: LineupInput) => ({
            playerId: l.playerId,
            position: l.position,
            jerseyNumber: l.jerseyNumber,
          })),
        } : undefined,
        substitutions: substitutions ? {
          deleteMany: {},
          create: substitutions.map((s: SubstitutionInput) => ({
            playerOutId: s.playerOutId,
            playerInId: s.playerInId,
            minute: s.minute,
          })),
        } : undefined,
        
        
        
        coaches: coaches ? {
          deleteMany: {},
          create: coaches.map((c: CoachInput) => ({
            user: { connect: { id: c.userId } },
          })),
        } : undefined,
        managers: managers ? {
          deleteMany: {},
          create: managers.map((m: ManagerInput) => ({
            user: { connect: { id: m.userId } },
          })),
        } : undefined,
      },
      include: {
        lineups: true,
        substitutions: true,
        events: true,
        opponentLineup: true,
        periods: true,
        coaches: true,
        managers: true,
      },
    });

    res.json(match);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/matches/:id
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // delete nested relations first due to FK constraints
    await prisma.matchLineup.deleteMany({ where: { matchId: id } });
    await prisma.substitution.deleteMany({ where: { matchId: id } });
    await prisma.matchEvent.deleteMany({ where: { matchId: id } });
    await prisma.matchOpponentLineup.deleteMany({ where: { matchId: id } });
    await prisma.matchPeriod.deleteMany({ where: { matchId: id } });
    await prisma.matchCoach.deleteMany({ where: { matchId: id } });
    await prisma.matchManager.deleteMany({ where: { matchId: id } });

    await prisma.match.delete({ where: { id } });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
