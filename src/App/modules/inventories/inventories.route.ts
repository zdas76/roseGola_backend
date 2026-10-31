import validationRequiest from "../../middlewares/validationRequest";
import { InventoryValidation } from "./invendoty.validation";
import { InventoryControllers } from "./inventories.controllers";
import express from "express";

const route = express.Router();

route.get("/", InventoryControllers.getnventory);

route.get("/inventorytotal", InventoryControllers.getInventoryAggigetValue);


route.put("/", InventoryControllers.updateInventory);

route.put("/", InventoryControllers.deleteInventory);

// get  last used raw material quantity
route.get("/lastRate", InventoryControllers.getLastRawMaterialRate);
route.get("/last_voucher_qty", InventoryControllers.getLastUsedVoucherQty)

route.get("/:id", InventoryControllers.getInventoryById);


export const InventoryRoute = route;