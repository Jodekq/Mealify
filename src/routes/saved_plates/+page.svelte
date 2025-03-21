<!-- src/routes/saved_plates/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton";

  let meals = [];
  let isGridLayout = true; 

  onMount(async () => {
  try {
    const response = await fetch('/api/meals');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.meals) {
      meals = data.meals;
    }
  } catch (error) {
    console.error("Error fetching meals:", error);
  }
});

  function toggleLayout() {
    isGridLayout = !isGridLayout;
  }
</script>

<div class="mt-4 mx-auto px-2 sm:container">
  <div class="text-2xl font-bold mb-4 text-center">Saved Plates</div>
  <div class="flex justify-between pb-4">
    <Button>Filter</Button>
    <Button onclick={toggleLayout}>{isGridLayout ? 'List' : 'Grid'}</Button>
  </div>
  {#if meals.length > 0}
    {#if isGridLayout}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each meals as meal}
        <a href={`/plates/${meal.id}`} class="block">
          <Card.Root>
            <Card.Header>
              <Card.Title>{meal.name}</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex gap-5 items-center">
                {#if meal.ingredientCount > 1}
                  <p>{meal.ingredientCount} Ingredients</p>
                {:else}
                  <p>{meal.ingredientCount} Ingredient</p>
                {/if}
                <div>{meal.totalTime} min</div>
              </div>
            </Card.Content>
          </Card.Root>
        </a>
        {/each}
      </div>
    {:else}
      <!-- List Layout -->
      <div class="space-y-4">
        {#each meals as meal}
          <Card.Root>
            <Card.Header>
              <Card.Title>{meal.name}</Card.Title>
            </Card.Header>
            <Card.Content>
              <div class="flex gap-5 items-center">
                {#if meal.ingredientCount > 1}
                  <p>{meal.ingredientCount} Ingredients</p>
                {:else}
                  <p>{meal.ingredientCount} Ingredient</p>
                {/if}
                <div>{meal.totalTime} min</div>
              </div>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  {:else}
    {#if isGridLayout}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 h-fit">
        <Skeleton class="h-[121.79px] w-[339.65px] rounded-lg border" />
      </div>
    {:else}
      <!-- List Layout -->
      <div class="space-y-4">
        <Skeleton class="h-[121.79px] w-[full] rounded-lg border" />
      </div>
    {/if}
  {/if}
</div>

