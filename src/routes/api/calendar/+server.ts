import { json } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";
import { format, addDays, parseISO } from "date-fns";

const prisma = new PrismaClient();

export async function GET({ request, locals }) {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    let now = new Date();
    let today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const endDate = addDays(today, 20); // 20 days from today

    const mealSchedules = await prisma.mealSchedule.findMany({
      where: {
        user_id: userId,
        date: {
          gte: today, // Greater than or equal to today
          lte: endDate, // Less than or equal to 20 days from today
        },
      },
      include: {
        meal: {
          select: {
            name: true,
            totalTime: true, // Include totalTime
          },
        },
      },
    });

    // Format the response
    const meals: Record<string, { name: string; totalTime: number } | null> = {};
    for (let i = 0; i < 20; i++) {
      const date = addDays(today, i); // Calculate the date for each day
      const dateKey = format(date, "yyyy-MM-dd");
      const schedule = mealSchedules.find((s) => format(s.date, "yyyy-MM-dd") === dateKey);
      meals[dateKey] = schedule?.meal ? { name: schedule.meal.name, totalTime: schedule.meal.totalTime } : null;
    }

    return json({ meals });
  } catch (error) {
    console.error("Error fetching meal schedules:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}