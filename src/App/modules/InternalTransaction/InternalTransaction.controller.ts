import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { internalTransactionService } from "./InternalTransaction.service";
import { Request, Response } from "express";
import { VoucherType } from "../../../generated/prisma";

const createRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await internalTransactionService.createRawRequest(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Parties retrived Successfully",
        data: result,
    });
});

const getAllRequest = catchAsync(async (req: Request, res: Response) => {
    const voucherType = req.query.voucherType as VoucherType;
    const result = await internalTransactionService.getAllRequest(voucherType);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "All Request Successfully",
        data: result,
    });
});

const getRequestById = catchAsync(async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const voucherType = req.query.voucherType as VoucherType;
    const result = await internalTransactionService.getRequestByid({ transactionId: id, voucherType });
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Request retrived Successfully",
        data: result,
    });
});

const approveRawRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await internalTransactionService.approvalRawRequest(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Parties retrived Successfully",
        data: result,
    });
});
const createProductRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await internalTransactionService.createRequestProduct(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Product Request Created Successfully",
        data: result,
    });
});
const approveProductRequest = catchAsync(async (req: Request, res: Response) => {
    const result = await internalTransactionService.approvalProductTransferRequest(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Product approved Successfully",
        data: result,
    });
});


export const internalTransactionController = { createRequest, getAllRequest, approveRawRequest, getRequestById, createProductRequest, approveProductRequest }