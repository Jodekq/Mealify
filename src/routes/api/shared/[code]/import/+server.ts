// src/routes/api/shared/[code]/import/+server.ts
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';

export async function POST({ params, locals }) {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    const shareCode = params.code;
    
    const sharedMeal = await prisma.sharedMeal.findUnique({
      where: {
        shareCode: shareCode
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
      }
    });
    
    if (!sharedMeal) {
      throw error(404, 'Shared meal not found');
    }
    
    const importedMeal = await prisma.meal.create({
      data: {
        name: sharedMeal.meal.name,
        portions: sharedMeal.meal.portions,
        workingTime: sharedMeal.meal.workingTime,
        cookingTime: sharedMeal.meal.cookingTime,
        restTime: sharedMeal.meal.restTime,
        totalTime: sharedMeal.meal.totalTime,
        user: {
          connect: { id: userId }
        }
      }
    });
    
    for (const ing of sharedMeal.meal.ingredients) {
      let ingredient = await prisma.ingredient.findUnique({
        where: { id: ing.ingredient.id }
      });
      
      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: {
            name: ing.ingredient.name,
            unit: ing.ingredient.unit
          }
        });
      }
      
      await prisma.mealIngredient.create({
        data: {
          meal: {
            connect: { id: importedMeal.id }
          },
          ingredient: {
            connect: { id: ingredient.id }
          },
          amount: ing.amount
        }
      });
    }
    
    for (const step of sharedMeal.meal.steps) {
      await prisma.mealStep.create({
        data: {
          meal: {
            connect: { id: importedMeal.id }
          },
          stepNumber: step.stepNumber,
          text: step.text,
          extraText: step.extraText,
          description: step.description
        }
      });
    }
    
    return json({ 
      success: true,
      mealId: importedMeal.id,
      message: 'Meal imported successfully' 
    });
    
  } catch (e) {
    console.error('Error importing meal:', e);
    throw error(500, 'Failed to import meal');
  }
}