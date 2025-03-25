// src/routes/api/tobuy/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';
import { ensureDefaultList } from '$lib/services/tobuy-list';

/**
 * Main ToBuy API endpoint
 * 
 * GET: Get all shopping lists with their items
 * POST: Create a new shopping list
 */
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureDefaultList(userId);

    const lists = await prisma.toBuyList.findMany({
      where: {
        user_id: userId,
      },
      include: {
        items: true
      },
      orderBy: [
        { isDefault: 'desc' }
      ]
    });

    return json({ lists });
  } catch (error) {
    console.error("Error fetching shopping lists:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

// POST: Create a new shopping list
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const userId = locals.user?.id;
    
    if (!userId) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.json();
    const { name } = data;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return json({ error: "List name is required" }, { status: 400 });
    }

    const list = await prisma.toBuyList.create({
      data: {
        name: name.trim(),
        user: {
          connect: { id: userId }
        },
        isDefault: false 
      }
    });
    
    return json({ success: true, list });
  } catch (error) {
    console.error('Error creating shopping list:', error);
    return json({ error: 'Failed to create shopping list' }, { status: 500 });
  }
};