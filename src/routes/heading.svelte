<script lang="ts">
	import { enhance } from '$app/forms'

	import { Button } from "$lib/components/ui/button/index.js";

  export let data
</script>

<nav class="container mt-8 flex justify-between mx-auto">
	<a class="text-xl content-center" href="/">Plate Pilot</a>
	<div>
		<div class="gap-x-16">
			<Button href="/login" variant="link">Saved Plates</Button>
			<Button href="/login" variant="link">Add Plate</Button>
		</div>
	</div>
	{#if data.user}
		<form action="/?/logout" method="post" use:enhance>
			<Button type="submit" variant="outline">Log Out</Button>
		</form>
	{:else}
		<Button href="/login" variant="outline">Log In</Button>
	{/if}
</nav>
