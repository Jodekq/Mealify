import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import { nanoid } from 'nanoid';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ params, locals, url }: RequestEvent) {
  console.log('Starting share meal process');
  
  try {
    const userId = locals.user?.id;
    if (!userId) {
      console.log('No user ID found in session');
      throw error(401, 'Unauthorized');
    }

    const mealId = params.id;
    if (!mealId) {
      console.log('No meal ID provided');
      throw error(400, 'Meal ID is required');
    }

    console.log(`Checking meal ${mealId} for user ${userId}`);

    const meal = await prisma.meal.findFirst({
      where: {
        id: mealId,
        user_id: userId
      }
    });

    if (!meal) {
      console.log('Meal not found or does not belong to user');
      throw error(404, 'Meal not found');
    }

    console.log('Found meal, checking for existing share');

    let sharedMeal = await prisma.sharedMeal.findFirst({
      where: {
        meal_id: mealId,
        creator_id: userId
      }
    });

    if (!sharedMeal) {
      console.log('No existing share found, creating new one');
      const shareCode = nanoid(10);
      
      sharedMeal = await prisma.sharedMeal.create({
        data: {
          creator_id: userId,
          meal_id: mealId,
          shareCode: shareCode,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }

    console.log('Share created/found successfully');

    const shareLink = `${url.origin}/shared/${sharedMeal.shareCode}`;

    return json({
      success: true,
      shareLink,
      shareCode: sharedMeal.shareCode
    });

  } catch (e) {
    console.error('Error creating share link:', e);
    return json({ 
      success: false, 
      message: e instanceof Error ? e.message : 'Failed to create share link' 
    }, { status: 500 });
  }
}

export async function GET({ params, locals, url }: RequestEvent) {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      throw error(401, 'Unauthorized');
    }

    const mealId = params.id;
    if (!mealId) {
      throw error(400, 'Meal ID is required');
    }

    const sharedMeal = await prisma.sharedMeal.findFirst({
      where: {
        meal_id: mealId,
        creator_id: userId
      }
    });

    if (sharedMeal) {
      const shareLink = `${url.origin}/shared/${sharedMeal.shareCode}`;
      return json({
        exists: true,
        shareLink,
        shareCode: sharedMeal.shareCode
      });
    }

    return json({ exists: false });

  } catch (e) {
    console.error('Error checking share status:', e);
    return json({ 
      success: false, 
      message: e instanceof Error ? e.message : 'Failed to check share status' 
    }, { status: 500 });
  }
}