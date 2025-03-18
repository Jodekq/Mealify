import { error, json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';

const prisma = new PrismaClient();

// Explicitly type the request handler with params
export async function POST({ params, request, locals }: RequestEvent) {
  const mealId = params.id; // This should now be properly typed
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    if (!mealId) {
      throw error(400, 'Meal ID is required');
    }
    
    // Verify the meal belongs to the user
    const meal = await prisma.meal.findUnique({
      where: {
        id: mealId,
        user_id: userId
      }
    });
    
    if (!meal) {
      throw error(404, 'Meal not found');
    }
    
    // Get dates from request body
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
          lt: today // Delete any date less than today
        }
      }
    });
    
    // Delete existing schedules for this meal
    await prisma.mealSchedule.deleteMany({
      where: {
        meal_id: mealId,
        user_id: userId
      }
    });
    
    // Create new schedule entries
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