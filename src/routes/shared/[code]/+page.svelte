<!-- src/routes/shared/[code]/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
  import type { Meal } from "$lib/types";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  // Define the structure of the page data
  type PageData = {
    meal?: Meal;
    creator?: { 
      id: string;
      username: string;
    };
    shareCode?: string;
    user: { 
      id: string;
      username: string;
    } | null;
  };

  export let data: PageData;
  
  let meal = data.meal;
  let portions = meal?.portions || 1; 
  let creatorUsername = data.creator?.username || "Another cook";
  let isAuthenticated = data.user !== null;
  let isImporting = false;
  let isCreator = data.user?.id === data.creator?.id;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  async function importMeal() {
    if (!isAuthenticated) {
      toast.error("Please log in to import this meal", {
        description: "You need to be logged in to save meals to your collection."
      });
      return;
    }
    
    isImporting = true;
    
    try {
      const response = await fetch(`/api/shared/${data.shareCode}/import`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to import meal');
      }
      
      const result = await response.json();
      
      toast.success("Meal imported successfully!", {
        description: "You can now find it in your Saved Plates."
      });
      
      window.location.href = `/plates/${result.mealId}`;
      
    } catch (error) {
      toast.error("Failed to import meal", {
        description: "Please try again later."
      });
      console.error("Error importing meal:", error);
    } finally {
      isImporting = false;
    }
  }
</script>

<Toaster />

<div class="mt-4 mx-auto px-2 sm:container">
  {#if meal}
    <Card.Root class="mx-auto mb-4">
      <Card.Header>
        <div class="flex flex-col sm:flex-row justify-between gap-2">
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
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div class="text-sm mr-0 sm:mr-4 flex items-center gap-1">
              <i class='bx bx-user'></i>
              <span>Shared by: <span class="font-medium">{creatorUsername}</span></span>
            </div>
            {#if !isCreator}
              <Button onclick={importMeal} disabled={isImporting} variant="default">
                {isImporting ? 'Importing...' : 'Import to My Plates'}
              </Button>
            {/if}
          </div>
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
                {(mealIngredient.amount * (portions / meal.portions))} {mealIngredient.ingredient.unit} {mealIngredient.ingredient.name}
              </div>
            {/each}
          </div>
        </div>
        <ScrollArea class="min-h-[500px] h-fit w-full overflow-auto">
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
  {:else}
    <div class="flex flex-col items-center justify-center py-20">
      <div class="text-xl font-bold mb-4">Meal not found</div>
      <p class="text-muted-foreground mb-6">This shared meal might have expired or been removed by its creator.</p>
      <Button href="/saved_plates">Browse your saved plates</Button>
    </div>
  {/if}
</div>