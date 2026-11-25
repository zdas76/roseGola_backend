import {
  AccountsItem,
  Department,
  Party,
  TransactionInfo,
  TxStatus,
  VoucherType,
} from "../../../generated/prisma/client";
import { GenerateVoucherNumber } from "../../../helpars/generateVoucherNumber";
import { getUnitPriceFromInventory, getUnitPriceFromPmInventory, getUnitPriceFromProduct } from "../../../helpars/getUnitPrice";
import prisma from "../../../shared/prisma";
import { ICreatePurchasePayload } from "../InternalTransaction/InternalTransaction.type";
import { PurchasePayload, TItems } from "./journal.interface";

//Create Purchase Received Voucher
const createPurchestReceivedIntoDB = async (payload: ICreatePurchasePayload) => {
  const createPurchestVoucher = await prisma.$transaction(async (tx) => {
    const partyExists = await tx.party.findUnique({
      where: { id: payload.partyOrcustomerId },
    });
    if (!partyExists) {
      throw new Error(
        `Invalid partyOrcustomerId: ${payload.partyOrcustomerId}. No matching Party found.`,
      );
    }
    const voucherNo = await GenerateVoucherNumber("PRV");
    // step 1. create transaction entries
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          invoiceNo: payload.invoiceNo,
          voucherNo: voucherNo,
          date: payload.date,
          voucherType: VoucherType.PURCHASE,
          partyId: partyExists.id,
        },
      });

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error("Invalid data: items must be a non-empty array");
    }
    let inventoryData: any = [];
    //step 3: Prepare Inventory Data
    if (payload.itemType === "RAW_MATERIAL") {
      await Promise.all(
        payload.items.map(async (item: any) => {
          const { integretedUnitePrice } = await getUnitPriceFromInventory(item.rawMaterialId, "RMPM_STORE")
          inventoryData.push({
            transactionId: createTransactionInfo.id,
            date: payload.date,
            rawId: item.rawOrProductId,
            unitPrice: item.unitPrice,
            department: Department.RMPM_STORE,
            quantityAdd: item.quantityAdd,
            discount: item?.discount || 0,
            debitAmount: item.debitAmount,
            integratedUnitPrice: integretedUnitePrice,
            integratedDebitAmount: integretedUnitePrice * item.quantityAdd,
          })
        })
      )
    } else if (payload.itemType === "PRODUCT") {
      await Promise.all(
        payload.items.map(async (item: any) => {
          inventoryData.push({
            transactionId: createTransactionInfo.id,
            productId: item.rawOrProductId,
            unitPrice: item.unitPrice,
            quantityAdd: item.quantityAdd,
            discount: item?.discount || 0,
            date: payload.date,
            department: Department.RMPM_STORE,
            debitAmount: item.debitAmount,
            integratedDebitAmount: item.integratedUnitPrice * item.quantityAdd,
            integratedUnitPrice: item.integratedUnitPrice
          })
        }))
    }
    //Step 3: Insert Inventory Records
    await Promise.all(
      inventoryData.map((item: any) =>
        tx.inventory.create({
          data: item,
        }),
      ),
    );
    let journalItem: any[] = [];
    let purchaseInventory;
    if (payload?.itemType === "PRODUCT") {
      const debiteAccountsId = await tx.accountsItem.findFirst({
        where: {
          accountsItemName: {
            contains: "prodcuct inventory",
          },
        },
      });
      if (!debiteAccountsId) {
        const lastAccountsItemId = await tx.accountsItem.findFirst({
          where: {
            accountHeadId: "01",
          },
          orderBy: {
            id: "desc"
          }
        });
        const newRandomNumber = Number(lastAccountsItemId?.accountsItemId.slice(0)) + 1;
        purchaseInventory = await tx.accountsItem.create({
          data: {
            accountHeadId: "01",
            accountsItemId: newRandomNumber.toString(),
            accountsItemName: "Prodcuct Inventory"
          }
        })
      } else {
        purchaseInventory = debiteAccountsId
      }
    } else if (payload.itemType === "RAW_MATERIAL") {

      const debiteAccountsId = await tx.accountsItem.findFirst({
        where: {
          accountsItemName: {
            contains: "raw inventory",
          },
        },
      });
      if (!debiteAccountsId) {
        const lastAccountsItemId = await tx.accountsItem.findFirst({
          where: {
            accountHeadId: "01",
          },
          orderBy: {
            id: "desc"
          }
        });
        const newRandomNumber = Number(lastAccountsItemId?.accountsItemId.slice(0)) + 1;
        purchaseInventory = await tx.accountsItem.create({
          data: {
            accountHeadId: "01",
            accountsItemId: newRandomNumber.toString(),
            accountsItemName: "Raw Inventory"
          }
        })
      } else {
        purchaseInventory = debiteAccountsId
      }
    }
    journalItem.push({
      transectionId: createTransactionInfo.id,
      accountsItemId: purchaseInventory!.id,
      debitAmount: payload.grandTotal,
      narration: "Purchase Inventory Received",
      date: new Date(payload.date),
    });


    let paymentItemId;
    const pyamentItem = await tx.accountsItem.findFirst({
      where: {
        accountsItemName: {
          contains: "accounts payable",
        },
      },
    })
    if (pyamentItem) {
      paymentItemId = pyamentItem?.id
    } else {
      const lastAccountsItemId = await tx.accountsItem.findFirst({
        where: {
          accountHeadId: "04",
        },
        orderBy: {
          id: "desc"
        }
      });
      const newRandomNumber = Number(lastAccountsItemId?.accountsItemId.slice(0)) + 1;
      const cretedpayable = await tx.accountsItem.create({
        data: {
          accountHeadId: "04",
          accountsItemId: newRandomNumber.toString(),
          accountsItemName: "accounts payable"
        }
      })
      paymentItemId = cretedpayable?.id
    }
    journalItem.push({
      transectionId: createTransactionInfo.id,
      accountsItemId: paymentItemId,
      creditAmount: payload.grandTotal,
      narration: "Payment on creadit",
      date: new Date(payload.date),
    });
    //Step 8: Insert Journal Records
    await tx.journal.createMany({
      data: journalItem,
    });
    // create payment voucher for make payment
    const paymentVoucherNo = await GenerateVoucherNumber("PV")
    const expTransactioninfo = await tx.transactionInfo.create({
      data: {
        invoiceNo: createTransactionInfo?.voucherNo,
        voucherNo: paymentVoucherNo,
        date: payload.date,
        voucherType: VoucherType.PAYMENT,
        status: TxStatus.PENDING
      },
    });

    const expJournal: any[] = [];
    payload.expenseItems?.map((item: { expItemId: number; amount: number; narration: string }) => {
      expJournal.push({
        transectionId: expTransactioninfo.id,
        accountsItemId: item?.expItemId,
        debitAmount: item.amount,
        narration: item?.narration,
        date: new Date(payload.date),
        status: TxStatus.DUE,
      })
    })
    return createTransactionInfo;
  });
  return createPurchestVoucher;
};
//Create Purchase Received Voucher
const createPurchestReceivedPackingMaterialIntoDB = async (payload: PurchasePayload) => {
  const createPurchestVoucher = await prisma.$transaction(async (tx) => {
    const partyExists = await tx.party.findUnique({
      where: { id: payload.partyOrcustomerId },
    });
    if (!partyExists) {
      throw new Error(
        `Invalid partyOrcustomerId: ${payload.partyOrcustomerId}. No matching Party found.`,
      );
    }
    const voucherNo = await GenerateVoucherNumber("PRPMV");
    // step 1. create transaction entries
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          invoiceNo: payload.invoiceNo || null,
          voucherNo: voucherNo,
          date: new Date(payload.date),
          voucherType: VoucherType.PURCHASE,
          partyId: partyExists.id,
        },
      });

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error("Invalid data: items must be a non-empty array");
    }

    //step 3: Prepare Inventory data for packing materials
    await Promise.all(
      payload.items.map(async (item: TItems) => {
        const pmInvnItem = {
          transactionId: createTransactionInfo.id,
          date: new Date(payload.date),
          packingMaterialId: item.packingMaterialId,
          unitPrice: item.unitPrice,
          department: Department.RMPM_STORE,
          quantityAdd: item.quantityAdd,
          discount: item?.discount || 0,
          debitAmount: item.quantityAdd * item.unitPrice,
          integratedUnitPrice: item.integratedUnitPrice,
          integratedDebitAmount: item.integratedUnitPrice * item.quantityAdd,
        };
        await tx.pMInventory.create({
          data: pmInvnItem
        })
      }));

    let journalItem: any[] = [];
    let pmaccountsItem;
    const accountsItempm = await tx.accountsItem.findFirst({
      where: {
        accountsItemName: {
          contains: "pm inventory",
        },
      },
    });
    if (!accountsItempm) {
      const lastAccountsItemId = await tx.accountsItem.findFirst({
        where: {
          accountHeadId: "01",
        },
        orderBy: {
          id: "desc"
        }
      });
      const newRandomNumber = Number(lastAccountsItemId?.accountsItemId) + 1;
      pmaccountsItem = await tx.accountsItem.create({
        data: {
          accountHeadId: "01",
          accountsItemId: newRandomNumber.toString(),
          accountsItemName: "PM Inventory"
        }
      })
    } else {
      pmaccountsItem = accountsItempm
    }
    // get total for debit items
    const totalProductAmout = payload.items.reduce(
      (total: number, item: TItems) => total + (Number(item.debitAmount) || 0),
      0,
    );

    journalItem.push({
      transectionId: createTransactionInfo.id,
      accountsItemId: pmaccountsItem.id,
      debitAmount: totalProductAmout,
      // integratedDebitAmount: 
      narration: "Purchase Inventory Received",
      date: new Date(payload.date),
    });

    let paymentItemId;
    const pyamentItem = await tx.accountsItem.findFirst({
      where: {
        accountsItemName: {
          contains: "accounts payable",
        },
      },
    })
    if (pyamentItem) {
      paymentItemId = pyamentItem?.id
    } else {
      const lastAccountsItemId = await tx.accountsItem.findFirst({
        where: {
          accountHeadId: "04",
        },
        orderBy: {
          id: "desc"
        }
      });
      const newRandomNumber = Number(lastAccountsItemId?.accountsItemId) + 1;
      const cretedpayable = await tx.accountsItem.create({
        data: {
          accountHeadId: "04",
          accountsItemId: newRandomNumber.toString(),
          accountsItemName: "accounts payable"
        }
      })
      paymentItemId = cretedpayable?.id
    }


    journalItem.push({
      transectionId: createTransactionInfo.id,
      accountsItemId: paymentItemId,
      creditAmount: totalProductAmout,
      narration: "Payment on creadit",
      date: new Date(payload.date),
    });
    //Step 8: Insert Journal Records
    await tx.journal.createMany({
      data: journalItem,
    });

    // --------------------------------------------------make payment for expense---------------------------------

    const paymentVoucherNo = await GenerateVoucherNumber("PV")
    const expTransactioninfo = await tx.transactionInfo.create({
      data: {
        invoiceNo: createTransactionInfo?.voucherNo,
        voucherNo: paymentVoucherNo,
        date: new Date(payload.date),
        voucherType: VoucherType.PAYMENT,
        status: TxStatus.PENDING
      },
    });

    const expJournal: any[] = [];
    await Promise.all(payload.expenseItems?.map((item: { expItemId: number; amount: number; narration: string }) => {
      expJournal.push({
        transectionId: expTransactioninfo.id,
        accountsItemId: item?.expItemId,
        debitAmount: item.amount,
        narration: item?.narration,
        date: new Date(payload.date),
        status: TxStatus.DUE,
      })
    }))
    return createTransactionInfo;

  });
  return { createPurchestVoucher };
};

