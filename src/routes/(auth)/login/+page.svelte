<!-- src/routes/(auth)/login/+page.svelte -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import LoginForm from "$lib/components/login-form.svelte";
import { toast } from "svelte-sonner";
	import type { ActionResult } from '@sveltejs/kit';

let isLoading = false;

const handleSubmit = () => {
	isLoading = true;
	
	return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'redirect') {
			} else if (result.type === 'failure') {
					isLoading = false;
					toast.error("Login failed", {
							description: result.data?.message || "Invalid username or password"
					});
			} else if (result.type === 'error') {
					isLoading = false;
					toast.error("Something went wrong", {
							description: "Please try again later"
					});
			} else {
					isLoading = false;
			}
	};
};
</script>

<div class="w3-card w3-margin w3-padding">
	<div class="flex h-screen w-full items-center justify-center px-4">
			<form method="post" use:enhance on:submit={handleSubmit}>
					<LoginForm {isLoading} />
			</form>
	</div>
</div>