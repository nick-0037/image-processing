import express, { Application } from "express";
import authRoutes from "@/routes/authRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import imageRoutes from "@/routes/imageRoutes.js"

const app: Application = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/images", imageRoutes);

app.use(errorHandler);

export default app;
