// src/routes/plates/[id]/edit/+page.server.ts
import { error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    const mealId = params.id;
    
    if (!mealId) {
      throw error(404, 'Meal not found');
    }
    
    const meal = await prisma.meal.findUnique({
      where: {
        id: mealId,
        user_id: userId 
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        },
        steps: {
          orderBy: {
            stepNumber: 'asc'
          }
        },
        schedule: {
          select: {
            id: true,
            date: true
          }
        }
      }
    });
    
    if (!meal) {
      throw error(404, 'Meal not found');
    }
    
    return {
      meal
    };
  } catch (e) {
    console.error('Error loading meal:', e);
    throw error(500, 'Failed to load meal');
  }
};