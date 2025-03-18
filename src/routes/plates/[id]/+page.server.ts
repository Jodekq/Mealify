import { error } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { PageServerLoad } from './$types';

const prisma = new PrismaClient();

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
    
    // Map schedule to scheduledDates for consistency with your types
    const mealWithScheduledDates = {
      ...meal,
      scheduledDates: meal.schedule?.map(schedule => ({
        id: schedule.id,
        date: schedule.date.toISOString().split('T')[0] // Format date as YYYY-MM-DD
      }))
    };
    
    return {
      meal: mealWithScheduledDates
    };
  } catch (e) {
    console.error('Error loading meal:', e);
    throw error(500, 'Failed to load meal');
  }
};