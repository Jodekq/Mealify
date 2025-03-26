// src/lib/server/tobuy-list.ts
import prisma from '$lib/prismaClient';

export async function ensureDefaultList(userId: string): Promise<string> {
  const defaultList = await prisma.toBuyList.findFirst({
    where: {
      user_id: userId,
      isDefault: true
    }
  });

  if (defaultList) {
    return defaultList.id;
  }

  const newDefaultList = await prisma.toBuyList.create({
    data: {
      name: "Tobuy List",
      isDefault: true,
      user: {
        connect: { id: userId }
      }
    }
  });

  return newDefaultList.id;
}

export async function getDefaultListId(userId: string): Promise<string> {
  return ensureDefaultList(userId);
}

export async function handleListDeletion(userId: string, deletedListId: string): Promise<void> {
  const remainingListsCount = await prisma.toBuyList.count({
    where: {
      user_id: userId
    }
  });

  if (remainingListsCount === 0) {
    await ensureDefaultList(userId);
  }
}