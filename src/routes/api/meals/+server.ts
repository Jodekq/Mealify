// src/routes/api/meals/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';

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
    
    const totalTime = (workingTime || 0) + (cookingTime || 0) + (restTime || 0);
    
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
    
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
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