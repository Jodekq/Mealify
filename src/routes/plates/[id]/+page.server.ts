// src/routes/plates/[id]/+page.server.ts
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
    
    // Transform the meal data to match component expectations
    const transformedMeal = {
      ...meal,
      // Convert schedule to scheduledDates
      scheduledDates: meal.schedule?.map(schedule => ({
        id: schedule.id,
        date: schedule.date.toISOString().split('T')[0] // Format date as YYYY-MM-DD
      }))
    };
    
    // Remove the schedule property if you don't need it in the component
    // This would solve the type issue
    // delete transformedMeal.schedule;
    
    return {
      meal: transformedMeal
    };
  } catch (e) {
    console.error('Error loading meal:', e);
    throw error(500, 'Failed to load meal');
  }
};