<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Toaster } from "$lib/components/ui/sonner";

  export let data: { meal: any };

  let meal = { ...data.meal };

  const saveChanges = async () => {
    try {
      const res = await fetch('/api/updateMeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meal)
      });

      if (res.ok) {
        window.location.href = `/meals`;
      } else {
      }
    } catch (err) {
      console.error('Error updating meal:', err);
    }
  };
</script>

<div class="max-w-xl mx-auto">
  <h1 class="text-2xl font-bold">Edit Meal</h1>

  <div class="mt-4">
    <label class="block text-sm font-medium">Name</label>
    <Input bind:value={meal.name} />
  </div>

  <div class="mt-4">
    <h2 class="text-lg font-bold">Ingredients</h2>
    {#each meal.ingredients as ingredient, i}
      <div class="flex gap-2">
        <Input type="number" bind:value={meal.ingredients[i].amount} class="w-20" />
        <Input bind:value={meal.ingredients[i].ingredient.name} disabled />
      </div>
    {/each}
  </div>

  <div class="mt-4">
    <h2 class="text-lg font-bold">Steps</h2>
    {#each meal.steps as step, i}
      <div>
        <label class="block text-sm font-medium">Step {i + 1}</label>
        <Input bind:value={meal.steps[i].text} />
      </div>
    {/each}
  </div>

  <Button on:click={saveChanges} class="mt-4">Save Changes</Button>
</div>
