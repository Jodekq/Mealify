<script lang="ts">
	import { enhance } from '$app/forms'

	import { Button } from "$lib/components/ui/button/index.js";

  export let data
</script>

<nav class="container pt-8 flex justify-between mx-auto">
	<a class="text-xl content-center text-accent-foreground" href="/">Plate Pilot</a>
	<div>
		<Button class="px-2 sm:px-4" href="/saved_plates" variant="link">Saved Plates</Button>
		<Button class="px-2 sm:px-4" href="/add_plate" variant="link">Add Plate</Button>
	</div>
	{#if data.user}
		<form action="/?/logout" method="post" use:enhance>
			<Button class="pl-3" type="submit" variant="outline"><i class='bx bx-log-out'></i><div class="hidden sm:block">Log Out</div></Button>
		</form>
	{:else}
		<Button class="pl-3" href="/login" variant="outline"><i class='bx bx-log-in'></i><div class="hidden sm:block">Log In</div></Button>
	{/if}
</nav>
