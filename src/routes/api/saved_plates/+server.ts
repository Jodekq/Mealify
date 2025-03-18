import { json } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET({ locals }) {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    const savedMeals = await prisma.meal.findMany({
      where: {
        user_id: userId,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
    });

    if (savedMeals.length === 0) {
      console.warn(`No saved meals found for user ${userId}`);
      return json({ meals: [] });
    }

    const mealsWithIngredientCount = savedMeals.map((meal) => ({
      ...meal,
      ingredientCount: meal.ingredients.length, 
    }));

    return json({ meals: mealsWithIngredientCount }); 
  } catch (error) {
    console.error("Error fetching saved meals:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
