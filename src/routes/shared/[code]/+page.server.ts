// src/routes/shared/[code]/+page.server.ts
import { error } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';
import type { PageServerLoad } from './$types';

// Helper function to execute query with retry logic
async function executeWithRetry<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (err: any) {
      lastError = err;

      // Check if it's a prepared statement error
      if (
        err?.message?.includes('prepared statement') || 
        err?.code === '26000' ||
        err?.message?.includes('does not exist')
      ) {
        console.log(`Retrying database query (attempt ${attempt + 1}/${maxRetries})`);
        // Add exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        continue;
      }

      // If it's not a connection error, throw immediately
      throw err;
    }
  }

  // If we've exhausted all retries
  throw lastError;
}

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const shareCode = params.code;
    const userId = locals.user?.id;

    if (!shareCode) {
      throw error(400, 'Share code is required');
    }

    // Find the shared meal with retry logic
    const sharedMeal = await executeWithRetry(() => 
      prisma.sharedMeal.findUnique({
        where: { shareCode },
        include: {
          meal: {
            include: {
              ingredients: {
                include: {
                  ingredient: true
                }
              },
              steps: {
                orderBy: {
                  stepNumber: 'asc'
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              username: true
            }
          }
        }
      })
    );

    if (!sharedMeal) {
      throw error(404, 'Shared meal not found');
    }

    if (sharedMeal.expiresAt < new Date()) {
      throw error(410, 'This share link has expired');
    }

    // Return the meal data along with creator info
    return {
      meal: sharedMeal.meal,
      creator: sharedMeal.creator,
      shareCode: sharedMeal.shareCode,
      user: locals.user
    };
  } catch (e) {
    console.error('Error loading shared meal:', e);

    if (e?.message?.includes('prepared statement')) {
      throw error(500, 'Database connection error. Please try again.');
    }

    if (e.status && e.body) {
      throw e;
    }

    throw error(500, 'Failed to load shared meal');
  }
};