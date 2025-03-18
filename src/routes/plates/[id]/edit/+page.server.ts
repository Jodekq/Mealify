import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const actions: Actions = {
  updateMeal: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const mealId = formData.get('mealId') as string;
    const name = formData.get('name') as string;
    const workingTime = Number(formData.get('workingTime'));
    const cookingTime = Number(formData.get('cookingTime'));
    const restTime = Number(formData.get('restTime'));
    const totalTime = workingTime + cookingTime + restTime;
    const portions = Number(formData.get('portions'));

    console.log(formData);

    // Check if the meal exists and belongs to the user
    const existingMeal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) throw error(404, 'Meal not found');
    if (existingMeal.user_id !== locals.user.id) throw error(403, 'Forbidden');

    // Update the meal
    await prisma.meal.update({
      where: { id: mealId },
      data: { name, workingTime, cookingTime, restTime, totalTime, portions },
    });

    return { success: true };
  },

  deleteMeal: async ({ request, locals }) => {
    if (!locals.user) throw error(401, 'Unauthorized');

    const formData = await request.formData();
    const mealId = formData.get('mealId') as string;

    const existingMeal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) throw error(404, 'Meal not found');
    if (existingMeal.user_id !== locals.user.id) throw error(403, 'Forbidden');

    await prisma.meal.delete({ where: { id: mealId } });

    return { success: true };
  }
};
