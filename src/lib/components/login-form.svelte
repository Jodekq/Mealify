<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
</script>

<Card.Root class="mx-auto max-w-sm">
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
				<div class="flex items-center">
					<Label for="password">Password</Label>
				</div>
				<Input id="password" type="password" name="password" required />
			</div>
			<Button variant="ghost" type="submit" class="w-full cursor-pointer">Login</Button>
		</div>
	</Card.Content>
</Card.Root>
