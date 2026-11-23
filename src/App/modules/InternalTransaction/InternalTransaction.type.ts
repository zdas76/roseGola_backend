import { Department } from "../../../generated/prisma";

interface Material {
    id: number;
    name: string;
    unitId: number;
}

interface PackingMaterial extends Material {
    packingMaterialId: number;
    requestInvetoryId: number;
    quantity: number;
}

interface RawMaterial extends Material {
    rawMaterialId: number;
    quantity: number;
}

export interface TMaterialRequest {
    date: string;
    fromDepartment: Department;
    toDepartment: Department;
    packingMaterials: PackingMaterial[];
    rawMaterials: RawMaterial[];
    remarks: string;
    requestNo: string;
    totalQuantity: number;
}


interface ApprovePackingMaterial extends Material {
    packingMaterialId: number;
    approvedQty: number;
    requestInvetoryId: number;
}

interface ApproveRawMaterial extends Material {
    rawMaterialId: number;
    approvedQty: number;

    requestInvetoryId: number;
}

export interface TRAWRequestApproval {
    date: string;
    fromDepartment: Department;
    toDepartment: Department;
    packingMaterials: ApprovePackingMaterial[];
    rawMaterials: ApproveRawMaterial[];
    remarks: string;
    requestNo: string;
    totalQuantity: number;
    transactionId: number
}