// create Salse Voucher
const createSalesVoucher = async (payload: any) => {
  const createSalseVoucher = await prisma.$transaction(async (tx) => {
    let isParty: Party | null = null;

    if (payload.partyType === "DISTRIBUTOR") {
      isParty = await tx.party.findFirst({
        where: {
          id: payload.partyOrcustomerId,
          isDeleted: false,
        },
      });
      if (!isParty) {
        throw new Error(`Invalid Vendor`);
      }
    }
    // generate the dynamic sales voucher 
    const voucherNos = await GenerateVoucherNumber("SV")
    // step 1. create transaction entries
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          voucherNo: voucherNos,
          voucherType: VoucherType.SALES,
          partyId: isParty?.id || null,
          date: payload.date,
        },
      });

    // 2. create bank transaction
    const BankTXData: {
      transectionId: number;
      bankAccountId: number;
      debitAmount: number;
      date: Date;
    }[] = [];

    for (const item of payload.debitItem) {
      if (item.bankAccountId) {
        BankTXData.push({
          transectionId: createTransactionInfo.id,
          bankAccountId: item.bankAccountId,
          date: payload.date,
          debitAmount: item?.debitAmount,
        });
      }
    }

    if (BankTXData && BankTXData.length > 0) {
      await tx.bankTransaction.createMany({
        data: BankTXData,
      });
    }

    if (!Array.isArray(payload.salseItem) || payload.salseItem.length === 0) {
      throw new Error("Invalid data: salseItem must be a non-empty array");
    }

    // step 2: prepiar inventory data
    const inventoryData = payload.salseItem.map((item: any) => ({
      transactionId: createTransactionInfo.id,
      productId: item.rawOrProductId,
      date: payload.date,
      unitPrice: item.unitPrice || 0,
      quantityLess: item.quantity || 0,
      discount: item.discount || 0,
      creditAmount: item.creditAmount,
      department: Department.FG_STORE
    }));

    //Step 3: Insert Inventory Records
    await Promise.all(
      inventoryData.map((item: any) =>
        tx.inventory.create({
          data: item,
        }),
      ),
    );

    if (!Array.isArray(payload.debitItem) || payload.debitItem.length === 0) {
      throw new Error("Invalid data: items must be a non-empty array");
    }

    let journalItems = [];
    payload.debitItem.map((item: any) =>
      journalItems.push({
        transectionId: createTransactionInfo.id,
        accountsItemId: item.accountsItemId,
        date: payload.date,
        debitAmount: item.debitAmount,
        narration: item?.narration || "",
      }),
    );

    if (payload.totalDiscount && payload.totalDiscount > 0) {
      const discountItem: AccountsItem | any = await tx.accountsItem.findFirst({
        where: {
          accountsItemName: {
            contains: "discount",
          },
        },
      });

      if (payload.totalDiscount && discountItem) {
        journalItems.push({
          transectionId: createTransactionInfo.id,
          accountsItemId: parseInt(discountItem.id!),
          debitAmount: payload.totalDiscount,
          narration: "Discount",
          date: payload.date,
        });
      }
    }

    const debiteAccountsId = await tx.accountsItem.findFirst({
      where: {
        accountsItemName: {
          contains: "inventory",
        },
      },
    });

    if (!debiteAccountsId) {
      throw new Error("Inventory Accounts Item not found");
    }

    journalItems.push({
      transectionId: createTransactionInfo.id,
      accountsItemId: debiteAccountsId.id,
      creditAmount: payload.grandTotal,
      narration: "Purchase Inventory Received",
      date: new Date(payload.date),
    });

    const debitAmount = journalItems.reduce(
      (total: number, item: any) => total + (Number(item.debitAmount) || 0),
      0,
    );

    const creditAmount = journalItems.reduce(
      (total: number, item: any) => total + (Number(item.creditAmount) || 0),
      0,
    );

    if (debitAmount !== creditAmount) {
      throw new Error("Debit and Credit amounts do not match");
    }

    await tx.journal.createMany({
      data: journalItems,
    });
    return createTransactionInfo;
  });

  return createSalseVoucher;
};

