<script lang="ts">
  import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton";

  let meals = [];
  let isGridLayout = true; 

  onMount(async () => {
    const response = await fetch('/api/meals'); 
    const data = await response.json();
    if (data.meals) {
      meals = data.meals;
    }
  });

  function toggleLayout() {
    isGridLayout = !isGridLayout;
  }
</script>

<div class="container mt-4 mx-auto">
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

