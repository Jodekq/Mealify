<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Plate from "$lib/components/plate.svelte";
  import Calendar from "$lib/components/calendar.svelte";
  import Info from "$lib/components/info.svelte";
  import { onMount } from "svelte";
  import type { Meal } from "$lib/types";
  import { Toaster } from "svelte-sonner";

  let todaysMeals: Meal[] = [];
  let isLoading = true;

  // Fetch today's meals
  onMount(async () => {
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
  });
</script>

<Toaster />

<main class="sm:container mt-4 mx-auto px-2">
  <Plate meals={todaysMeals} />
  <Calendar />
  <Info />
</main>