const createMaterialSaleVoucher = async (payload: any) => {
  const createSalseVoucher = await prisma.$transaction(async (tx) => {
    let isParty: Party | null = null;

    if (payload.partyType === "VENDOR") {
      isParty = await tx.party.findFirst({
        where: {
          id: payload.partyOrcustomerId,
          isDeleted: false,
        },
      });

      if (!isParty) {
        throw new Error(`Invalid Vendor`);
      }
    }

    // step 1. create transaction entries
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          voucherNo: payload.voucherNo,
          voucherType: VoucherType.SALES,
          partyId: isParty?.id || null,
          date: payload.date,
        },
      });

    // 2. create bank transaction
    const BankTXData: {
      transectionId: number;
      bankAccountId: number;
      debitAmount: number;
      date: Date;
    }[] = [];

    for (const item of payload.debitItem) {
      if (item.bankAccountId) {
        BankTXData.push({
          transectionId: createTransactionInfo.id,
          bankAccountId: item.bankAccountId,
          date: payload.date,
          debitAmount: item?.debitAmount,
        });
      }
    }

    if (BankTXData && BankTXData.length > 0) {
      await tx.bankTransaction.createMany({
        data: BankTXData,
      });
    }

    if (!Array.isArray(payload.salseItem) || payload.salseItem.length === 0) {
      throw new Error("Invalid data: salseItem must be a non-empty array");
    }
    // step 2: prepiar inventory data
    const inventoryData = payload.salseItem.map((item: any) => ({
      transactionId: createTransactionInfo.id,
      rawId: item.rawOrProductId,
      date: payload.date,
      unitPrice: item.unitPrice || 0,
      quantityLess: item.quantity || 0,
      discount: item.discount || 0,
      creditAmount: item.creditAmount,
    }));

    //Step 3: Insert Inventory Records
    await Promise.all(
      inventoryData.map((item: any) =>
        tx.inventory.create({
          data: item,
        }),
      ),
    );

    if (!Array.isArray(payload.debitItem) || payload.debitItem.length === 0) {
      throw new Error("Invalid data: items must be a non-empty array");
    }

    let journalItems = [];
    payload.debitItem.map((item: any) =>
      journalItems.push({
        transectionId: createTransactionInfo.id,
        accountsItemId: item.accountsItemId,
        date: payload.date,
        debitAmount: item.debitAmount,
        narration: item?.narration || "",
      }),
    );

    if (payload.totalDiscount && payload.totalDiscount > 0) {
      const discountItem: AccountsItem | any = await tx.accountsItem.findFirst({
        where: {
          accountsItemName: {
            contains: "discount",
          },
        },
      });

      if (payload.totalDiscount && discountItem) {
        journalItems.push({
          transectionId: createTransactionInfo.id,
          accountsItemId: parseInt(discountItem.id!),
          debitAmount: payload.totalDiscount,
          narration: "Discount",
          date: payload.date,
        });
      }
    }

    const debiteAccountsId = await tx.accountsItem.findFirst({
      where: {
        accountsItemName: {
          contains: "inventory",
        },
      },
    });

    if (!debiteAccountsId) {
      throw new Error("Inventory Accounts Item not found");
    }

    journalItems.push({
      transectionId: createTransactionInfo.id,
      accountsItemId: debiteAccountsId.id,
      creditAmount: payload.grandTotal,
      narration: "Purchase Inventory Received",
      date: new Date(payload.date),
    });

    const debitAmount = journalItems.reduce(
      (total: number, item: any) => total + (Number(item.debitAmount) || 0),
      0,
    );

    const creditAmount = journalItems.reduce(
      (total: number, item: any) => total + (Number(item.creditAmount) || 0),
      0,
    );

    if (debitAmount !== creditAmount) {
      throw new Error("Debit and Credit amounts do not match");
    }

    await tx.journal.createMany({
      data: journalItems,
    });
    return createTransactionInfo;
  });

  return createSalseVoucher;
};
// Create Payment Voucher
const createPaymentVoucher = async (payload: any) => {
  const createVoucher = await prisma.$transaction(async (tx) => {
    let isParty: Party | null = null;

    if (payload.partyType === "VENDOR" || "PARTY") {
      isParty = await tx.party.findFirst({
        where: {
          id: payload.partyId,
          isDeleted: false,
        },
      });

      if (!isParty) {
        throw new Error(
          `Invalid partyId: ${payload.partyOrcustomerId}. No matching Party or Customer found.`,
        );
      }
    }

    const voucherNo = await GenerateVoucherNumber("PV")
    // Create Transaction Voucher
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          voucherNo: voucherNo,
          voucherType: VoucherType.PAYMENT,
          partyId: isParty?.id || null,
          date: payload.date,
        },
      });

    // 2. create bank transaction
    const BankTXData: {
      transectionId: number;
      bankAccountId: number;
      creditAmount: number;
      date: Date;
    }[] = [];

    payload.creditItem.map(async (item: any) => {
      if (item.bankAccountId) {
        BankTXData.push({
          transectionId: createTransactionInfo.id,
          bankAccountId: item.bankAccountId,
          date: payload.date,
          creditAmount: Number(item.amount),
        });
      }
    });

    if (BankTXData && BankTXData.length > 0) {
      await tx.bankTransaction.createMany({
        data: BankTXData,
      });
    }

    if (!Array.isArray(payload.creditItem) || payload.creditItem.length === 0) {
      throw new Error("Invalid data: salseItem must be a non-empty array");
    }

    const journalCreditItems: {
      transectionId: number;
      accountsItemId: number;
      date: string;
      creditAmount: number;
      narration: string;
      checkOrRTGS: string;
    }[] = [];

    payload.creditItem.map((item: any) => {
      journalCreditItems.push({
        transectionId: createTransactionInfo.id,
        accountsItemId: item.accountsItemId,
        date: payload.date,
        creditAmount: Number(item.amount),
        narration: item?.narration || "",
        checkOrRTGS: item?.checkOrRTGS
      });
    });

    if (!Array.isArray(payload.debitItem) || payload.debitItem.length === 0) {
      throw new Error("Invalid data: Dabite Items must be a non-empty array");
    }

    // Step 7: Prepare Journal Credit Entries (For Payment Accounts)
    const journalDebitItems: {
      transectionId: number;
      accountsItemId: number;
      partyId: number | null;
      date: string;
      creditAmount: number;
      narration: string;
      checkOrRTGS: string;
    }[] = payload.debitItem.map((item: any) => ({
      transectionId: createTransactionInfo.id,
      accountsItemId: item.accountsItemId,
      date: payload.date,
      debitAmount: Number(item.amount),
      narration: item?.narration || "",
      checkOrRTGS: item?.checkOrRTGS,
    }));

    const journalItems = [...journalDebitItems, ...journalCreditItems];

    await tx.journal.createMany({
      data: journalItems,
    });
    return createTransactionInfo.id;
  });

  const result = await prisma.transactionInfo.findFirst({
    where: { id: createVoucher },
  });
  return result;
};

