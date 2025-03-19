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

    const scheduledMeal = await prisma.mealSchedule.findFirst({
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

    if (!scheduledMeal) {
      console.warn(`No scheduled meal found for user ${userId} on ${today.toISOString()}`);
      return json({ meal: null });
    }

    return json({ meal: scheduledMeal.meal });
  } catch (error) {
    console.error("Error fetching scheduled meal:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}