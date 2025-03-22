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
  import Skeleton from "./ui/skeleton/skeleton.svelte";

  import type { Meal, ScheduledDate, MealSchedule } from "$lib/types";

  export let meal: any = null; 
  export let meals: any[] = [];
  
  export let fetchTodaysMeal = false;
  
  let selectedDates: string[] = [];
  let availableDates: string[] = [];
  let isLoading = false;
  let todaysMeals: any[] = [];
  
  let portionsMap = new Map();
  let originalMealsMap = new Map();

  let dates = Array.from({ length: 20 }, (_, i) => {
    const dateTime = new Date();
    dateTime.setDate(dateTime.getDate() + i);
    const today = dateTime.toISOString().split('T')[0];
    return today;
  });

  onMount(async () => {
    if (fetchTodaysMeal && !meal && meals.length === 0) {
      await fetchTodayMeals();
    } else if (meal) {
      initializeMeal(meal);
    } else if (meals.length > 0) {
      todaysMeals = [...meals];

      todaysMeals.forEach(m => {
        initializeMeal(m);
      });
    }
  });

  function initializeMeal(mealData) {
    if (!mealData) return;
    
    const mealId = mealData.id;
    
    originalMealsMap.set(mealId, JSON.parse(JSON.stringify(mealData)));
    
    portionsMap.set(mealId, mealData.portions || 1);
    
    if (mealData.scheduledDates && mealData.scheduledDates.length > 0) {
      selectedDates = mealData.scheduledDates.map(scheduledDate => scheduledDate.date);
    } 
    else if (mealData.schedule && mealData.schedule.length > 0) {
      selectedDates = mealData.schedule.map(schedule => {
        if (schedule.date instanceof Date) {
          return schedule.date.toISOString().split('T')[0];
        }
        return typeof schedule.date === 'string' ? schedule.date : '';
      }).filter(date => date); 
    }
    
    updateIngredientAmounts(mealData);
    
    if (meal && meal.id === mealId) {
      fetchMealDetails();
    }
  }

  async function fetchTodayMeals() {
    try {
      const response = await fetch("/api/meals/today");
      const data = await response.json();
      
      if (data.meals && Array.isArray(data.meals)) {
        todaysMeals = data.meals;
        todaysMeals.forEach(m => {
          initializeMeal(m);
        });
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

  function toggleDate(date: string, mealId: string) {
    if (!mealId) return;
    
    const standardizedDate = new Date(date).toISOString().split('T')[0];
    
    const index = selectedDates.findIndex(d => d === standardizedDate);
    
    if (index >= 0) {
      selectedDates = [...selectedDates.slice(0, index), ...selectedDates.slice(index + 1)];
      saveDates(mealId);
    } else {
      selectedDates = [...selectedDates, standardizedDate];
      saveDates(mealId);
    }
  }

  function isSelected(date: string): boolean {
    const standardizedDate = new Date(date).toISOString().split('T')[0];
    return selectedDates.some(d => d === standardizedDate);
  }

  async function saveDates(mealId: string) {
    if (!mealId) return;
    
    isLoading = true;
    
    try {
      const response = await fetch(`/api/schedule/${mealId}`, {
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

  function updateIngredientAmounts(mealData) {
    if (!mealData || !mealData.id) return mealData;
    
    const mealId = mealData.id;
    
    const originalMeal = originalMealsMap.get(mealId);
    if (!originalMeal) return mealData;
    
    const currentPortions = portionsMap.get(mealId);
    const originalPortions = originalMeal.portions || 1;
    
    const multiplier = currentPortions / originalPortions;
    
    const updatedMeal = JSON.parse(JSON.stringify(mealData));
    
    if (updatedMeal.ingredients && updatedMeal.ingredients.length > 0) {
      updatedMeal.ingredients = updatedMeal.ingredients.map(ingredient => ({
        ...ingredient,
        amount: parseFloat((originalMeal.ingredients.find(i => 
          i.id === ingredient.id
        )?.amount * multiplier).toFixed(2))
      }));
    }
    
    return updatedMeal;
  }

  function handlePortionChange(mealId, newPortions) {
    // Update portions for this specific meal
    portionsMap.set(mealId, newPortions);
    
    // If it's the single meal view
    if (meal && meal.id === mealId) {
      meal = updateIngredientAmounts(meal);
    } 
    // If it's multiple meals view
    else {
      todaysMeals = todaysMeals.map(m => 
        m.id === mealId ? updateIngredientAmounts(m) : m
      );
    }
  }

  async function shareMeal(mealId) {
    if (!mealId) return;
    
    try {
      const response = await fetch(`/api/meals/${mealId}/share`, {
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
</script>

{#if meal}
  <!-- Single meal display -->
  <Card.Root class="mx-auto mb-4">
    <Card.Header class="p-2 sm:p-6">
      <div class="flex gap-2 flex-wrap sm:justify-between">
        <div class="flex gap-2">
          <Card.Title class="content-center">{meal.name}</Card.Title>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="rounded-lg border px-3 text-sm font-medium flex items-center">
              <i class='bx bx-info-circle'></i>
              <div class="hidden sm:block pl-2">Time</div>
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
                onclick={() => toggleDate(date, meal.id)}
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
        <Button variant="outline" class="content-center flex gap-1" onclick={() => shareMeal(meal.id)}>
          <i class='bx bx-share'></i><div class="hidden sm:block pl-1">Share</div>
        </Button>
        <Button variant="outline" class="content-center flex gap-1" href={`/plates/${meal.id}/edit`}>
          <i class='bx bx-edit-alt'></i><div class="hidden sm:block pl-1">Edit</div>
        </Button>
        <Button variant="destructive" class="px-3 py-2 flex gap-1" onclick={() => window.history.back()}>
          <i class='bx bx-x text-lg'></i><div class="hidden sm:block">Close</div>
        </Button>
      </div>
    </Card.Header>
    <Card.Content class="flex flex-col sm:flex-row gap-4">
      <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 w-fit sm:items-start items-center">
        <div class="text-sm font-medium flex justify-center sm:justify-start">
          <div class="flex flex-row rounded-lg bg-secondary px-2 py-2 border w-fit items-center gap-1">
            <Label for={`portions-${meal.id}`}>Portions</Label>
            <Input 
              type="number" 
              id={`portions-${meal.id}`} 
              name="portions" 
              min="1" 
              value={portionsMap.get(meal.id) || 1}
              on:input={(e) => handlePortionChange(meal.id, parseInt(e.currentTarget.value) || 1)}
            />
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
  {#each (todaysMeals.length > 0 ? todaysMeals : meals) as currentMeal (currentMeal.id)}
    <Card.Root class="mx-auto mb-4">
      <Card.Header class="p-2 sm:p-6">
        <div class="flex gap-2 flex-wrap sm:justify-between">
          <div class="flex gap-2">
            <Card.Title class="content-center">{currentMeal.name}</Card.Title>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger class="rounded-lg border px-3 py-2 text-sm font-medium flex items-center">
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
                  onclick={() => toggleDate(date, currentMeal.id)}
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
            <Button variant="outline" class="content-center flex gap-1" onclick={() => shareMeal(currentMeal.id)}>
              <i class='bx bx-share'></i><div class="hidden sm:block pl-1">Share</div>
            </Button>
            <Button variant="outline" class="content-center" href={`/plates/${currentMeal.id}/edit`}>
              <i class='bx bx-edit-alt'></i><div class="hidden sm:block pl-1">Edit</div>
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Content class="flex flex-col sm:flex-row gap-4">
        <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 sm:w-fit w-full sm:items-start items-center z-40 bg-card">
          <div class="text-sm font-medium flex justify-center sm:justify-start">
            <div class="flex flex-row rounded-lg bg-secondary px-2 py-2 border w-fit items-center gap-1">
              <Label for={`portions-${currentMeal.id}`}>Portions</Label>
              <Input 
                type="number" 
                id={`portions-${currentMeal.id}`} 
                name="portions" 
                min="1" 
                value={portionsMap.get(currentMeal.id) || 1}
                on:input={(e) => handlePortionChange(currentMeal.id, parseInt(e.currentTarget.value) || 1)}
              />
            </div>
          </div>
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
<Card.Root class="mx-auto mb-4">
  <Card.Header class="p-2 sm:p-6">
    <div class="flex gap-2 justify-between">
      <div class="flex gap-2 items-center">
        <Skeleton class="h-10 w-24 rounded-lg" />
        <Skeleton class="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton class="h-10 w-12 rounded-lg" />
      <div class="flex gap-2">
        <Skeleton class="h-10 w-12 rounded-lg" />
        <Skeleton class="h-10 w-12 rounded-lg" />
      </div>
    </div>
  </Card.Header>
  <Card.Content class="flex flex-col sm:flex-row gap-4">
    <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 sm:w-1/3 w-full">
      <div class="text-sm font-medium w-full flex justify-center sm:justify-start">
        <Skeleton class="h-10 w-48 rounded-lg" />
      </div>
      <div class="px-2 font-bold flex justify-center sm:justify-start">
        <Skeleton class="h-6 w-24 rounded-lg" />
      </div>
      <div class="flex flex-col gap-2 px-2">
        <Skeleton class="h-5 w-full rounded-lg" />
        <Skeleton class="h-5 w-full rounded-lg" />
        <Skeleton class="h-5 w-full rounded-lg" />
        <Skeleton class="h-5 w-full rounded-lg" />
        <Skeleton class="h-5 w-full rounded-lg" />
      </div>
    </div>
    <div class="sm:w-2/3 w-full">
      <div class="flex flex-col gap-4">
        {#each Array(2) as _, i}
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="sm:w-1/4 rounded-lg border p-2">
              <div class="flex flex-col items-center gap-2">
                <Skeleton class="h-8 w-8 rounded-full" />
                <Skeleton class="h-6 w-32 rounded-lg" />
                <Skeleton class="h-4 w-24 rounded-lg" />
              </div>
            </div>
            <div class="sm:w-3/4 rounded-lg border p-2">
              <Skeleton class="h-20 w-full rounded-lg" />
            </div>
          </div>
        {/each}
      </div>
    </div>
  </Card.Content>
</Card.Root>
{/if}