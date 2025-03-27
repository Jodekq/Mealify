// src/routes/api/meals/[id]/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prismaClient';

export const GET: RequestHandler = async ({ params, locals }) => {
    const userId = locals.user?.id;
    if (!userId) return json({ error: 'Unauthorized' }, { status: 401 });

    const meal = await prisma.meal.findFirst({
        where: { id: params.id, user_id: userId },
        include: { ingredients: true, steps: true }
    });

    return meal ? json(meal) : json({ error: 'Meal not found' }, { status: 404 });
};

export async function PUT({ params, request }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    const totalTime = (parseInt(data.workingTime) || 0) + 
                      (parseInt(data.cookingTime) || 0) + 
                      (parseInt(data.restTime) || 0);
    
    const ingredientPromises = data.ingredients.map(async (ing) => {
      let ingredient = await prisma.ingredient.findFirst({
        where: { 
          name: ing.name,
          unit: ing.unit || ""
        }
      });
      
      if (!ingredient) {
        ingredient = await prisma.ingredient.create({
          data: {
            name: ing.name,
            unit: ing.unit || ""
          }
        });
      }
      
      return {
        amount: ing.amount === "" || ing.amount === undefined ? null : parseFloat(ing.amount),
        ingredientId: ingredient.id
      };
    });
    
    const ingredientData = await Promise.all(ingredientPromises);
    
    const updatedMeal = await prisma.meal.update({
      where: { id },
      data: {
        name: data.name,
        workingTime: parseInt(data.workingTime) || 0,
        cookingTime: parseInt(data.cookingTime) || 0,
        restTime: parseInt(data.restTime) || 0,
        totalTime: totalTime,
        portions: parseInt(data.portions) || 1,
        ingredients: {
          deleteMany: {},
          create: ingredientData.map(item => ({
            amount: item.amount,
            ingredient: {
              connect: { id: item.ingredientId }
            }
          }))
        },
        steps: {
          deleteMany: {}, 
          create: data.steps.map((step, index) => ({
            stepNumber: index + 1,
            text: step.text || "",
            extraText: step.extraText || step.extra_text || null,
            description: step.description || null,
          })),
        },
      },
    });
    
    return json(updatedMeal);
  } catch (error) {
    console.error("Error updating meal:", error);
    return json({ error: error.message || "Failed to update meal" }, { status: 500 });
  }
}

export async function DELETE({ params }) {
  const { id } = params;
  await prisma.meal.delete({ where: { id } });
  return json({ message: 'Meal deleted' });
}