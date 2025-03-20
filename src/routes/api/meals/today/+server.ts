import { json } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET({ locals }) {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    let now = new Date();
    let today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Fetch all scheduled meals for today
    const scheduledMeals = await prisma.mealSchedule.findMany({
      where: {
        user_id: userId,
        date: {
          equals: today,
        },
      },
      include: {
        meal: {
          include: {
            ingredients: {
              include: { ingredient: true },
            },
            steps: {
              orderBy: { stepNumber: "asc" },
            },
          },
        },
      },
    });

    if (!scheduledMeals || scheduledMeals.length === 0) {
      console.warn(`No meals found for user ${userId} on ${today.toISOString()}`);
      return json({ meals: [] });
    }

    return json({ meals: scheduledMeals.map(mealSchedule => mealSchedule.meal) });
  } catch (error) {
    console.error("Error fetching scheduled meals:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
