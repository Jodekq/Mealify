import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';

// GET all meals for a user
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

// POST create a new meal
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const userId = locals.user?.id;
    
    if (!userId) {
      throw error(401, 'Unauthorized');
    }

    const data = await request.json();
    
    const { 
      name, 
      portions, 
      workingTime, 
      cookingTime, 
      restTime, 
      ingredients, 
      steps 
    } = data;
    
    // Calculate total time
    const totalTime = (workingTime || 0) + (cookingTime || 0) + (restTime || 0);
    
    // Create or update the meal
    const meal = await prisma.meal.create({
      data: {
        name,
        portions: parseInt(portions) || 1,
        workingTime: parseInt(workingTime) || 0,
        cookingTime: parseInt(cookingTime) || 0,
        restTime: parseInt(restTime) || 0,
        totalTime,
        user: {
          connect: { id: userId }
        }
      }
    });
    
    // Process ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        // First, find or create the ingredient
        let ingredient = await prisma.ingredient.findUnique({
          where: { name: ing.name }
        });
        
        if (!ingredient) {
          ingredient = await prisma.ingredient.create({
            data: {
              name: ing.name,
              unit: ing.unit
            }
          });
        }
        
        // Then create the meal ingredient association
        await prisma.mealIngredient.create({
          data: {
            meal: {
              connect: { id: meal.id }
            },
            ingredient: {
              connect: { id: ingredient.id }
            },
            amount: parseFloat(ing.amount) || 0
          }
        });
      }
    }
    
    // Process steps
    if (steps && steps.length > 0) {
      for (const step of steps) {
        await prisma.mealStep.create({
          data: {
            meal: {
              connect: { id: meal.id }
            },
            stepNumber: step.number,
            text: step.text,
            extraText: step.extra_text,
            description: step.description
          }
        });
      }
    }
    
    return json({ success: true, mealId: meal.id });
  } catch (error) {
    console.error('Error creating meal:', error);
    return json({ error: 'Failed to save meal' }, { status: 500 });
  }
};