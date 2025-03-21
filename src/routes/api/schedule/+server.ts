// src/routes/api/schedule/+server.ts
import { error, json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { format, addDays } from "date-fns";
import prisma from '$lib/prismaClient';

export async function GET({ locals }) {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    let now = new Date();
    let today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const endDate = addDays(today, 20); 

    const mealSchedules = await prisma.mealSchedule.findMany({
      where: {
        user_id: userId,
        date: {
          gte: today,
          lte: endDate,
        },
      },
      include: {
        meal: {
          select: {
            id: true,
            name: true,
            totalTime: true,
          },
        },
      },
    });

    const mealsMap: Record<string, Array<{ name: string; totalTime: number, id: string }>> = {};
    
    for (let i = 0; i < 20; i++) {
      const date = addDays(today, i);
      const dateKey = format(date, "yyyy-MM-dd");
      mealsMap[dateKey] = [];
    }
    
    mealSchedules.forEach((schedule) => {
      const dateKey = format(schedule.date, "yyyy-MM-dd");
      if (schedule.meal) {
        mealsMap[dateKey].push({
          id: schedule.meal.id,
          name: schedule.meal.name,
          totalTime: schedule.meal.totalTime
        });
      }
    });

    return json({ meals: mealsMap });
  } catch (error) {
    console.error("Error fetching meal schedules:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}


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

export async function DELETE() {
  const today = new Date().toISOString().split('T')[0];

  await prisma.mealSchedule.deleteMany({
    where: { date: { lt: today } } 
  });

  return json({ message: 'Old meals deleted' });
}