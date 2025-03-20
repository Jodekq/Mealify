<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { toast } from "svelte-sonner";

	let loading = false;
	let progress = 0;

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;
		
		try {
			console.log("Form submission started...");
			loading = true;
			progress = 0;

			for (let i = 0; i <= 100; i += 5) {
				progress = i;
				await new Promise((r) => setTimeout(r, 50)); // Simulated delay
			}

			// Simulate an API call
			await new Promise((resolve) => setTimeout(resolve, 500));
			console.log("Form submitted successfully!");
			toast.success("Form submitted successfully!");

		} catch (error) {
			console.error("An error occurred during submission:", error);
			toast.error("An error occurred during submission.");
		} finally {
			loading = false;
			progress = 0;
			console.log("Form submission ended.");
		}
	}
</script>

<Card.Root 
	class="relative mx-auto max-w-sm overflow-hidden"
	onsubmit={handleSubmit}
>
	<!-- Progress Border -->
	<div
		class="absolute inset-0 rounded-lg border-4 transition-all"
		style={`border-color: ${loading ? 'var(--primary)' : 'transparent'}; clip-path: polygon(0% 0%, ${progress}% 0%, ${progress}% 4px, 0% 4px, 0% 100%, 4px 100%, 4px ${progress}%, 0% ${progress}%, 0% 0%)`}
	></div>

	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your username below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-4">
			<div class="grid gap-2">
				<Label for="username">Username</Label>
				<Input id="username" type="text" placeholder="username" name="username" required />
			</div>
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Input id="password" type="password" name="password" required />
			</div>
			<Button variant="ghost" type="submit" class="w-full cursor-pointer">
				{loading ? "Logging in..." : "Login"}
			</Button>
		</div>
	</Card.Content>
</Card.Root>
