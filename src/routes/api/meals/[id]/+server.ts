import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET a single meal
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
  const { id } = params;
  const data = await request.json();

  const updatedMeal = await prisma.meal.update({
    where: { id },
    data: {
      name: data.name,
      workingTime: data.workingTime,
      cookingTime: data.cookingTime,
      restTime: data.restTime,
      totalTime: data.totalTime,
      portions: data.portions,
      ingredients: {
        deleteMany: {},
        create: data.ingredients.map((ing) => ({
          amount: ing.amount,
          ingredient: {
            connectOrCreate: {
              where: { name: ing.name },
              create: {
                name: ing.name,
                unit: ing.unit,
              }
            }
          }
        })),
      },
      steps: {
        deleteMany: {}, 
        create: data.steps.map((step, index) => ({
          stepNumber: index + 1,
          text: step.text,
          extraText: step.extraText,
          description: step.description,
        })),
      },
    },
  });

  return json(updatedMeal);
}

export async function DELETE({ params }) {
  const { id } = params;
  await prisma.meal.delete({ where: { id } });
  return json({ message: 'Meal deleted' });
}