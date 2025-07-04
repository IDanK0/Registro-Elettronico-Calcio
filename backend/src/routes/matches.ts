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
  second?: number;
}

interface EventInput {
  id: string;
  type: string;
  minute: number;
  second?: number;
  playerId: string;
  description?: string;
  reason?: string;
  teamType?: string;
}

interface OpponentLineupInput {
  jerseyNumber: number;
}

interface PeriodInput {
  type: string;
  label: string;
  duration: number;
  isFinished?: boolean;
  periodIndex: number;
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
      homeScore,
      awayScore,
      status,
      isRunning,
      currentPeriodIndex,
      playerJerseyNumbers,
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
      events?: EventInput[];
      opponentLineup?: OpponentLineupInput[];
      periods?: PeriodInput[];
      coaches?: CoachInput[];
      managers?: ManagerInput[];
      homeScore?: number;
      awayScore?: number;
      status?: string;
      isRunning?: boolean;
      currentPeriodIndex?: number;
      playerJerseyNumbers?: any;
    };

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        time,
        opponent,
        homeAway,
        location,
        field,
        firstHalfDuration: firstHalfDuration || 0,
        secondHalfDuration: secondHalfDuration || 0,
        homeScore: homeScore || 0,
        awayScore: awayScore || 0,
        status: status as any || 'SCHEDULED',
        isRunning: isRunning || false,
        currentPeriodIndex: currentPeriodIndex || 0,
        playerJerseyNumbers: playerJerseyNumbers || {},
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
            second: s.second,
          })),
        } : undefined,
        events: events && events.length > 0 ? {
          create: events.map((e) => ({
            id: e.id,
            type: e.type as any,
            minute: e.minute,
            second: e.second,
            playerId: e.playerId,
            description: e.description,
            reason: e.reason,
            teamType: e.teamType as any,
          })),
        } : undefined,
        opponentLineup: opponentLineup && opponentLineup.length > 0 ? {
          create: opponentLineup.map((o) => ({
            jerseyNumber: o.jerseyNumber,
          })),
        } : undefined,
        periods: periods && periods.length > 0 ? {
          create: periods.map((p) => ({
            type: p.type as any,
            label: p.label,
            duration: p.duration,
            isFinished: p.isFinished || false,
            periodIndex: p.periodIndex,
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
      homeScore,
      awayScore,
      status,
      isRunning,
      currentPeriodIndex,
      playerJerseyNumbers,
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
        homeScore,
        awayScore,
        status: status as any,
        isRunning,
        currentPeriodIndex,
        playerJerseyNumbers,
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
            second: s.second,
          })),
        } : undefined,
        events: events ? {
          deleteMany: {},
          create: events.map((e: EventInput) => ({
            id: e.id,
            type: e.type as any,
            minute: e.minute,
            second: e.second,
            playerId: e.playerId,
            description: e.description,
            reason: e.reason,
            teamType: e.teamType as any,
          })),
        } : undefined,
        opponentLineup: opponentLineup ? {
          deleteMany: {},
          create: opponentLineup.map((o: OpponentLineupInput) => ({
            jerseyNumber: o.jerseyNumber,
          })),
        } : undefined,
        periods: periods ? {
          deleteMany: {},
          create: periods.map((p: PeriodInput) => ({
            type: p.type as any,
            label: p.label,
            duration: p.duration,
            isFinished: p.isFinished || false,
            periodIndex: p.periodIndex,
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
