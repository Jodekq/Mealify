<!-- src/lib/components/multiple-meals.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";
  import AddToToBuyButton from "$lib/components/tobuy-button.svelte";

  import type { Meal } from "$lib/types";

  export let meals: Meal[] = [];
  
  let todaysMeals: Meal[] = [];
  let portionsMap: Record<string, number> = {};
  let originalMealsMap: Record<string, Meal> = {};
  let loadingMeal = true; 

  $: if (meals) {
    originalMealsMap = meals.reduce((acc, meal) => {
      acc[meal.id] = JSON.parse(JSON.stringify(meal));
      portionsMap[meal.id] = meal.portions || 1;
      return acc;
    }, {});
    todaysMeals = [...meals];
    loadingMeal = false;
  }

  const formatTime = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return "0m";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  function updateIngredientAmounts(mealData: Meal) {
    if (!mealData?.id) return mealData;
    
    const mealId = mealData.id;
    const originalMeal = originalMealsMap[mealId];
    
    if (!originalMeal) return mealData;
    
    const currentPortions = portionsMap[mealId] || 1;
    const originalPortions = originalMeal.portions || 1;
    const multiplier = currentPortions / originalPortions;
    
    const updatedMeal = {
      ...mealData,
      ingredients: mealData.ingredients.map(ingredient => {
        const originalIngredient = originalMeal.ingredients.find(i => 
          i.id === ingredient.id || 
          (i.ingredient && i.ingredient.id === ingredient.ingredient?.id)
        );
        
        if (!originalIngredient) return ingredient;
        
        return {
          ...ingredient,
          amount: parseFloat((originalIngredient.amount * multiplier).toFixed(2))
        };
      })
    };

    return updatedMeal;
  }

  function handlePortionChange(mealId: string, newPortions: number) {
    
    if (!mealId || newPortions < 1) return;
    
    portionsMap[mealId] = newPortions;
    portionsMap = {...portionsMap};
    
    const mealIndex = todaysMeals.findIndex(m => m.id === mealId);
    if (mealIndex === -1) return;
   
    
    const updatedMeal = updateIngredientAmounts(todaysMeals[mealIndex]);
    
    todaysMeals = [
      ...todaysMeals.slice(0, mealIndex),
      updatedMeal,
      ...todaysMeals.slice(mealIndex + 1)
    ];
  }

  async function shareMeal(mealId: string) {
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

{#if todaysMeals.length > 0}
  {#each todaysMeals as currentMeal (currentMeal.id)}
    <Card.Root class="mx-auto mb-4">
      <Card.Header class="p-2 pb-0 sm:p-6 sm:pb-0">
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
          <div class="flex gap-2">
            <Button variant="outline" class="content-center flex gap-1" onclick={() => shareMeal(currentMeal.id)}>
              <i class='bx bx-share'></i><div class="hidden sm:block pl-1">Share</div>
            </Button>
            <Button variant="outline" class="content-center" href={`/plates/${currentMeal.id}/edit`}>
              <i class='bx bx-edit-alt'></i><div class="hidden sm:block pl-1">Edit</div>
            </Button>
            <Button variant="outline" class="content-center" href={`/plates/${currentMeal.id}`}>
              <i class='bx bx-calendar'></i><div class="hidden sm:block pl-1">Schedule</div>
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Content class="flex flex-col sm:flex-row gap-4">
        <div class="flex flex-col gap-2 rounded-lg border p-2 sm:w-fit w-full sm:items-start items-center z-40 bg-card">
          <div class="text-sm font-medium flex justify-center sm:justify-start">
            <div class="flex flex-row rounded-lg bg-secondary px-2 py-2 border w-fit items-center gap-1">
              <Label for={`portions-${currentMeal.id}`}>Portions</Label>
              <Input 
                type="number" 
                id={`portions-${currentMeal.id}`} 
                name="portions" 
                min="1" 
                value={portionsMap[currentMeal.id]}
                on:input={(e) => {
                  const newValue = parseInt(e.currentTarget.value);
                  if (!isNaN(newValue) && newValue > 0) {
                    handlePortionChange(currentMeal.id, newValue);
                  }
                }}
              />
            </div>
          </div>
          <div class="px-2 font-bold flex justify-center sm:justify-start">Ingredients</div>
          <div class="flex flex-col gap-2 px-2">
            {#each currentMeal.ingredients as mealIngredient (mealIngredient.id)}
              <div class="flex justify-center sm:justify-start gap-1">
                <AddToToBuyButton 
                  ingredientName={mealIngredient.ingredient.name}
                  amount={mealIngredient.amount}
                  unit={mealIngredient.ingredient.unit}
                  compact={true}
                />
                {#if mealIngredient.amount}
                  {mealIngredient.amount} 
                {/if}
                {#if mealIngredient.ingredient.unit}
                  {mealIngredient.ingredient.unit} 
                {/if}
                {mealIngredient.ingredient.name}
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
{:else if todaysMeals.length = 0}
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