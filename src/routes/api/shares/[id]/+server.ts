// src/routes/api/shares/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { RequestEvent } from '@sveltejs/kit';

export async function DELETE(event: RequestEvent) {
  const { params, locals } = event;
  const userId = locals.user?.id;
  
  if (!userId) {
    throw error(401, 'Unauthorized');
  }
  
  try {
    const shareId = params.id;
    
    if (!shareId) {
      throw error(400, 'Share ID is required');
    }
    
    const sharedMeal = await prisma.sharedMeal.findFirst({
      where: {
        id: shareId,
        creator_id: userId
      }
    });
    
    if (!sharedMeal) {
      throw error(404, 'Shared meal not found');
    }
    
    await prisma.sharedMeal.delete({
      where: {
        id: shareId
      }
    });
    
    return json({ 
      success: true,
      message: 'Share link deleted successfully'
    });
    
  } catch (e) {
    console.error('Error deleting share link:', e);
    throw error(500, 'Failed to delete share link');
  }
}