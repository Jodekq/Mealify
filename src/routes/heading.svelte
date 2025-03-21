<script lang="ts">
	import { enhance } from '$app/forms'

	import { Button } from "$lib/components/ui/button/index.js";

  export let data
</script>

<nav class="container pt-8 flex justify-between mx-auto">
	<div class="flex sm:flex-row flex-col">
		<a class="text-xl content-center text-accent-foreground font-bold" href="/">Plate Pilot</a>
		<div class="text-[10px]">Early Access</div>
	</div>
	<div>
		<Button class="px-2 sm:px-4 font-bold" href="/saved_plates" variant="link">Saved Plates</Button>
		<Button class="px-2 sm:px-4 font-bold" href="/add_plate" variant="link">Add Plate</Button>
		<Button class="px-2 sm:px-4 font-bold" href="/my_shares" variant="link">My Shares</Button>
	</div>
	{#if data.user}
		<form action="/?/logout" method="post" use:enhance>
			<Button class="pl-3" type="submit" variant="outline"><i class='bx bx-log-out text-base'></i><div class="hidden sm:block pl-1">Log Out</div></Button>
		</form>
	{:else}
		<Button class="pl-3" href="/login" variant="outline"><i class='bx bx-log-in text-base'></i><div class="hidden sm:block pl-1">Log In</div></Button>
	{/if}
</nav>
