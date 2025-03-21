<script lang="ts">
  import { onMount } from "svelte";
  import Check from "lucide-svelte/icons/check";
  import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
  import { tick } from "svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import type { Meal } from "$lib/types";

  export let selectedMeal: Meal | null = null;
  export let onSelect: (meal: Meal) => void = () => {};
  
  let open = false;
  let searchQuery = "";
  let meals: Meal[] = [];
  let filteredMeals: Meal[] = [];
  let loading = true;

  onMount(async () => {
    try {
      const response = await fetch('/api/meals');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.meals) {
        meals = data.meals;
        filteredMeals = [...meals];
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      loading = false;
    }
  });

  $: {
    if (searchQuery) {
      filteredMeals = meals.filter(meal => 
        meal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filteredMeals = [...meals];
    }
  }

  function handleSelect(meal: Meal) {
    selectedMeal = meal;
    onSelect(meal);
    open = false;
  }

  function clearSelection() {
    selectedMeal = null;
    onSelect(null);
  }
</script>

<div class="relative w-full">
  <Popover.Root bind:open>
    <Popover.Trigger asChild let:builder>
      <Button
        builders={[builder]} 
        variant="outline" 
        role="combobox" 
        aria-expanded={open}
        class="w-full justify-between"
      >
        {#if selectedMeal}
          <div class="flex gap-2 items-center">
            <span>{selectedMeal.name}</span>
            <span class="text-xs text-muted-foreground">{selectedMeal.totalTime}min</span>
          </div>
        {:else}
          <span>Select a meal</span>
        {/if}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </Popover.Trigger>
    <Popover.Content class="w-full p-0">
      <Command.Root>
        <div class="flex items-center border-b px-3">
          <Command.Input 
            bind:value={searchQuery} 
            placeholder="Search meals..." 
            class="h-9 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        {#if loading}
          <div class="py-6 text-center text-sm text-muted-foreground">
            Loading meals...
          </div>
        {:else if filteredMeals.length === 0}
          <div class="py-6 text-center text-sm text-muted-foreground">
            No meals found.
          </div>
        {:else}
          <Command.List>
            <Command.Empty>No meals found.</Command.Empty>
            <Command.Group heading="Meals">
              {#each filteredMeals as meal (meal.id)}
                <Command.Item
                  value={meal.name}
                  onSelect={() => handleSelect(meal)}
                  class="cursor-pointer"
                >
                  <div class="flex justify-between w-full items-center">
                    <div class="flex items-center">
                      <Check
                        class={cn(
                          "mr-2 h-4 w-4",
                          selectedMeal?.id === meal.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{meal.name}</span>
                    </div>
                    <div class="flex gap-2 text-xs text-muted-foreground">
                      <span>{meal.totalTime}min</span>
                      {#if meal.ingredients}
                        <span>{meal.ingredients.length} ingredients</span>
                      {/if}
                    </div>
                  </div>
                </Command.Item>
              {/each}
            </Command.Group>
          </Command.List>
        {/if}
        {#if selectedMeal}
          <div class="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              class="w-full justify-start text-muted-foreground" 
              on:click={clearSelection}
            >
              Clear selection
            </Button>
          </div>
        {/if}
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
</div>