const createReceiptVoucher = async (payload: any) => {
  const createVoucher = await prisma.$transaction(async (tx) => {
    let isParty: Party | null = null;

    if (payload.partyType === "VENDOR" || "PARTY" || "DISTRIBUTOR") {
      isParty = await tx.party.findFirst({
        where: {
          id: payload.partyId,
          isDeleted: false,
        },
      });

      if (!isParty) {
        throw new Error(
          `Invalid partyId: ${payload.partyOrcustomerId}. No matching Party or Customer found.`,
        );
      }
    }

    // Create Transaction Voucher
    const voucherNo = await GenerateVoucherNumber("RV")
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          voucherNo: voucherNo,
          voucherType: VoucherType.RECEIVED,
          partyId: isParty?.id || null,
          date: payload.date,
        },
      });

    // 2. create bank transaction
    const BankTXData: {
      transectionId: number;
      bankAccountId: number;
      debitAmount: number;
      date: Date;
    }[] = [];

    payload.debitItem.map(async (item: any) => {
      if (item.bankAccountId) {
        BankTXData.push({
          transectionId: createTransactionInfo.id,
          bankAccountId: item.bankAccountId,
          date: payload.date,
          debitAmount: Number(item.amount),
        });
      }
    });

    if (BankTXData && BankTXData.length > 0) {
      await tx.bankTransaction.createMany({
        data: BankTXData,
      });
    }

    if (!Array.isArray(payload.debitItem) || payload.debitItem.length === 0) {
      throw new Error("Invalid data: salseItem must be a non-empty array");
    }

    const journalDebitItems: {
      transectionId: number;
      accountsItemId: number;
      debitAmount: number;
      narration: string;
      date: string;
    }[] = [];

    payload.debitItem.map((item: any) => {
      if (!item.bankAccountId) {
        journalDebitItems.push({
          transectionId: createTransactionInfo.id,
          accountsItemId: item.accountsItemId,
          date: payload.date,
          debitAmount: Number(item.amount),
          narration: item?.narration || "",
        });
      }
    });

    if (!Array.isArray(payload.creditItem) || payload.creditItem.length === 0) {
      throw new Error("Invalid data: salseItem must be a non-empty array");
    }

    // Step 7: Prepare Journal Credit Entries (For Payment Accounts)
    const journalCreditItems = payload.creditItem.map((item: any) => ({
      transectionId: createTransactionInfo.id,
      accountsItemId: item.accountsItemId,
      creditAmount: Number(item.amount),
      narration: item?.narration || "",
      date: payload.date,
    }));

    const journalItems = [...journalDebitItems, ...journalCreditItems];

    await tx.journal.createMany({
      data: journalItems,
    });
    return createTransactionInfo.id;
  });

  const result = await prisma.transactionInfo.findFirst({
    where: {
      id: createVoucher,
    },
    include: {
      journal: {
        select: {
          checkOrRTGS: true
        }
      }
    }
  });
  return result;
};

