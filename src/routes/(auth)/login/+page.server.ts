import prisma from '$lib/prismaClient';
import { lucia } from "$lib/server/auth";
import { fail, redirect, type Actions } from "@sveltejs/kit";
import bcrypt from "bcrypt";

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const { username, password } = Object.fromEntries(await request.formData()) as Record<string, string>;

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return fail(400, { message: "Incorrect username or password" });
        }

        const session = await lucia.createSession(user.id, []);
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies.set(sessionCookie.name, sessionCookie.value, {
            path: ".",
            ...sessionCookie.attributes
        });

        redirect(302, "/");
    }
};