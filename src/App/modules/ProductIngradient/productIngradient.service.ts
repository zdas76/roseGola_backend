import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";

interface MaterialInput {
  id: number;
  ingredienteQty?: number;
}

const ingredientInclude = {
  ingredientRawMaterials: {
    select: {
      id: true,
      rawId: true,
      rawMaterials: {
        select: {
          id: true,
          name: true,
          unitPrice: true,
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  ingredientPackingMaterial: {
    select: {
      id: true,
      packingMaterialId: true,
      packingMaterial: {
        select: {
          id: true,
          name: true,
          unitPrice: true,
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  ingredientExpneseItems: {
    select: {
      id: true,
      productionExpenssItemId: true,
      productionExpenseItem: {
        select: {
          id: true,
          expItemName: true,
          unitRate: true,
        },
      },
    },
  },
};

const createProductIngradient = async (payload: {
  productId: number;
  packingMaterials: [];
  rawMaterials: [];
  ingredientExpneseItems: [];
}) => {
  const { productId, packingMaterials, rawMaterials, ingredientExpneseItems } =
    payload;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.productionIngradient.create({
      data: {
        productId,
        ingredientRawMaterials: {
          createMany: {
            data: rawMaterials.map((item) => ({
              rawId: Number(item),
            })),
          },
        },
        ingredientPackingMaterial: {
          createMany: {
            data: packingMaterials.map((item) => ({
              packingMaterialId: Number(item),
            })),
          },
        },
        ingredientExpneseItems: {
          createMany: {
            data: ingredientExpneseItems.map((item) => ({
              productionExpenssItemId: Number(item),
            })),
          },
        },
      },

      include: {
        ingredientRawMaterials: true,
        ingredientPackingMaterial: true,
        ingredientExpneseItems: true,
      },
    });

    const finalResult = await tx.productionIngradient.findUnique({
      where: { id: created.id },
      include: ingredientInclude,
    });
    return {
      ...finalResult,
      product,
    };
  });

  return result;
};

const getAllProductIngradients = async (filters?: { productId?: number }) => {
  const where: any = {};
  if (filters?.productId) {
    where.productId = Number(filters.productId);
  }

  const result = await prisma.productionIngradient.findMany({
    where,
    include: ingredientInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  const productIds = Array.from(new Set(result.map((item) => item.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      unit: true,
      subCategory: true,
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return result.map((item) => ({
    ...item,
    product: productMap.get(item.productId) || null,
  }));
};

const getProductIngradientById = async (id: number) => {
  const result = await prisma.productionIngradient.findUnique({
    where: { id },
    include: ingredientInclude,
  });

  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product ingradient not found");
  }

  const product = await prisma.product.findUnique({
    where: { id: result.productId },
    include: {
      unit: true,
      subCategory: true,
    },
  });

  return {
    ...result,
    product: product || null,
  };
};

const getProductionIngradientByProductId = async (productId: number) => {
  const result = await prisma.productionIngradient.findFirst({
    where: { productId },
    include: ingredientInclude,
  });

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Product ingradient not found for this product",
    );
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      unit: true,
      subCategory: true,
    },
  });

  return {
    ...result,
    product: product || null,
  };
};

const updateProductIngradientById = async (ingredientid: number, payload: any) => {
  const isExist = await prisma.productionIngradient.findUnique({
    where: { id: ingredientid },
  });

  if (!isExist) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product ingradient not found");
  }

  if (payload.productId !== isExist.productId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }
  if (payload.rawMaterials && payload.rawMaterials.lngth > 0) {
    await prisma.ingredientRawMaterial.delete({
      where: {
        rawId: payload.rawMaterials?.map(id => id)
      }
    })
  }

};

export const ProductIngradientService = {
  createProductIngradient,
  getAllProductIngradients,
  getProductIngradientById,
  updateProductIngradientById
};
