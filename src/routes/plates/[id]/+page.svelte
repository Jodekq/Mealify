<script lang="ts">
  import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Badge } from '$lib/components/ui/badge';

  import type { Meal } from "$lib/types";

  export let data: { 
    meal: Meal & { 
      scheduledDates?: { id: string, date: string }[] 
    } 
  };
  const meal = data.meal;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Remove a scheduled date
  const removeScheduledDate = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/schedule?id=${scheduleId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Refresh the page to see the updated schedule
        window.location.reload();
      } else {
        console.error('Failed to remove scheduled date');
      }
    } catch (err) {
      console.error('Error removing scheduled date:', err);
    }
  };
</script>

<div class="container mt-4 mx-auto">
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
								<DropdownMenu.GroupHeading>Total time: {meal.totalTime} min</DropdownMenu.GroupHeading>
								<DropdownMenu.Separator />
								<DropdownMenu.GroupHeading>Working time: {meal.workingTime} min</DropdownMenu.GroupHeading>
								<DropdownMenu.GroupHeading>Cooking time: {meal.cookingTime} min</DropdownMenu.GroupHeading>
								<DropdownMenu.GroupHeading>Rest time: {meal.restTime} min</DropdownMenu.GroupHeading>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
				{#if meal}
				<div class="flex flex-wrap gap-2">
					{#each meal.scheduledDates as schedule}
						<Badge variant="secondary" class="flex items-center gap-2 py-1.5 px-3">
							{formatDate(schedule.date)}
							<button 
								class="ml-1 text-xs hover:bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
								on:click|preventDefault={() => removeScheduledDate(schedule.id)}
								aria-label="Remove date"
							>
								×
							</button>
						</Badge>
					{/each}
				</div>
				{:else}
					<Button variant="default"><i class='bx bx-plus'></i><div class="hidden sm:block">Schedule</div></Button> 
				{/if}
				<Button class="content-center"><i class='bx bx-calendar'></i><div class="hidden sm:block">Switch</div></Button>
			</div>
		</Card.Header>
		<Card.Content class="flex flex-col sm:flex-row gap-4">
			<div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0">
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
</div>
