export interface PurchasePayload {
    partyOrcustomerId: number;
    date: string;
    invoiceNo: string;
    subTotal: number;
    grandTotal: number;
    items: PurchaseItem[];
    expenseItems: ExpenseItem[];
}

export interface PurchaseItem {
    key: number;
    itemType: "PACKING_MATERIAL";
    rawOrProductId: number;
    packingMaterialId: number;
    quantityAdd: number;
    unitPrice: number;
    integratedUnitPrice: number;
    discount: number;
    debitAmount: number;
    narration: string;
}
export interface TItems {
    key: number;
    itemType: "PACKING_MATERIAL";
    rawOrProductId: number;
    packingMaterialId: number;
    quantityAdd: number;
    unitPrice: number;
    integratedUnitPrice: number;
    discount: number;
    debitAmount: number;
    narration: string;
}[]
export interface ExpenseItem {
    key: number;
    expItemId: number;
    expItemName: string;
    amount: number;
    narration: string;
}
export interface PurchasePayload {
    partyOrcustomerId: number;
    date: string;
    invoiceNo: string;
    subTotal: number;
    grandTotal: number;
    items: TItems[];
    expenseItems: {
        key: number;
        expItemId: number;
        expItemName: string;
        amount: number;
        narration: string;
    }[];
    creditItem: [];
}