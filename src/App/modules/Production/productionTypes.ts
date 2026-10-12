import { TxStatus } from "../../../generated/prisma";

export interface Production {
  status?: TxStatus;
  date: string;
  productinfo: {
    productId: number;
    quantityAdd?: number;
    unitPrice?: number;
  };
  rawMaterials?: {
    rawId: number;
    quantity: number;
    unitPrice: number;
  }[];
  productionExpenses?: {
    proExpencesItemId: number;
    unitRate: number;
    expDuration: number;
    amount: number;
  }[];
  packingMaterials?: {
    packingMaterialId: number;
    unitPrice: number;
    qty: number;
    perUnitQty: number;
    perUnitCost: number;
  }[];
  products?: {
    productId: number;
    quantityAdd?: number;
    quantityLess?: number;
    unitPrice: number;
  }[];
}