const createJournalVoucher = async (payload: any) => {
  const createJournal = await prisma.$transaction(async (tx) => {
    let partyExists;

    //check party
    if (payload.party) {
      partyExists = await tx.party.findFirst({
        where: { id: payload.partyId },
      });
    }

    const voucherNo = await GenerateVoucherNumber("JV")
    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          voucherNo: voucherNo,
          voucherType: VoucherType.JOURNAL,
          date: payload.date,
          partyId: partyExists?.id || null,
        },
      });

    //bank transaction
    let BankTXData;

    if (payload.debitBankId && payload.debitBankId > 0) {
      BankTXData = {
        transectionId: createTransactionInfo.id,
        bankAccountId: payload.debitBankId,
        date: payload.date,
        creditAmount: payload?.amount,
      };
    }

    if (payload.creditBankId && payload.creditBankId > 0) {
      BankTXData = {
        transectionId: createTransactionInfo.id,
        bankAccountId: payload.creditBankId,
        date: payload.date,
        debitAmount: payload?.amount,
      };
    }

    if (BankTXData) {
      await tx.bankTransaction.create({
        data: BankTXData,
      });
    }

    await tx.journal.createMany({
      data: [
        {
          transectionId: createTransactionInfo.id,
          accountsItemId: payload.creditItem,
          date: new Date(payload.date),
          creditAmount: payload.amount,
          narration: payload?.narration || "",
        },
        {
          transectionId: createTransactionInfo.id,
          accountsItemId: payload.debitItem,
          date: new Date(payload.date),
          debitAmount: payload.amount,
          narration: payload?.narration || "",
        },
      ],
    });

    return createTransactionInfo;
  });

  const result = await prisma.transactionInfo.findFirst({
    where: {
      id: createJournal.id,
    },
  });

  return result;
};

