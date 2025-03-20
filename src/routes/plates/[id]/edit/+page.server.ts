import { error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    // Ensure the ID is valid
    const mealId = params.id;
    
    if (!mealId) {
      throw error(404, 'Meal not found');
    }
    
    // Fetch the meal with related data
    const meal = await prisma.meal.findUnique({
      where: {
        id: mealId,
        user_id: userId // Ensure the meal belongs to the current user
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