// src/routes/api/shares/+server.ts
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';

export async function GET({ locals }) {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    const sharedMeals = await prisma.sharedMeal.findMany({
      where: {
        creator_id: userId
      },
      include: {
        meal: {
          select: {
            id: true,
            name: true,
            totalTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return json({ shares: sharedMeals });
  } catch (e) {
    console.error('Error fetching shared meals:', e);
    throw error(500, 'Failed to fetch shared meals');
  }
}