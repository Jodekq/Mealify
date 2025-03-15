import { lucia } from "$lib/server/auth";
import { fail, redirect } from "@sveltejs/kit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const load = async ({ cookies }) => {
  const sessionId = cookies.get("auth_session");

  if (!sessionId) {
    return { user: null };
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (!session || !user) {
    return { user: null };
  }

  const userFromDb = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return { user: userFromDb };
};