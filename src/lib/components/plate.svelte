<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import * as Popover from "$lib/components/ui/popover";
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  import type { Meal, ScheduledDate, MealSchedule } from "$lib/types";

  // Make the meal data optional and accept the server structure
  export let meal: any = null; // For single meal display
  export let meals: any[] = []; // For multiple meals (like today's meals)
  // Optional prop to fetch today's meal when no specific meal is provided
  export let fetchTodaysMeal = false;
  
  let selectedDates: string[] = [];
  let availableDates: string[] = [];
  let isLoading = false;
  let todaysMeals: any[] = [];
  let portions = 1;
  let originalPortions = 1;
  let originalMeal = null;

  // Generate dates for the next 20 days
  let dates = Array.from({ length: 20 }, (_, i) => {
    const dateTime = new Date();
    dateTime.setDate(dateTime.getDate() + i);
    const today = dateTime.toISOString().split('T')[0]; // Use YYYY-MM-DD string format
    return today;
  });

  onMount(async () => {
    if (fetchTodaysMeal && !meal && meals.length === 0) {
      await fetchTodayMeals();
    } else if (meal) {
      initializeMeal();
    } else if (meals.length > 0) {
      todaysMeals = [...meals];
    }
  });

  function initializeMeal() {
    if (!meal) return;
    
    originalMeal = JSON.parse(JSON.stringify(meal));
    portions = meal.portions || 1;
    originalPortions = meal.portions || 1;
    
    // Check for scheduledDates property
    if (meal.scheduledDates && meal.scheduledDates.length > 0) {
      selectedDates = meal.scheduledDates.map(scheduledDate => scheduledDate.date);
    } 
    // Fallback to schedule property if scheduledDates doesn't exist
    else if (meal.schedule && meal.schedule.length > 0) {
      selectedDates = meal.schedule.map(schedule => {
        // Handle both Date objects and strings
        if (schedule.date instanceof Date) {
          return schedule.date.toISOString().split('T')[0];
        }
        return typeof schedule.date === 'string' ? schedule.date : '';
      }).filter(date => date); // Filter out any empty strings
    }
    
    // Optional: fetch additional meal data if needed
    fetchMealDetails();
  }

  async function fetchTodayMeals() {
    try {
      const response = await fetch("/api/meals/today");
      const data = await response.json();
      
      if (data.meals && Array.isArray(data.meals)) {
        todaysMeals = data.meals;
      }
    } catch (error) {
      console.error("Error fetching today's meals:", error);
    }
  }

  async function fetchMealDetails() {
    if (!meal || !meal.id) return;
    
    try {
      const res = await fetch(`/api/meals/${meal.id}`);
      const data = await res.json();
      availableDates = data.days?.map(day => day.date) || [];
    } catch (error) {
      console.error("Error fetching meal details:", error);
    }
  }

  function toggleDate(date: string) {
    if (!meal) return;
    
    const standardizedDate = new Date(date).toISOString().split('T')[0];
    
    const index = selectedDates.findIndex(d => d === standardizedDate);
    
    if (index >= 0) {
      selectedDates = [...selectedDates.slice(0, index), ...selectedDates.slice(index + 1)];
      saveDates();
    } else {
      selectedDates = [...selectedDates, standardizedDate];
      saveDates();
    }
  }

  function isSelected(date: string): boolean {
    const standardizedDate = new Date(date).toISOString().split('T')[0];
    return selectedDates.some(d => d === standardizedDate);
  }

  async function saveDates() {
    if (!meal || !meal.id) return;
    
    isLoading = true;
    
    try {
      const response = await fetch(`/api/schedule/${meal.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dates: selectedDates })
      });
      
      if (!response.ok) {
        toast.error("Failed to save dates", {
          description: "Please try again later or report the issue",
        });
        throw new Error('Failed to save dates');
      }
      
    } catch (error) {
      toast.error("Failed to save dates", {
        description: "Please try again later or report the issue",
      });
    } finally {
      isLoading = false;
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  function updateIngredientAmounts() {
    if (!originalMeal) return;
    
    const updatedMeal = JSON.parse(JSON.stringify(originalMeal));
    const multiplier = portions / originalPortions;
    
    updatedMeal.ingredients = updatedMeal.ingredients.map(ingredient => ({
      ...ingredient,
      amount: parseFloat((ingredient.amount * multiplier).toFixed(2))
    }));
    
    meal = updatedMeal;
  }

  async function shareMeal() {
    if (!meal || !meal.id) return;
    
    try {
      const response = await fetch(`/api/meals/${meal.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Share API error:', { 
          status: response.status, 
          statusText: response.statusText,
          body: errorText 
        });
        throw new Error(`Failed to create share link: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareLink);
      toast.success("Share link copied to clipboard!", {
        description: "You can now share this with your friends."
      });
    } catch (error) {
      console.error("Error sharing meal:", error);
      toast.error("Failed to create share link", {
        description: error.message || "Please try again later."
      });
    }
  }

  $: if (portions && originalMeal) {
    updateIngredientAmounts();
  }
</script>

{#if meal}
  <!-- Single meal display -->
  <Card.Root class="mx-auto mb-4">
    <Card.Header>
      <div class="flex gap-2 flex-wrap">
        <div class="flex gap-2">
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
            <h3 class="text-lg font-semibold mb-2">Schedule plate</h3>
            <div class="grid grid-cols-5 gap-2 mb-4 text-white">
              {#each dates as date}
              <Button
                class="flex flex-col gap-0 hover:bg-primary hover:text-accent {isSelected(date) ? 'bg-primary text-accent' : 'bg-secondary'}"
                on:click={() => toggleDate(date)}
                title={date}
                variant="outline"
                >
                <span class="text-sm">{new Date(date).getDate()}</span>
                <span class="text-xs">{new Date(date).toDateString().split(' ')[1]}</span>
              </Button>
              {/each}
            </div>
          </Popover.Content>
        </Popover.Root>
        <Button variant="outline" class="content-center flex gap-1" on:click={shareMeal}>
          <i class='bx bx-share'></i><div class="hidden sm:block pl-1">Share</div>
        </Button>
        <Button variant="outline" class="content-center flex gap-1" href={`/plates/${meal.id}/edit`}>
          <i class='bx bx-edit-alt'></i><div class="hidden sm:block pl-1">Edit</div>
        </Button>
        <Button variant="destructive" class="px-3 py-2 flex gap-1" on:click={() => window.history.back()}>
          <i class='bx bx-x text-lg'></i><div class="hidden sm:block">Close</div>
        </Button>
      </div>
    </Card.Header>
    <Card.Content class="flex flex-col sm:flex-row gap-4">
      <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 w-fit sm:items-start items-center">
        <div class="text-sm font-medium flex justify-center sm:justify-start">
          <div class="flex flex-row rounded-lg bg-secondary px-2 py-2 border w-fit items-center gap-1">
            <Label for="portions">Portions</Label>
            <Input type="number" id="portions" name="portions" min="1" bind:value={portions}/>
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
      <ScrollArea class="h-[300px] w-full overflow-auto">
        <div class="flex flex-col gap-4">
          {#each meal.steps || [] as step}
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="sm:w-1/4 flex justify-center border rounded-lg p-2">
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
              <div class="sm:w-3/4 border border-dashed rounded-lg p-2">
                <div class="flex px-2">{step.description || ''}</div>
              </div>
            </div>
          {/each}
        </div>
      </ScrollArea>
    </Card.Content>    
  </Card.Root>
  
{:else if todaysMeals.length > 0 || meals.length > 0}
  <!-- Multiple meals display -->
  {#each (todaysMeals.length > 0 ? todaysMeals : meals) as currentMeal}
    <Card.Root class="mx-auto mb-4">
      <Card.Header>
        <div class="flex gap-2">
          <div class="flex gap-2">
            <Card.Title class="content-center">{currentMeal.name}</Card.Title>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="rounded-lg border px-3 py-2 text-sm font-medium flex">
                <i class='bx bx-info-circle content-center'></i>
                <div class="content-center"><div class="hidden sm:block sm:pl-2">Time</div></div>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Group>
                  <DropdownMenu.Label>Total time: {formatTime(currentMeal.totalTime)}</DropdownMenu.Label>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>Working time: {formatTime(currentMeal.workingTime)}</DropdownMenu.Item>
                  <DropdownMenu.Item>Cooking time: {formatTime(currentMeal.cookingTime)}</DropdownMenu.Item>
                  <DropdownMenu.Item>Rest time: {formatTime(currentMeal.restTime)}</DropdownMenu.Item>
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
              <h3 class="text-lg font-semibold mb-2">Schedule plate</h3>
              <div class="grid grid-cols-5 gap-2 mb-4 text-white">
                {#each dates as date}
                <Button
                  class="flex flex-col gap-0 hover:bg-primary hover:text-accent {isSelected(date) ? 'bg-primary text-accent' : 'bg-secondary'}"
                  on:click={() => toggleDate(date)}
                  title={date}
                  variant="outline"
                  >
                  <span class="text-sm">{new Date(date).getDate()}</span>
                  <span class="text-xs">{new Date(date).toDateString().split(' ')[1]}</span>
                </Button>
                {/each}
              </div>
            </Popover.Content>
          </Popover.Root>
          <div class="flex gap-2">
            <Button variant="outline" class="content-center flex gap-1" on:click={shareMeal}>
              <i class='bx bx-share'></i><div class="hidden sm:block pl-1">Share</div>
            </Button>
            <Button variant="outline" class="content-center" href={`/plates/${currentMeal.id}/edit`}>
              <i class='bx bx-edit-alt'></i><div class="hidden sm:block pl-1">Edit</div>
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Content class="flex flex-col sm:flex-row gap-4">
        <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 w-fit sm:items-start items-center">
          <div class="px-2 font-bold flex justify-center sm:justify-start">Ingredients</div>
          <div class="flex flex-col gap-2 px-2">
            {#each currentMeal.ingredients as mealIngredient}
              <div class="flex justify-center sm:justify-start">
                {mealIngredient.amount} {mealIngredient.ingredient.unit} {mealIngredient.ingredient.name}
              </div>
            {/each}
          </div>
        </div>
        <ScrollArea class="min-h-[500px] h-fit w-full overflow-auto">
          <div class="flex flex-col gap-4">
            {#each currentMeal.steps || [] as step}
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="sm:w-1/4 flex justify-center border rounded-lg p-2">
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
                <div class="sm:w-3/4 border border-dashed rounded-lg p-2">
                  <div class="flex px-2">{step.description || ''}</div>
                </div>
              </div>
            {/each}
          </div>
        </ScrollArea>
      </Card.Content>    
    </Card.Root>
  {/each}
{:else if fetchTodaysMeal}
  <div class="flex flex-col items-center justify-center h-full pb-8">
    <p class="text-lg font-medium">No planned meals today</p>
    <Button variant="default" href="/saved_plates">Click here to add one</Button> 
  </div>
{:else}
<!-- Add skeleton -->
  <div class="flex justify-center">
    <p>No meal data provided</p>
  </div>
{/if}