import { StatusCodes } from "http-status-codes";
import AppError from "../App/errors/AppError";
import prisma from "../shared/prisma";
import { Department, Status } from "../generated/prisma";

export const getUnitPriceFromInventory = async (rawMaterialId: number, department: Department) => {
    const isexist = await prisma.rawMaterial.findFirst({ where: { id: rawMaterialId } });
    if (!isexist) { throw new AppError(StatusCodes.NOT_FOUND, "raw materials not found") }

    const rawtotal = await prisma.inventory.aggregate({
        _sum: {
            quantityAdd: true,
            quantityLess: true,
            debitAmount: true,
            integratedDebitAmount: true,
            creditAmount: true,
            integratedCreditAmount: true
        },
        where: {
            date: {
                gte: new Date(isexist.openingDate),
                lte: new Date()
            },
            rawId: rawMaterialId,
            status: Status.ACTIVE,
            department: department
        }
    })
    const totalqty = (rawtotal._sum.quantityAdd || 0) - (rawtotal._sum.quantityLess || 0)
    const totalamount = (rawtotal._sum.debitAmount || 0) - (rawtotal._sum.creditAmount || 0)
    const totalIntegretedamount = (rawtotal._sum.integratedDebitAmount || 0) - (rawtotal._sum.integratedCreditAmount || 0)
    const unitPrice = totalamount / totalqty;
    const integretedUnitePrice = totalIntegretedamount / totalqty;

    return { unitPrice, integretedUnitePrice, totalqty }
}


export const getUnitPriceFromPmInventory = async (packingMaterialId: number, department: Department) => {
    const isexist = await prisma.packingMaterial.findFirst({ where: { id: packingMaterialId } });
    if (!isexist) { throw new AppError(StatusCodes.NOT_FOUND, "packing materials not found") }

    const rawtotal = await prisma.pMInventory.aggregate({
        _sum: {
            quantityAdd: true,
            quantityLess: true,
            debitAmount: true,
            integratedDebitAmount: true,
            creditAmount: true,
            integratedCreditAmount: true
        },
        where: {
            date: {
                gte: new Date(isexist.openingDate),
                lte: new Date()
            },
            packingMaterialId: packingMaterialId,
            status: Status.ACTIVE,
            department: department
        }
    })
    const totalqty = (rawtotal._sum.quantityAdd || 0) - (rawtotal._sum.quantityLess || 0)
    const totalamount = (rawtotal._sum.debitAmount || 0) - (rawtotal._sum.creditAmount || 0)
    const totalIntegretedamount = (rawtotal._sum.integratedDebitAmount || 0) - (rawtotal._sum.integratedCreditAmount || 0)
    const pmUnitPrice = totalamount / totalqty;
    const PmintegretedUnitePrice = totalIntegretedamount / totalqty;

    return { pmUnitPrice, PmintegretedUnitePrice, totalqty }
}


export const getUnitPriceFromProduct = async (prodcutId: number, department: Department) => {
    const isexist = await prisma.product.findFirst({ where: { id: prodcutId } });
    if (!isexist) { throw new AppError(StatusCodes.NOT_FOUND, "Product not found") }

    const rawtotal = await prisma.inventory.aggregate({
        _sum: {
            quantityAdd: true,
            quantityLess: true,
            debitAmount: true,
            integratedDebitAmount: true,
            creditAmount: true,
            integratedCreditAmount: true
        },
        where: {
            date: {
                gte: new Date(isexist.openingDate),
                lte: new Date()
            },
            productId: prodcutId,
            status: Status.ACTIVE,
            department: department
        }
    })
    const totalqty = (rawtotal._sum.quantityAdd || 0) - (rawtotal._sum.quantityLess || 0)
    const totalamount = (rawtotal._sum.debitAmount || 0) - (rawtotal._sum.creditAmount || 0)
    const totalIntegretedamount = (rawtotal._sum.integratedDebitAmount || 0) - (rawtotal._sum.integratedCreditAmount || 0)
    const productUnitPrice = totalamount / totalqty;
    const productIntegretedUnitePrice = totalIntegretedamount / totalqty;

    return { productIntegretedUnitePrice, productUnitPrice, totalqty }
}