// src/routes/api/tobuy/[id]/clear/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';

/**
 * Utility endpoint to clear completed items from a shopping list
 */

// POST: Clear completed items from a shopping list
export const POST: RequestHandler = async ({ params, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    // First verify that the list exists and belongs to the user
    const list = await prisma.toBuyList.findUnique({
      where: {
        id: params.id,
        user_id: userId
      }
    });

    if (!list) {
      return json({ error: "Shopping list not found" }, { status: 404 });
    }

    const result = await prisma.toBuyItem.deleteMany({
      where: {
        list_id: params.id,
        checked: true
      }
    });

    return json({ 
      success: true, 
      itemsRemoved: result.count 
    });
  } catch (error) {
    console.error("Error clearing completed items:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};