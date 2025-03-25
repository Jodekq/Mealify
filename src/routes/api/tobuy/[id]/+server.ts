// src/routes/api/tobuy/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';
import { handleListDeletion } from '$lib/services/tobuy-list';

/**
 * Individual shopping list API endpoint
 * 
 * GET: Get a specific shopping list with its items
 * DELETE: Delete a shopping list
 * PATCH: Update a shopping list properties
 */

// GET: Get a specific shopping list with its items
export const GET: RequestHandler = async ({ params, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const list = await prisma.toBuyList.findUnique({
      where: {
        id: params.id,
        user_id: userId
      },
      include: {
        items: {
          orderBy: [
            { checked: 'asc' }
          ]
        }
      }
    });

    if (!list) {
      return json({ error: "Shopping list not found" }, { status: 404 });
    }

    return json({ list });
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

// DELETE: Delete a shopping list
export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const list = await prisma.toBuyList.findUnique({
      where: {
        id: params.id,
        user_id: userId
      }
    });

    if (!list) {
      return json({ error: "Shopping list not found" }, { status: 404 });
    }

    if (list.isDefault) {
      return json({ error: "Cannot delete the default shopping list" }, { status: 400 });
    }

    await prisma.toBuyList.delete({
      where: {
        id: params.id,
        user_id: userId
      }
    });

    await handleListDeletion(userId, params.id);

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping list:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

// PATCH: Update a shopping list properties
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();
    const { name } = data;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return json({ error: "List name cannot be empty" }, { status: 400 });
    }

    const updatedList = await prisma.toBuyList.update({
      where: {
        id: params.id,
        user_id: userId
      },
      data: {
        name: name ? name.trim() : undefined
      }
    });

    return json({ success: true, list: updatedList });
  } catch (error) {
    console.error("Error updating shopping list:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};