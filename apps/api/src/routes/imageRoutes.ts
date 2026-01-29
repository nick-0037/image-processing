import { Router } from "express";
import {
	getImageDetail,
	getImages,
	transformImage,
	uploadImage,
} from "@/controllers/imageController.js";
import { upload } from "@/middlewares/upload.js";
import { authenticate } from "@/middlewares/authMiddleware.js";
import {
	imageIdSchema,
	imagePaginationSchema,
	uploadImageSchema,
	transformImageSchema,
} from "@repo/shared";
import { validate } from "@/middlewares/validate.js";
import { transformationLimiter } from "@/middlewares/rateLimiter.js";

const router = Router();

router.get("/", authenticate, validate(imagePaginationSchema), getImages);
router.get("/:id", authenticate, validate(imageIdSchema), getImageDetail);
router.post(
	"/",
	authenticate,
	upload.single("image"),
	validate(uploadImageSchema),
	uploadImage,
);
router.post(
	"/:id/transform",
	authenticate,
	transformationLimiter,
	validate(transformImageSchema),
	transformImage,
);

export default router;
