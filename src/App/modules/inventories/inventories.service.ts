import { date } from "zod";

import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { Department, Inventory } from "../../../generated/prisma/client";

const getInventory = async () => {
  return await prisma.inventory.findMany({
    orderBy: [{ productId: "asc" }, { rawId: "asc" }],
  });
};
const getInventoryById = async (id: number) => {
  return await prisma.inventory.findFirst({
    where: {
      id,
    },
    include: {
      product: true,
      raWMaterial: true,
    },
  });
};

const getInventoryAggValueById = async (query: { department: Department; itemType: string, productId: number, rawId: number; packingMaterialId: number }) => {

  if (query.itemType === "product") {
    let startDate;
    const getDate = await prisma.inventory.findFirst({
      where: {
        productId: Number(query.productId),
        isOpening: true,
      },
      orderBy: [{ id: "desc" }],
    });
    if (getDate && getDate.date) {
      startDate = getDate?.date;
    } else if (!getDate) {
      const getDate = await prisma.inventory.findFirst({
        where: {
          productId: Number(query.productId)
        },
        orderBy: [{ id: "desc" }],
      });
      startDate = getDate?.date
    } else {
      throw new Error("No Product Found")
    }

    const result = await prisma.inventory.aggregate({
      where: {
        productId: Number(query.productId),
        department: query.department,
        date: {
          gte: startDate,
        },
      },
      _sum: {
        quantityAdd: true,
        quantityLess: true,
        debitAmount: true,
        creditAmount: true,
        integratedDebitAmount: true,
        integratedCreditAmount: true,
      },
    });
    // const netQuantity = Number(result._sum.quantityAdd!) - Number(result._sum.quantityLess!);
    const netQuantity = Math.max(
      0,
      Number(result._sum.quantityAdd!) - Number(result._sum.quantityLess!)
    );
    const netAmount = Number(result._sum.debitAmount!) - Number(result._sum.creditAmount!);
    const netIntegratedAmount = Number((Number(result._sum.integratedDebitAmount!) - Number(result._sum.integratedCreditAmount!)).toFixed(2));
    // console.log(netAmount)

    return { netQuantity, netAmount, netIntegratedAmount };
  }

  if (query.itemType === "raw") {
    let startDate;
    const getDate = await prisma.inventory.findFirst({
      where: {
        rawId: Number(query.rawId),
        isOpening: true,
      },
      orderBy: [{ id: "desc" }],
    });
    if (getDate && getDate.date) {
      startDate = getDate?.date;
    } else if (!getDate) {
      const getDate = await prisma.inventory.findFirst({
        where: {
          rawId: Number(query.rawId)
        },
        orderBy: [{ id: "desc" }],
      });
      startDate = getDate?.date
    } else {
      throw new Error("No Product Found")
    }

    const result = await prisma.inventory.aggregate({
      where: {
        rawId: Number(query.rawId),
        date: {
          gte: startDate
        },
      },
      _sum: {
        quantityAdd: true,
        quantityLess: true,
        debitAmount: true,
        creditAmount: true,
        integratedDebitAmount: true,
        integratedCreditAmount: true,
      },
    });
    // const netQuantity = Number(result._sum.quantityAdd!) - Number(result._sum.quantityLess!);
    const netQuantity = Math.max(
      0,
      Number(result._sum.quantityAdd!) - Number(result._sum.quantityLess!)
    );
    const netAmount = Number(result._sum.debitAmount!) - Number(result._sum.creditAmount!);
    const netIntegratedAmount = Number((Number(result._sum.integratedDebitAmount!) - Number(result._sum.integratedCreditAmount!)).toFixed(2));
    return { netQuantity, netAmount, netIntegratedAmount };
  }
  if (query.itemType === "pmmaterial") {
    let startDate;
    const getDate = await prisma.pMInventory.findFirst({
      where: {
        packingMaterialId: Number(query.packingMaterialId),
        isOpening: true,
      },
      orderBy: [{ id: "desc" }],
    });
    if (getDate && getDate.date) {
      startDate = getDate?.date;
    } else if (!getDate) {
      const getDate = await prisma.pMInventory.findFirst({
        where: {
          packingMaterialId: Number(query.packingMaterialId)
        },
        orderBy: [{ id: "desc" }],
      });
      startDate = getDate?.date
    } else {
      throw new Error("No Product Found")
    }
    const result = await prisma.pMInventory.aggregate({
      where: {
        packingMaterialId: Number(query.packingMaterialId),
        date: {
          gte: startDate,
        },
      },
      _sum: {
        quantityAdd: true,
        quantityLess: true,
        debitAmount: true,
        creditAmount: true,
        integratedDebitAmount: true,
        integratedCreditAmount: true,
      },
    });
    // const netQuantity = Number(result._sum.quantityAdd!) - Number(result._sum.quantityLess!);
    const netQuantity = Math.max(
      0,
      Number(result._sum.quantityAdd!) - Number(result._sum.quantityLess!)
    );
    const netAmount = Number(result._sum.debitAmount!) - Number(result._sum.creditAmount!);
    const netIntegratedAmount = Number((Number(result._sum.integratedDebitAmount!) - Number(result._sum.integratedCreditAmount!)).toFixed(2));

    return { netQuantity, netAmount, netIntegratedAmount };
  }
};

const updateInventory = async (id: number, payload: Inventory) => {
  return await prisma.inventory.updateMany({
    where: {},
    data: {},
  });
};

// const deleteInventory = async (id: number, payload: Inventory) => {
//   return console.log("first");
// };

//get last rate of raw material
const getLastRawMaterialRate = async (ids: number[]) => {
  const result = await Promise.all(
    ids.map(async (id) => {
      return await prisma.inventory.findFirst({
        where: {
          rawId: id,
        },
        orderBy: [{ id: "desc" }],
        select: {
          rawId: true,
          unitPrice: true,
          quantityAdd: true,
        },
      });
    }),
  );
  return result;
};

const getLastVoucherQty = async (queryIds: {
  rawId?: number;
  pmMaterialId?: number;
}) => {
  let result;
  // console.log(rawId, "raw id")
  if (queryIds.rawId !== undefined) {
    const resultres = await prisma.inventory.findFirst({
      where: {
        rawId: queryIds?.rawId,
      },
      orderBy: [{ transactionId: "desc" }],
      select: {
        rawId: true,
        quantityLess: true,
      },
    });
    // console.log(resultres, "resultres")
    result = resultres;
  }
  if (queryIds?.pmMaterialId !== undefined) {
    const pmresult = await prisma.pMInventory.findFirst({
      where: {
        packingMaterialId: queryIds.pmMaterialId,
      },
      orderBy: [{ transactionId: "desc" }],
      select: {
        id: true,
        quantityLess: true,
      },
    });
    result = pmresult;
  }
  return result;
};

export const InventoryService = {
  getInventory,
  getInventoryById,
  getInventoryAggValueById,
  updateInventory,
  // deleteInventory,
  getLastVoucherQty,
  getLastRawMaterialRate,
};
