import { Router } from "express";
import { transformImage, uploadImage } from "@/controllers/imageController.js";
import { upload } from "@/middlewares/upload.js";
import { authenticate } from "@/middlewares/authMiddleware.js";

const router = Router();

router.post("/", authenticate, upload.single("image"), uploadImage);
router.post("/:id/transform", authenticate, transformImage)

export default router;
