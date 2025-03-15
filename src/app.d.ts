import { User, Session } from '@lucia-auth/sveltekit'; 

declare global {
	namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
	 // interface Error {}
	 // interface Locals {}
	 // interface PageData {}
	 // interface PageState {}
	 // interface Platform {}
	}
}

declare module 'bcrypt';

export {};