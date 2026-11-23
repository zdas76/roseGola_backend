import validationRequiest from "../../middlewares/validationRequest";
import express from "express";
import { internalTransactionController } from "./InternalTransaction.controller";

const router = express.Router();
router.post("/raw-request", internalTransactionController.createRequest)
router.post("/raw-approve", internalTransactionController.approveRawRequest)

router.get("/request", internalTransactionController.getAllRequest)
router.get("/request/:id", internalTransactionController.getRequestById)

router.post("/product-request", internalTransactionController.createProductRequest)
router.post("/prodcut-approve", internalTransactionController.approveProductRequest)


export const InternalTransaction = router;



