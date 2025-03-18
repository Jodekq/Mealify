import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) {
    throw error(401, 'Unauthorized');
  }

  try {
    const { id, name, ingredients, steps } = await request.json();

    // Update the meal
    const updatedMeal = await prisma.meal.update({
      where: { id, user_id: userId },
      data: {
        name,
        ingredients: {
          deleteMany: {}, // Remove old ingredients
          create: ingredients.map((ing) => ({
            amount: ing.amount,
            ingredient: { connect: { id: ing.ingredient.id } }
          }))
        },
        steps: {
          deleteMany: {}, // Remove old steps
          create: steps.map((step, index) => ({
            stepNumber: index + 1,
            text: step.text,
            description: step.description
          }))
        }
      }
    });

    return json({ success: true, meal: updatedMeal });
  } catch (err) {
    console.error('Error updating meal:', err);
    throw error(500, 'Error updating meal');
  }
};
