import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import playersRouter from "./routes/players";
import trainingsRouter from "./routes/trainings";
import matchesRouter from "./routes/matches";
import usersRouter from "./routes/users";
import groupsRouter from "./routes/groups";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api/players", playersRouter);
app.use("/api/trainings", trainingsRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/users", usersRouter);
app.use("/api/groups", groupsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
