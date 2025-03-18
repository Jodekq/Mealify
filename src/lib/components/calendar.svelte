<script lang="ts">
  import { onMount } from "svelte";
  import { addDays, format } from "date-fns";
  import * as Card from "$lib/components/ui/card";

  let meals: Record<string, { name: string; totalTime: number } | null> = {};

  let today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to midnight

  let days: { date: Date; formatted: string }[] = Array.from({ length: 20 }, (_, i) => {
    let date = addDays(today, i);
    return { date, formatted: format(date, "yyyy-MM-dd") };
  });

  onMount(async () => {
    try {
      const response = await fetch("/api/calendar");
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      meals = Object.assign({}, data.meals || {}); // Ensure reactivity
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  });
</script>

<div class="font-bold text-2xl content-center flex justify-center">Calendar</div>
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
  {#each days as { date, formatted }}
  <Card.Root class="p-2 sm:p-4 {formatted === format(today, 'yyyy-MM-dd') ? 'border-accent' : 'border-secondary'}">
    <Card.Header>
      <Card.Title class="text-sm sm:text-base">{format(date, "MMM dd")}</Card.Title>
    </Card.Header>
    <Card.Content>
      {#if meals[formatted]}
        <div class="text-xs sm:text-sm flex gap-1">
          <div>{meals[formatted].name}</div>
          <div class="text-[10px] sm:text-xs">{meals[formatted].totalTime} min</div>
        </div>
      {:else}
        <div class="text-[10px] sm:text-xs">No meal planned</div>
      {/if}
    </Card.Content>
  </Card.Root>
  {/each}
</div>