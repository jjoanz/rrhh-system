// backend/routes/postulacionesRoutes.js
import express from "express";
import { getPostulaciones, createPostulacion } from "../controllers/postulacionesController.js";

const router = express.Router();

router.get("/", getPostulaciones);
router.post("/", createPostulacion);

export default router;
