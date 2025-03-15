import { PrismaClient } from '@prisma/client';
import { lucia } from "$lib/server/auth.js";
import { fail, redirect, type Actions } from "@sveltejs/kit";
import { Argon2id } from "oslo/password";

const prisma = new PrismaClient();

export const actions:Actions = {
    default: async ({ request, cookies }) => {
        const {username, password } = Object.fromEntries(await request.formData()) as Record<string, string>
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })
        if(!user){
            return fail(400, {message: "Incorrect username or password"})
        }
        const validPassword = password === user.password; 
        if(!validPassword){
            return fail(400, {message: "Incorrect username or password"})
        }
        const session = await lucia.createSession(user.id, [])
        const sessionCookie = lucia.createSessionCookie(session.id);
        cookies.set(sessionCookie.name, sessionCookie.value, {
            path:".",
            ...sessionCookie.attributes
        })
        redirect(302, "/")
    }
};