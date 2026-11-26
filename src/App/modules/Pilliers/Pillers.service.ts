import { AccountHead } from "../../../generated/prisma/client";
import prisma from "../../../shared/prisma";

const createPliersItemIntoDB = async (payLoad: AccountHead[]) => {
  const result = await prisma.accountHead.createMany({
    data: payLoad,
  });

  return result;
};

const getAllPillerItem = async () => {
  const result: AccountHead[] = await prisma.accountHead.findMany({});

  return result;
};

export const PillersService = {
  createPliersItemIntoDB,
  getAllPillerItem,
};
