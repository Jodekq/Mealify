<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";

	export let isLoading = false;

</script>

<div class="flex justify-center items-center">
	<div class={`
			relative
			w-[380px] h-[380px] rounded-lg
			shadow-[0px_4px_16px_rgba(0,0,0,0.45)]
			overflow-hidden
			${isLoading ? 'before:absolute' : ''}
			before:top-[-50%] before:right-[-50%] before:bottom-[-50%] before:left-[-50%]
			before:bg-[conic-gradient(transparent,transparent,#22c55e)]
			before:animate-spin-slow
	`}>
		<div class="absolute
			flex justify-center items-center
			top-[2px] right-[2px] bottom-[2px] left-[2px] rounded-[8px]
			bg-card
			z-10">
			<Card.Root class="w-full border-none shadow-none">
				<Card.Header>
					<Card.Title class="text-2xl">Login</Card.Title>
					<Card.Description>Enter your username below to login to your account</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
						<div class="grid gap-2">
							<Label for="username">Username</Label>
							<Input id="username" type="text" placeholder="username" name="username" required disabled={isLoading} />
						</div>
						<div class="grid gap-2">
							<div class="flex items-center">
								<Label for="password">Password</Label>
							</div>
							<Input id="password" type="password" name="password" required disabled={isLoading} />
						</div>
						<Button variant="default" type="submit" class="w-full cursor-pointer" disabled={isLoading}>
							{#if isLoading}
								<span class="animate-pulse">Logging in...</span>
							{:else}
								Login
							{/if}
						</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
