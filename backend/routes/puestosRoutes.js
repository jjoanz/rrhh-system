// backend/routes/puestosRoutes.js
import express from "express";
import { getPuestos, createPuesto, deletePuesto } from "../controllers/puestosController.js";

const router = express.Router();

router.get("/", getPuestos);
router.post("/", createPuesto);
router.delete("/:id", deletePuesto);

export default router;
