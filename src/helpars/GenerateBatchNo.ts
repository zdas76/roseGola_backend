import prisma from "../shared/prisma";

export const GenerateBatchNo = async (productId: number) => {
  let batchNo;

  const lastbatchByid = await prisma.productionItemInfo.findFirst({
    where: {
      productId
    },
    orderBy: {
      id: "desc",
    },
  });

  if (lastbatchByid) {
    batchNo = lastbatchByid.batchNo;
  }

  const currectYear = new Date().getFullYear().toString().slice(-4);

  if (batchNo) {
    const nextNumber = getNextNumber(batchNo);
    const result = productId + "-" + currectYear + "-" + nextNumber;
    return result;
  } else {
    const number = "0001";
    const result = productId + "-" + currectYear + "-" + number;
    return result;
  }
};

const getNextNumber = (batchNo: string) => {
  const lastNumber = batchNo.split("-").at(-1);
  const nextNumber = (Number(lastNumber) + 1).toString().padStart(4, "0");
  return nextNumber;
};
