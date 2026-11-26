import { StatusCodes } from "http-status-codes";
import {
  Department,
  Status,
  TxStatus,
  VoucherType,
} from "../../../generated/prisma/client";
import { GenerateVoucherNumber } from "../../../helpars/generateVoucherNumber";
import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";
import {
  TMaterialRequest,
  TRAWRequestApproval,
} from "./InternalTransaction.type";
import {
  getUnitPriceFromInventory,
  getUnitPriceFromPmInventory,
  getUnitPriceFromProduct,
} from "../../../helpars/getUnitPrice";

const createRawRequest = async (payload: TMaterialRequest) => {
  const result = await prisma.$transaction(async (tx) => {
    const voucherNo = await GenerateVoucherNumber("REQ");
    const transaction = await tx.transactionInfo.create({
      data: {
        voucherNo: voucherNo,
        date: new Date(payload.date),
        voucherType: VoucherType.REQUEST,
        status: TxStatus.PENDING,
      },
    });
    if (
      Array.isArray(payload.rawMaterials) &&
      payload.rawMaterials.length > 0
    ) {
      await Promise.all(
        payload.rawMaterials.map(async (item) => {
          const isexist = await tx.rawMaterial.findUnique({
            where: {
              id: item.rawMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }
          await tx.requestInventory.create({
            data: {
              transactionId: transaction.id,
              date: new Date(payload.date),
              rawId: item.rawMaterialId,
              fromDepartment: Department.RMPM_STORE,
              toDepartment: Department.PRODUCTION,
              requestQty: item.quantity,
              status: Status.PENDING,
            },
          });
        }),
      );
    }
    if (
      Array.isArray(payload.packingMaterials) &&
      payload.packingMaterials.length > 0
    ) {
      await Promise.all(
        payload.packingMaterials.map(async (item) => {
          const isexist = await tx.packingMaterial.findUnique({
            where: {
              id: item.packingMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }
          await tx.requestInventory.create({
            data: {
              transactionId: transaction.id,
              date: new Date(payload.date),
              packingMaterialId: item.packingMaterialId,
              fromDepartment: Department.RMPM_STORE,
              toDepartment: Department.PRODUCTION,
              requestQty: item.quantity,
              status: Status.PENDING,
            },
          });
        }),
      );
    }
    return transaction;
    // transaction end
  });
  return result;
};

const getAllRequest = async (voucherTypa: VoucherType) => {
  const result = await prisma.transactionInfo.findMany({
    where: {
      voucherType: voucherTypa,
    },
    select: {
      id: true,
      voucherNo: true,
      date: true,
      status: true,
      requestInventories: {
        select: {
          id: true,
          fromDepartment: true,
          toDepartment: true,
          requestQty: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });
  return result;
};

const getRequestByid = async ({
  transactionId,
  voucherType,
}: {
  transactionId: number;
  voucherType: VoucherType;
}) => {
  const result = await prisma.transactionInfo.findUnique({
    where: {
      voucherType: voucherType,
      id: transactionId,
    },
    select: {
      id: true,
      voucherNo: true,
      date: true,
      status: true,
      requestInventories: true,
    },
  });
  return result;
};

const updateRequestRaw = async (
  requestInventoryId: number,
  payload: { rawMaterials: any[] },
) => {
  const result = await prisma.$transaction(async (tx) => {
    if (
      Array.isArray(payload.rawMaterials) &&
      payload.rawMaterials.length > 0
    ) {
      await Promise.all(
        payload.rawMaterials.map(async (item: any) => {
          const isexist = await tx.rawMaterial.findUnique({
            where: {
              id: item.rawMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }

          await tx.requestInventory.update({
            where: {
              id: requestInventoryId,
              rawId: item.rawMaterialId,
            },
            data: {
              requestQty: item.requestQty,
            },
          });
        }),
      );
    }
    return {};
    // transaction end
  });
  return result;
};
const approvalRawRequest = async (payload: TRAWRequestApproval) => {
  const result = await prisma.$transaction(async (tx) => {
    const transactioninfo = await tx.transactionInfo.findUnique({
      where: { id: payload.transactionId },
    });
    if (!transactioninfo) {
      throw new AppError(StatusCodes.NOT_FOUND, "transaction not found");
    }

    await tx.transactionInfo.update({
      where: {
        id: transactioninfo.id,
      },
      data: {
        status: TxStatus.CONFIRMED,
      },
    });
    // update previus record
    if (
      Array.isArray(payload.rawMaterials) &&
      payload.rawMaterials.length > 0
    ) {
      await Promise.all(
        payload.rawMaterials.map(async (item) => {
          const isexist = await tx.rawMaterial.findUnique({
            where: {
              id: item.rawMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }
          await tx.requestInventory.update({
            where: {
              id: item.requestInvetoryId,
            },
            data: {
              approvalQty: item.approvedQty,
              status: Status.ACTIVE,
            },
          });
        }),
      );
    }

    // update and create packing materials and request inventory status and approve qty update
    if (
      Array.isArray(payload.packingMaterials) &&
      payload.packingMaterials.length > 0
    ) {
      await Promise.all(
        payload.packingMaterials.map(async (item) => {
          const isexist = await tx.packingMaterial.findUnique({
            where: {
              id: item.packingMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }
          await tx.requestInventory.update({
            where: {
              id: item.requestInvetoryId,
            },
            data: {
              approvalQty: item.approvedQty,
              status: Status.ACTIVE,
            },
          });
        }),
      );
      // create the packing materials in pminventory
      await Promise.all(
        payload.packingMaterials.map(async (item) => {
          const isexist = await tx.packingMaterial.findUnique({
            where: {
              id: item.packingMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }
          const { pmUnitPrice, PmintegretedUnitePrice } =
            await getUnitPriceFromPmInventory(
              item.packingMaterialId,
              "RMPM_STORE",
            );
          await tx.pMInventory.create({
            data: {
              transactionId: payload.transactionId,
              date: new Date(payload.date),
              packingMaterialId: item.packingMaterialId,
              unitPrice: pmUnitPrice,
              department: Department.RMPM_STORE,
              quantityLess: item?.approvedQty,
              creditAmount: item.approvedQty * pmUnitPrice,
              integratedCreditAmount: item.approvedQty * PmintegretedUnitePrice,
              integratedUnitPrice: PmintegretedUnitePrice,
            },
          });
          // approvedQty add
          await tx.pMInventory.create({
            data: {
              transactionId: payload.transactionId,
              date: new Date(payload.date),
              packingMaterialId: item.packingMaterialId,
              unitPrice: pmUnitPrice,
              department: Department.PRODUCTION,
              quantityAdd: item?.approvedQty,
              debitAmount: item.approvedQty * pmUnitPrice,
              integratedDebitAmount: item.approvedQty * PmintegretedUnitePrice,
              integratedUnitPrice: PmintegretedUnitePrice,
            },
          });
        }),
      );
    }

    if (
      Array.isArray(payload.rawMaterials) &&
      payload.rawMaterials.length > 0
    ) {
      await Promise.all(
        payload.rawMaterials.map(async (item) => {
          const isexist = await tx.rawMaterial.findUnique({
            where: {
              id: item.rawMaterialId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }

          const { integretedUnitePrice, unitPrice, totalqty } =
            await getUnitPriceFromInventory(item.rawMaterialId, "RMPM_STORE");
          if (totalqty < item.approvedQty) {
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              "Insufficient stock of raw product",
            );
          }
          await tx.inventory.create({
            data: {
              transactionId: payload.transactionId,
              date: new Date(payload.date),
              rawId: item.rawMaterialId,
              unitPrice: unitPrice,
              department: Department.RMPM_STORE,
              quantityLess: item?.approvedQty,
              creditAmount: item.approvedQty * unitPrice,
              integratedCreditAmount: item.approvedQty * integretedUnitePrice,
              integratedUnitPrice: integretedUnitePrice,
            },
          });
          await tx.inventory.create({
            data: {
              transactionId: payload.transactionId,
              date: new Date(payload.date),
              rawId: item.rawMaterialId,
              unitPrice: unitPrice,
              department: Department.PRODUCTION,
              quantityAdd: item?.approvedQty,
              debitAmount: item.approvedQty * unitPrice,
              integratedDebitAmount: item.approvedQty * integretedUnitePrice,
              integratedUnitPrice: integretedUnitePrice,
            },
          });
        }),
      );
    }

    // transaction end
    return await tx.transactionInfo.findFirst({
      where: { id: payload.transactionId },
    });
  });
  return result;
};

// create request for product
const createRequestProduct = async (payload: any) => {
  const result = await prisma.$transaction(async (tx) => {
    const voucherNo = await GenerateVoucherNumber("TRANS");
    const transaction = await tx.transactionInfo.create({
      data: {
        voucherNo: voucherNo,
        date: new Date(payload.date),
        voucherType: VoucherType.TRANSFER,
        status: TxStatus.PENDING,
      },
    });
    if (Array.isArray(payload.products) && payload.products.length > 0) {
      await Promise.all(
        payload.products.map(async (item: any) => {
          const isexist = await tx.product.findUnique({
            where: {
              id: item.productId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }

          await tx.requestInventory.create({
            data: {
              transactionId: transaction.id,
              date: new Date(payload.date),
              productId: item.productId,
              fromDepartment: payload.fromDepartment,
              toDepartment: payload.toDepartment,
              requestQty: item.requestQty,
              status: Status.PENDING,
            },
          });
        }),
      );
    }
    return transaction;
    // transaction end
  });
  return result;
};

const updateRequestProduct = async (
  requestInventoryId: number,
  payload: { products: any[] },
) => {
  console.log(payload, requestInventoryId);
  const result = await prisma.$transaction(async (tx) => {
    if (Array.isArray(payload.products) && payload.products.length > 0) {
      await Promise.all(
        payload.products.map(async (item: any) => {
          const isexist = await tx.product.findUnique({
            where: {
              id: item.productId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Raw materials",
            );
          }

          await tx.requestInventory.update({
            where: {
              id: requestInventoryId,
              productId: item.productId,
            },
            data: {
              requestQty: item.requestQty,
            },
          });
        }),
      );
    }
    return {};
    // transaction end
  });
  return result;
};

const approvalProductTransferRequest = async (payload: any) => {
  const result = await prisma.$transaction(async (tx) => {
    const transactioninfo = await tx.transactionInfo.findUnique({
      where: { id: payload.transactionId },
    });
    if (!transactioninfo) {
      throw new AppError(StatusCodes.NOT_FOUND, "transaction not found");
    }

    await tx.transactionInfo.update({
      where: {
        id: transactioninfo.id,
        voucherType: VoucherType.TRANSFER,
      },
      data: {
        status: TxStatus.CONFIRMED,
      },
    });
    // update previus record
    if (Array.isArray(payload.products) && payload.products.length > 0) {
      await Promise.all(
        payload.products.map(async (item: any) => {
          console.log(item, "item ");
          const isexist = await tx.product.findUnique({
            where: {
              id: item.productId,
            },
          });
          if (!isexist) {
            throw new AppError(
              StatusCodes.NOT_FOUND,
              "There is no Productrials",
            );
          }
          await tx.requestInventory.update({
            where: {
              id: item?.requestInvetoryId,
            },
            data: {
              approvalQty: item.approvedQty,
              status: Status.ACTIVE,
            },
          });
        }),
      );
      await Promise.all(
        payload.products.map(async (item: any) => {
          const { productIntegretedUnitePrice, productUnitPrice, totalqty } =
            await getUnitPriceFromProduct(item.productId, "PRODUCTION");
          if (totalqty < item.approvalQty) {
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              "Insufficient stock of raw product",
            );
          }
          await tx.inventory.create({
            data: {
              transactionId: payload.transactionId,
              date: new Date(payload.date),
              productId: item.productId,
              unitPrice: productUnitPrice,
              department: Department.PRODUCTION,
              quantityLess: item?.approvedQty,
              creditAmount: item.approvedQty * productUnitPrice,
              integratedUnitPrice: productIntegretedUnitePrice,
              integratedCreditAmount:
                item.approvedQty * productIntegretedUnitePrice,
            },
          });
          // quantity add
          await tx.inventory.create({
            data: {
              transactionId: payload.transactionId,
              date: new Date(payload.date),
              productId: item.productId,
              unitPrice: productUnitPrice,
              department: Department.FG_STORE,
              quantityAdd: item?.approvedQty,
              debitAmount: item.approvedQty * productUnitPrice,
              integratedUnitPrice: productIntegretedUnitePrice,
              integratedDebitAmount:
                item.approvedQty * productIntegretedUnitePrice,
            },
          });
        }),
      );
    }
    // transaction end
    return await tx.transactionInfo.findFirst({
      where: { id: payload.transactionId },
    });
  });
  return result;
};

export const internalTransactionService = {
  createRawRequest,
  approvalRawRequest,
  getAllRequest,
  getRequestByid,
  createRequestProduct,
  approvalProductTransferRequest,
  updateRequestProduct,
  updateRequestRaw,
};
