<script lang="ts">
	import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import * as Popover from "$lib/components/ui/popover";
	import { Toaster } from "$lib/components/ui/sonner";
  import { toast } from "svelte-sonner";

  import type { Meal, ScheduledDate } from "$lib/types";

	let selectedDates: string[] = [];  // Store dates as strings (YYYY-MM-DD format)
  let showPopover = false;
  let availableDates: string[] = [];
  let isLoading = false;
  let saveSuccess = false;
  let saveError = false;

	// Generate dates for the next 20 days
	let dates = Array.from({ length: 20 }, (_, i) => {
	  const dateTime = new Date();
		dateTime.setDate(dateTime.getDate() + i);
		const today = dateTime.toISOString().split('T')[0]; // Use YYYY-MM-DD string format
		console.log(today);
	  return today;
	});

	onMount(async () => {
	  // Load already scheduled dates from the meal data
    if (meal.scheduledDates && meal.scheduledDates.length > 0) {
      selectedDates = meal.scheduledDates.map(scheduledDate => scheduledDate.date); // Directly use date strings
    }
    
    // Fetch available dates from API
    try {
      const res = await fetch(`/api/plates/${meal.id}/schedule`);
      const data = await res.json();
      availableDates = data.days.map(day => day.date);
    } catch (error) {
      console.error("Failed to fetch available dates:", error);
    }
	});

  // Toggle date selection
	function toggleDate(date: string) {
	  const index = selectedDates.indexOf(date);
	  
	  if (index !== -1) {
	    // Remove the date if already selected
	    selectedDates = selectedDates.filter(d => d !== date);
	  } else {
	    // Add the date if not selected
	    selectedDates = [...selectedDates, date];
	  }
	}

  // Check if a date is selected
	function isSelected(date: string): boolean {
	  return selectedDates.includes(date);
	}

  // Save selected dates to the database
  async function saveDates() {
    isLoading = true;
    saveSuccess = false;
    saveError = false;
    
    try {
      // Send the selected dates as strings (YYYY-MM-DD)
      const response = await fetch(`/api/plates/${meal.id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dates: selectedDates })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save dates');
      }
      
      saveSuccess = true;
      
    } catch (error) {
      console.error('Error saving dates:', error);
      saveError = true;
    } finally {
      isLoading = false;
    }
  }

  export let data: { 
    meal: Meal & { 
      scheduledDates?: ScheduledDate[] 
    } 
  };
  const meal = data.meal;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
</script>

<Toaster />

<div class="container mt-4 mx-auto">
  <Card.Root class="mx-auto mb-4">
    <Card.Header>
      <div class="flex justify-between gap-2">
        <div class="flex flex-row gap-4">
          <Card.Title class="content-center">{meal.name}</Card.Title>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="rounded-lg border px-3 text-sm font-medium flex">
              <i class='bx bx-info-circle content-center'></i>
              <div class="content-center"><div class="hidden sm:block pl-2">Time</div></div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Group>
                <DropdownMenu.Label>Total time: {formatTime(meal.totalTime)}</DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>Working time: {formatTime(meal.workingTime)}</DropdownMenu.Item>
                <DropdownMenu.Item>Cooking time: {formatTime(meal.cookingTime)}</DropdownMenu.Item>
                <DropdownMenu.Item>Rest time: {formatTime(meal.restTime)}</DropdownMenu.Item>
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
				<Popover.Root>
					<Popover.Trigger>
						<Button variant="outline">
							<div class="flex items-center gap-2">
								<i class='bx bxs-calendar'></i><div class="hidden sm:block">Schedule ({selectedDates.length})</div>
							</div>
						</Button>
					</Popover.Trigger>
					<Popover.Content>
						<h3 class="text-lg font-semibold mb-2">Select dates to schedule plate</h3>
						<div class="grid grid-cols-5 gap-2 mb-4 text-white">
							{#each dates as date}
							<Button
								class="flex flex-col gap-0 hover:bg-primary hover:text-accent {isSelected(date) ? 'bg-primary text-accent' : 'bg-secondary'}"
								onclick={() => toggleDate(date)}
								title={date}
								variant="outline"
								>
								<span class="text-sm">{new Date(date).getDate()}</span>
								<span class="text-xs">{new Date(date).toDateString().split(' ')[1]}</span>
							</Button>
							{/each}
						</div>
						<div>
							<Button
								disabled={isLoading}
								class="w-full"
                onclick={() => {
                  toast.success("Plate has been scheduled", {
                    description: `Scheduled ${selectedDates}`,
                  });
                  saveDates();
                }}>
								{isLoading ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</Popover.Content>
				</Popover.Root>
        <div class="flex gap-2">
          <Button variant="outline" class="content-center" href={`/plates/${meal.id}/edit`}>
            <i class='bx bx-edit-alt'></i><div class="hidden sm:block pl-1">Edit</div>
          </Button>
          <Button variant="destructive" class="px-2 py-1" href="/saved_plates">
            <i class='bx bx-x text-lg'></i><div class="hidden sm:block">Close</div>
          </Button>
        </div>
      </div>
    </Card.Header>
    <Card.Content class="flex flex-col sm:flex-row gap-4">
      <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 w-full sm:w-1/3">
        <div class="text-sm font-medium w-full flex justify-center sm:justify-start">
          <div class="flex flex-row rounded-lg bg-secondary px-2 py-2 border w-fit">
            <label for="portions" class="text-m font-medium mr-2">Portions: </label>
            <input type="number" id="portions" name="portions" min="1" 
              value={meal.portions || 1}
              class="w-14 rounded-lg bg-secondary px-2 border text-sm font-medium" />
          </div>
        </div>
        <div class="px-2 font-bold flex justify-center sm:justify-start">Ingredients</div>
        <div class="flex flex-col gap-2 px-2">
          {#each meal.ingredients as mealIngredient}
            <div class="flex justify-center sm:justify-start">
              {mealIngredient.amount} {mealIngredient.ingredient.unit} {mealIngredient.ingredient.name}
            </div>
          {/each}
        </div>
      </div>
      <ScrollArea class="h-[300px] w-full sm:w-2/3 overflow-auto">
        <div class="flex flex-col gap-4">
          {#each meal.steps || [] as step}
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
                <div class="flex px-2">{step.description || ''}</div>
              </div>
            </div>
          {/each}
        </div>
      </ScrollArea>
    </Card.Content>    
  </Card.Root>
</div>
