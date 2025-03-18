import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const load: PageServerLoad = async ({ params, locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }

  try {
    const meal = await prisma.meal.findUnique({
      where: {
        id: params.id,
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
          orderBy: {
            date: 'asc'
          }
        }
      }
    });

    if (!meal) {
      throw error(404, 'Meal not found');
    }

    return {
      meal: {
        ...meal,
        ingredients: meal.ingredients.map(mi => ({
          id: mi.id,
          amount: mi.amount,
          ingredient: mi.ingredient
        })),
        // Format scheduled dates
        scheduledDates: meal.schedule.map(s => ({
          id: s.id,
          date: s.date.toISOString().split('T')[0]
        }))
      }
    };
  } catch (err) {
    console.error('Error fetching meal:', err);
    throw error(500, 'Error fetching meal details');
  }
};