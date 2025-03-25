// src/routes/api/tobuy/[id]/items/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';

/**
 * Shopping list items API endpoint
 * 
 * GET: Get all items in a shopping list
 * POST: Add a new item to a shopping list
 */

// GET: Get all items in a shopping list
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
      }
    });

    if (!list) {
      return json({ error: "Shopping list not found" }, { status: 404 });
    }

    const items = await prisma.toBuyItem.findMany({
      where: {
        list_id: params.id
      },
      orderBy: [
        { checked: 'asc' }
      ]
    });

    return json({ items });
  } catch (error) {
    console.error("Error fetching shopping items:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    const userId = locals.user?.id;
    
    if (!userId) {
      throw error(401, 'Unauthorized');
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

    const data = await request.json();
    const { name, amount, unit } = data;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return json({ error: "Item name is required" }, { status: 400 });
    }

    const item = await prisma.toBuyItem.create({
      data: {
        name: name.trim(),
        amount: amount || null,
        unit: unit || null,
        list: {
          connect: { id: params.id }
        }
      }
    });
    
    return json({ success: true, item });
  } catch (error) {
    console.error('Error creating shopping item:', error);
    return json({ error: 'Failed to create shopping item' }, { status: 500 });
  }
};