<script lang="ts">
  import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";

  import type { Meal } from "$lib/types";

	let meal:Meal | null = null;

  let today = new Date();
	today.setHours(0, 0, 0, 0);
	let day: number = today.getDate(); 
	let month: number = today.getMonth() + 1;

	let formattedDate: string = `${day}.${month}`;

	// Fetch today's meal
	onMount(async () => {
		const response = await fetch("/api/main_plate/");
		const data = await response.json();
		meal = data.meal; 
	});
</script>

{#if meal}
	<Card.Root class="mx-auto mb-4">
		<Card.Header>
			<div class="flex justify-between">
				<div class="flex flex-row gap-4">
					<Card.Title class="content-center">{meal.name}</Card.Title>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="rounded-lg border px-3 text-sm font-medium flex">
							<i class='bx bx-info-circle content-center'></i>
							<div class="content-center"><div class="hidden sm:block pl-2">Time</div></div>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Total time: {meal.totalTime} min</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>Working time: {meal.workingTime} min</DropdownMenu.Item>
								<DropdownMenu.Item>Cooking time: {meal.cookingTime} min</DropdownMenu.Item>
								<DropdownMenu.Item>Rest time: {meal.restTime} min</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				{#if formattedDate}
				<div class="rounded-lg border px-2 content-center cursor-pointer bg-secondary text-sm font-medium">{formattedDate}</div>
				{:else}
					<Button variant="default"><i class='bx bx-plus'></i><div class="hidden sm:block">Schedule</div></Button> 
				{/if}
				<Button class="content-center"><i class='bx bx-calendar'></i><div class="hidden sm:block">Switch</div></Button>
			</div>
		</Card.Header>
		<Card.Content class="flex flex-col sm:flex-row gap-4">
			<div class="flex flex-col gap-2 rounded-lg border p-2">
				<div class="text-sm font-medium w-full flex justify-center sm:justify-start">
					<div class="flex flex-row rounded-lg bg-secondary px-2 py-2 border w-fit">
						<label for="portions" class="text-m font-medium">Portions: </label>
						<input type="number" id="portions" name="portions" min="1" value="1"
							class="w-14 rounded-lg bg-secondary px-2 border text-sm font-medium" />
					</div>
				</div>
				<div class="px-2 font-bold flex justify-center sm:justify-start">Ingredients</div>
				<div class="flex flex-col gap-2 px-2">
					{#each meal.ingredients as mealIngredient}
						<div class="flex justify-center sm:justify-start">{mealIngredient.amount} {mealIngredient.ingredient.unit} {mealIngredient.ingredient.name}</div>
					{/each}
				</div>
			</div>
			<ScrollArea class="h-[300px] w-full overflow-auto">
				<div class="flex flex-col gap-4">
					{#each meal.steps as step}
						<div class="flex flex-col sm:flex-row gap-4">
							<div class="sm:w-1/3 flex justify-center border rounded-lg p-2">
								<div class="flex flex-col items-center">
									<div class="w-8 h-8 flex items-center justify-center rounded-full bg-accent font-bold">
										{step.stepNumber}
									</div>
									<div class="text-center text-m">{step.text}</div>
									{#if step.extraText}
										<div class="text-sm text-gray-500">{step.extraText}</div>
									{/if}
								</div>
							</div>
							<div class="sm:w-2/3 border border-dashed rounded-lg p-2">
								<div class="flex px-2">{step.description}</div>
							</div>
						</div>
					{/each}
				</div>
			</ScrollArea>
		</Card.Content>		
	</Card.Root>
{:else}
	<div class="flex flex-col items-center justify-center h-full">
		<p class="text-lg font-medium">No planned meal today</p>
		<Button variant="default" href="/add_plate">Click here to add one</Button> 
	</div>
{/if}