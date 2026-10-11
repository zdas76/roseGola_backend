import express from "express";
import { ProductionController } from "./production.controller";

const router = express.Router();

router.get("/", ProductionController.getProduction);

router.put("/", ProductionController.createProduction);
router.put("/:id", ProductionController.createProduction);

router.get("/:id", ProductionController.getProductionById);

router.delete("/{id}", ProductionController.deleteProduction);

export const ProductionRouter = router;


