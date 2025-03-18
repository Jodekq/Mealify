import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ locals, url }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }

  // Get start date from query params or use today
  const startDateParam = url.searchParams.get('startDate');
  const startDate = startDateParam 
    ? new Date(startDateParam) 
    : new Date();
  
  // Set time to beginning of day
  startDate.setHours(0, 0, 0, 0);
  
  // Create end date (20 days after start date)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 20);

  try {
    // Get meal schedules between start and end date
    const schedules = await prisma.mealSchedule.findMany({
      where: {
        user_id: userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      include: {
        meal: {
          include: {
            ingredients: {
              include: {
                ingredient: true
              }
            },
            steps: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Generate all days in the period (including days without meals)
    const days: any[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const formattedDate = currentDate.toISOString().split('T')[0];
      
      // Find schedule for this date
      const schedule = schedules.find(s => 
        s.date.toISOString().split('T')[0] === formattedDate
      );
      
      // Add day to array
      days.push({
        id: schedule?.id || `empty-${formattedDate}`,
        date: formattedDate,
        meal: schedule ? transformMeal(schedule.meal) : null
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return json({
      startDate: startDate.toISOString().split('T')[0],
      days
    });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    throw error(500, 'Error fetching meal schedule');
  }
};

// Helper function to transform meal data
function transformMeal(meal: any) {
  if (!meal) return null;
  
  return {
    id: meal.id,
    name: meal.name,
    workingTime: meal.workingTime,
    cookingTime: meal.cookingTime,
    restTime: meal.restTime,
    totalTime: meal.totalTime,
    portions: meal.portions,
    ingredients: meal.ingredients.map((mi: any) => ({
      id: mi.id,
      amount: mi.amount,
      ingredient: mi.ingredient
    })),
    steps: meal.steps.map((step: any) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      text: step.text,
      extraText: step.extraText || undefined,
      description: step.description || undefined
    }))
  };
}

// Add a meal to schedule
export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }

  const data = await request.json();
  const { mealId, date } = data;
  
  if (!mealId || !date) {
    throw error(400, 'Missing required fields');
  }

  try {
    // Check if meal exists and belongs to user
    const meal = await prisma.meal.findUnique({
      where: {
        id: mealId,
        user_id: userId
      }
    });

    if (!meal) {
      throw error(404, 'Meal not found');
    }

    // Check if already scheduled for this date
    const existingSchedule = await prisma.mealSchedule.findFirst({
      where: {
        user_id: userId,
        date: new Date(date)
      }
    });

    // Update if exists, create if not
    let schedule;
    if (existingSchedule) {
      schedule = await prisma.mealSchedule.update({
        where: { id: existingSchedule.id },
        data: { meal_id: mealId }
      });
    } else {
      schedule = await prisma.mealSchedule.create({
        data: {
          user_id: userId,
          meal_id: mealId,
          date: new Date(date)
        }
      });
    }

    return json({ success: true, schedule });
  } catch (err) {
    console.error('Error scheduling meal:', err);
    throw error(500, 'Error scheduling meal');
  }
};

// Delete a meal schedule
export const DELETE: RequestHandler = async ({ url, request, locals }) => {
  const userId = locals.user?.id;

  if (!userId) {
    throw error(401, 'Unauthorized');
  }

  const { date } = await request.json();
  const mealId = url.searchParams.get('id');

  if (!mealId || !date) {
    throw error(400, 'Missing required fields');
  }

  try {
    const schedule = await prisma.mealSchedule.findFirst({
      where: {
        user_id: userId,
        meal_id: mealId,
        date: new Date(date),
      }
    });

    if (!schedule) {
      throw error(404, 'Schedule not found');
    }

    await prisma.mealSchedule.delete({
      where: { id: schedule.id }
    });

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting schedule:', err);
    throw error(500, 'Error deleting schedule');
  }
};