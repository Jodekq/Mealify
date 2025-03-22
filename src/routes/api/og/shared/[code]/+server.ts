// src/routes/api/og/shared/[code]/+server.ts
import { error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const shareCode = params.code;
    
    if (!shareCode) {
      throw error(400, 'Share code is required');
    }
    
    const sharedMeal = await prisma.sharedMeal.findUnique({
      where: { shareCode },
      include: {
        meal: {
          select: {
            name: true,
            totalTime: true,
            portions: true,
            ingredients: {
              include: { ingredient: true },
              take: 4 
            }
          }
        },
        creator: {
          select: { username: true }
        }
      }
    });
    
    if (!sharedMeal) {
      throw error(404, 'Shared meal not found');
    }
    
    const { meal, creator } = sharedMeal;

    const totalTime = meal.totalTime;
    const hours = Math.floor(totalTime / 60);
    const minutes = totalTime % 60;
    const timeString = hours > 0 
      ? `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
      : `${minutes}m`;
    
    const ingredientList = meal.ingredients
      .map(ing => `${ing.ingredient.name}`)
      .join(", ");
    
    const moreText = meal.ingredients.length > 4 
      ? ` and ${meal.ingredients.length - 4} more` 
      : '';
    
    // Vercel OG Image
    const queryParams = new URLSearchParams({
      title: meal.name,
      subtitle: `${timeString} • ${meal.portions} portions`,
      description: `${ingredientList}${moreText}`,
      footer: `Shared by ${creator.username}`,
      theme: 'dark'
    });
    
    return Response.redirect(`https://og-image.vercel.app/**${encodeURIComponent(meal.name)}**.png?${queryParams.toString()}`);
    
    // return Response.redirect(`https://img.shields.io/static/v1?label=${encodeURIComponent('🍽️ ' + meal.name)}&message=${encodeURIComponent(`${timeString} • by ${creator.username}`)}&color=orange&style=for-the-badge&labelColor=333`);
  } catch (e) {
    console.error('Error generating OG image:', e);
    // fallback image
    return Response.redirect(`https://img.shields.io/badge/Plate_Pilot-Recipe-orange?style=for-the-badge`);
  }
};