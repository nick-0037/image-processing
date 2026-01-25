import express, { Application, Request, Response } from "express";
import authRoutes from "@/routes/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app: Application = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;