const createQantaVoucher = async (payload: any) => {
  const createJournal = await prisma.$transaction(async (tx) => {
    let partyExists;
    //check party
    if (payload.party) {
      partyExists = await tx.party.findFirst({
        where: { id: payload.partyId },
      });
    }

    const createTransactionInfo: TransactionInfo =
      await tx.transactionInfo.create({
        data: {
          voucherNo: payload.voucherNo,
          voucherType: VoucherType.JOURNAL,
          partyId: partyExists?.id || null,
          date: payload.date,
        },
      });

    let BankTXData;

    if (payload.debitBankId && payload.debitBankId > 0) {
      BankTXData = {
        transectionId: createTransactionInfo.id,
        bankAccountId: payload.debitBankId,
        date: payload.date,
        debitAmount: payload?.amount,
      };
    }

    if (payload.creditBankId && payload.creditBankId > 0) {
      BankTXData = {
        transectionId: createTransactionInfo.id,
        bankAccountId: payload.creditBankId,
        date: payload.date,
        creditAmount: payload?.amount,
      };
    }

    if (BankTXData) {
      await tx.bankTransaction.create({
        data: BankTXData,
      });
    }

    await tx.journal.createMany({
      data: [
        {
          transectionId: createTransactionInfo.id,
          accountsItemId: payload.creditItem,
          date: new Date(payload.date),
          creditAmount: payload.amount,
          narration: payload?.narration || "",
        },
        {
          transectionId: createTransactionInfo.id,
          accountsItemId: payload.debitItem,
          date: new Date(payload.date),
          debitAmount: payload.amount,
          narration: payload?.narration || "",
        },
      ],
    });

    return createTransactionInfo;
  });

  const result = await prisma.transactionInfo.findFirst({
    where: {
      id: createJournal.id,
    },
  });

  return result;
};

const getItemTotalByAccountId = async (payLoad: any) => {
  const getDate = await prisma.journal.findFirst({
    where: {
      accountsItemId: Number(payLoad.productId),
      isClosing: true,
    },

    orderBy: [{ id: "desc" }],
  });

  const result = await prisma.$queryRaw`
  
SELECT 
j.accountsItemId,
 
 SUM(IFNULL(j.debitAmount, 0)- IFNULL(j.creditAmount, 0)) AS netAmount
    
  FROM journals j
  LEFT JOIN transaction_info t ON t.id = j.transectionId
  WHERE j.accountsItemId = ${payLoad.accountsItemId} AND  j.date >= ${getDate?.date || new Date(payLoad.date)
    } 
  GROUP BY j.accountsItemId`;

  return (result as any[])[0];
};

export const JurnalService = {
  createPurchestReceivedIntoDB,
  createPurchestReceivedPackingMaterialIntoDB,
  createSalesVoucher,
  createMaterialSaleVoucher,
  createPaymentVoucher,
  createReceiptVoucher,
  createJournalVoucher,
  createQantaVoucher,
  getItemTotalByAccountId,
};
