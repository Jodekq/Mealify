<!-- src/routes/+page.svelte -->
<script lang="ts">
  import MultiplePlates from "$lib/components/multiple-meals.svelte";
  import Calendar from "$lib/components/calendar.svelte";
  import Info from "$lib/components/info.svelte";
  import { onMount } from "svelte";
  import type { Meal } from "$lib/types";
  import { Toaster } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";

  export let data;

  let todaysMeals: Meal[] = [];
  let isLoading = true;

  onMount(async () => {
    if (data.user) {
      try {
        const response = await fetch("/api/meals/today");
        const data = await response.json();
        
        if (data.meals && Array.isArray(data.meals)) {
          todaysMeals = data.meals;
        }
      } catch (error) {
        console.error("Error fetching meals:", error);
      } finally {
        isLoading = false;
      }
    } else {
      isLoading = false;
    }
  });
</script>

<Toaster />

<main class="sm:container mt-4 mx-auto px-2">
  {#if data.user}
    <MultiplePlates meals={todaysMeals} {isLoading} />
    <Calendar />
    <Info />
  {:else}
    <div class="flex flex-col items-center justify-center py-10">
      <Card.Root class="w-full max-w-3xl mx-auto">
        <Card.Header>
          <Card.Title class="text-3xl">Welcome to Mealify</Card.Title>
          <Card.Description>
            Your personal meal planning assistant - focused on what really matters
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="space-y-6">
            <p>
              Mealify helps you plan, organize, and share your meals. Create detailed recipes, schedule them on your calendar, and never worry about what to cook again.
            </p>
            
            <div class="p-4 border border-primary rounded-lg bg-accent/10">
              <h3 class="font-semibold flex items-center gap-2">
                <i class='bx bx-info-circle text-primary'></i>
                No Calorie Tracking
              </h3>
              <p class="mt-1">
                We deliberately don't track calories as we believe focusing on nutritious, balanced meals is more helpful for your well-being than obsessing over calorie numbers.
              </p>
            </div>
            
            <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div class="p-4 border rounded-lg flex flex-col items-center text-center">
                <i class='bx bx-calendar text-4xl text-primary mb-2'></i>
                <h3 class="text-lg font-semibold">Meal Planning</h3>
                <p class="text-sm">Schedule your meals for the days ahead</p>
              </div>
              
              <div class="p-4 border rounded-lg flex flex-col items-center text-center">
                <i class='bx bx-share text-4xl text-primary mb-2'></i>
                <h3 class="text-lg font-semibold">Share Recipes</h3>
                <p class="text-sm">Share your favorite recipes with friends</p>
              </div>
              
              <div class="p-4 border rounded-lg flex flex-col items-center text-center">
                <i class='bx bx-cart text-4xl text-primary mb-2'></i>
                <h3 class="text-lg font-semibold">Shopping Lists</h3>
                <p class="text-sm">Create shopping lists based on your meals</p>
              </div>
            </div>
            
            <div class="flex justify-center mt-6">
              <Button variant="default" size="lg" href="/login">Get Started</Button>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
      
      <Info />
    </div>
  {/if}
</main>