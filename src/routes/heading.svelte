<script lang="ts">
	import { enhance } from '$app/forms'

	import { Button } from "$lib/components/ui/button/index.js";

  export let data
</script>

<nav class="sm:container pt-6 flex justify-between mx-auto p-2">
	<div class="flex sm:flex-row flex-col">
		<a class="text-xl content-center text-accent-foreground font-bold" href="/">Mealify</a>
		<div class="text-[10px]">Early Access</div>
	</div>
	<div class="flex gap-2">
		<Button class="px-2 sm:px-4 font-bold flex gap-1" href="/saved_meals" variant="link"><i class='bx bx-save sm:text-sm text-xl'></i><div class="sm:block hidden">Saved Meals</div></Button>
		<Button class="px-2 sm:px-4 font-bold flex gap-1" href="/add_meal" variant="link"><i class='bx bxs-file-plus sm:text-sm text-xl'></i><div class="sm:block hidden">Add Meal</div></Button>
		<Button class="px-2 sm:px-4 font-bold flex gap-1" href="/my_shares" variant="link"><i class='bx bx-share sm:text-sm text-xl'></i><div class="sm:block hidden">My Shares</div></Button>
		<Button class="px-2 sm:px-4 font-bold flex gap-1" href="/tobuy" variant="link"><i class='bx bx-cart sm:text-sm text-xl'></i><div class="sm:block hidden">ToBuy</div></Button>
	</div>
	{#if data.user}
		<form action="/?/logout" method="post" use:enhance>
			<Button class="pl-3" type="submit" variant="outline"><i class='bx bx-log-out text-base'></i><div class="hidden sm:block pl-1">Log Out</div></Button>
		</form>
	{:else}
		<Button class="pl-3" href="/login" variant="outline"><i class='bx bx-log-in text-base'></i><div class="hidden sm:block pl-1">Log In</div></Button>
	{/if}
</nav>
