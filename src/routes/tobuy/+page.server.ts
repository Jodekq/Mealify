// src/routes/tobuy/+page.server.ts
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ensureDefaultList } from '$lib/services/tobuy-list';

export const load: PageServerLoad = async ({ locals }) => {
  const userId = locals.user?.id;
  
  if (!userId) {
    throw redirect(302, '/login');
  }
  
  try {
    await ensureDefaultList(userId);
    
    return {};
  } catch (e) {
    console.error('Error loading ToBuy page:', e);
    throw error(500, 'Failed to load ToBuy page');
  }
};