// src/routes/api/schedule/[id]/+server.ts
import { error, json } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, request, locals }: RequestEvent) {
  const mealId = params.id;
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    if (!mealId) {
      throw error(400, 'Meal ID is required');
    }
    
    const meal = await prisma.meal.findUnique({
      where: {
        id: mealId,
        user_id: userId
      }
    });
    
    if (!meal) {
      throw error(404, 'Meal not found');
    }
    
    const { dates } = await request.json();
    
    if (!Array.isArray(dates)) {
      throw error(400, 'Invalid dates format');
    }

	  const today = new Date();
	  today.setDate(today.getDate());

    console.log('Deleting old schedules...');

    await prisma.mealSchedule.deleteMany({
      where: {
        user_id: userId,
        meal_id: mealId,
        date: {
          lt: today 
        }
      }
    });
    
    await prisma.mealSchedule.deleteMany({
      where: {
        meal_id: mealId,
        user_id: userId
      }
    });
    
    if (dates.length > 0) {
      const scheduleData = dates.map(dateStr => ({
        user_id: userId,
        meal_id: mealId,
        date: new Date(dateStr)
      }));
      
      await prisma.mealSchedule.createMany({
        data: scheduleData
      });
    }
    
    return json({ 
      success: true,
      message: 'Meal schedule updated successfully',
      scheduledDates: dates.length
    });
  } catch (e) {
    console.error('Error updating meal schedule:', e);
    throw error(500, 'Failed to update meal schedule');
  }
}