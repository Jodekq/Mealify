<script lang="ts">
  import { onMount } from "svelte";
  import { addDays, format } from "date-fns";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import * as Popover from "$lib/components/ui/popover";
  import { Search, Plus, X } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import type { Meal } from "$lib/types";

  let meals: Record<string, Array<{ name: string; totalTime: number, id: string }>> = {};
  let isLoading = false;
  let mealSchedules: Record<string, string[]> = {};

  let now = new Date();
  let today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let days: { date: Date; formatted: string }[] = Array.from({ length: 20 }, (_, i) => {
    let date = addDays(today, i);
    return { date, formatted: format(date, "yyyy-MM-dd") };
  });

  let allMeals: Meal[] = [];
  let filteredMeals: Meal[] = [];
  let searchQuery = "";
  let selectedDate: string = "";
  let openPopoverDate: string | null = null;

  onMount(async () => {
    await fetchCalendarMeals();
    await fetchAllMeals();
    initializeMealSchedules();
  });

  function initializeMealSchedules() {
    mealSchedules = {};
    
    Object.entries(meals).forEach(([date, mealsForDate]) => {
      mealsForDate.forEach(meal => {
        if (!mealSchedules[meal.id]) {
          mealSchedules[meal.id] = [];
        }
        
        if (!mealSchedules[meal.id].includes(date)) {
          mealSchedules[meal.id].push(date);
        }
      });
    });
    
    console.log("Initialized meal schedules:", mealSchedules);
  }

  async function fetchCalendarMeals() {
    try {
      isLoading = true;
      const response = await fetch("/api/schedule");
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      meals = Object.assign({}, data.meals || {}); 
      console.log("Fetched calendar meals:", meals);
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      isLoading = false;
    }
  }

  async function fetchAllMeals() {
    try {
      const response = await fetch("/api/meals");
      if (!response.ok) throw new Error("Failed to fetch meals");

      const data = await response.json();
      if (data.meals) {
        allMeals = data.meals;
        filteredMeals = [...allMeals];
      }
    } catch (error) {
      console.error("Error fetching all meals:", error);
    }
  }

  // Filter meals based on search query AND exclude meals already scheduled for selected date
  function filterMeals(date: string) {
    const currentDayMealIds = (meals[date] || []).map(m => m.id);
    
    return allMeals.filter(meal => {
      const matchesSearch = !searchQuery || 
        meal.name.toLowerCase().includes(searchQuery.toLowerCase());
      const notAlreadyScheduled = !currentDayMealIds.includes(meal.id);
      
      return matchesSearch && notAlreadyScheduled;
    });
  }

  $: {
    if (selectedDate) {
      filteredMeals = filterMeals(selectedDate);
    } else {
      filteredMeals = allMeals.filter(meal => 
        !searchQuery || meal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }

  async function addMealToDay(mealId: string, date: string) {
    try {
      isLoading = true;
      
      // Find the selected meal from allMeals
      const meal = allMeals.find(m => m.id === mealId);
      if (!meal) {
        throw new Error("Meal not found");
      }
      
      // Check if meal is already added to this day
      const dayMeals = meals[date] || [];
      if (dayMeals.some(m => m.id === mealId)) {
        toast.error("This meal is already scheduled for this day");
        return;
      }
      
      // Get the current scheduled dates for this meal
      const currentDates = mealSchedules[mealId] || [];
      
      // Add the new date if it's not already in the list
      if (!currentDates.includes(date)) {
        currentDates.push(date);
      }
      
      console.log(`Scheduling meal ${meal.name} (${mealId}) for dates:`, currentDates);
      
      // Call the API with ALL dates for this meal
      const response = await fetch(`/api/schedule/${mealId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          dates: currentDates
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Schedule API error:", errorData);
        throw new Error("Failed to update schedule");
      }
      
      // Update local state for calendar display
      const updatedMeals = [...(meals[date] || [])];
      updatedMeals.push({
        id: meal.id,
        name: meal.name,
        totalTime: meal.totalTime
      });
      
      meals = {
        ...meals,
        [date]: updatedMeals
      };
      
      // Update our tracking of meal schedules
      mealSchedules = {
        ...mealSchedules,
        [mealId]: currentDates
      };
      
      toast.success(`Added ${meal.name} to ${format(new Date(date), "MMM dd")}`);
      openPopoverDate = null;
      
      // Update the filtered meals to remove the one we just added
      filteredMeals = filterMeals(date);
      
    } catch (error) {
      console.error("Error adding meal to day:", error);
      toast.error("Failed to add meal to calendar");
    } finally {
      isLoading = false;
    }
  }

  async function removeMealFromDay(mealId: string, date: string) {
    try {
      isLoading = true;
      
      // Find the meal to show in the toast
      const meal = meals[date]?.find(m => m.id === mealId);
      const mealName = meal?.name || "Meal";
      
      // Get the current scheduled dates for this meal
      const currentDates = mealSchedules[mealId] || [];
      
      // Remove this date from the list
      const updatedDates = currentDates.filter(d => d !== date);
      
      console.log(`Removing date ${date} for meal ${mealId}. Remaining dates:`, updatedDates);
      
      // Call the API with the UPDATED list of dates (minus the removed one)
      const response = await fetch(`/api/schedule/${mealId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          dates: updatedDates
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Schedule removal API error:", errorData);
        throw new Error("Failed to remove from schedule");
      }
      
      // Update local state for calendar display
      if (meals[date]) {
        meals = {
          ...meals,
          [date]: meals[date].filter(m => m.id !== mealId)
        };
      }
      
      // Update our tracking of meal schedules
      if (updatedDates.length === 0) {
        // Remove the meal from tracking if no dates left
        const { [mealId]: _, ...restSchedules } = mealSchedules;
        mealSchedules = restSchedules;
      } else {
        mealSchedules = {
          ...mealSchedules,
          [mealId]: updatedDates
        };
      }
      
      toast.success(`${mealName} removed from ${format(new Date(date), "MMM dd")}`);
      
      // Update the filtered meals since the removed meal can now be added again
      if (openPopoverDate === date) {
        filteredMeals = filterMeals(date);
      }
      
    } catch (error) {
      console.error("Error removing meal:", error);
      toast.error("Failed to remove meal from calendar");
    } finally {
      isLoading = false;
    }
  }

  function openMealSelector(date: string) {
    selectedDate = date;
    searchQuery = "";
    filteredMeals = filterMeals(date);
    openPopoverDate = date;
  }
</script>

<div class="font-bold text-2xl content-center flex justify-center">Calendar</div>
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
  {#each days as { date, formatted }}
  <Card.Root class="p-2 min-h-[105.95px] {formatted === format(today, 'yyyy-MM-dd') ? 'border-accent' : 'border-secondary'}">
    <Card.Header class="px-2 py-2 pb-0 flex justify-between items-center">
      <Card.Title class="text-sm sm:text-base">{format(date, "MMM dd")}</Card.Title>
      
      <Popover.Root open={openPopoverDate === formatted} onOpenChange={(open) => {
        if (open) {
          selectedDate = formatted;
          openPopoverDate = formatted;
          filteredMeals = filterMeals(formatted);
        } else {
          openPopoverDate = null;
        }
      }}>
        <Popover.Trigger asChild let:builder>
          <Button 
            builders={[builder]} 
            variant="ghost" 
            size="icon" 
            class="h-6 w-6"
            onclick={() => openMealSelector(formatted)}
          >
            <Plus class="h-4 w-4" />
          </Button>
        </Popover.Trigger>
        
        <Popover.Content class="w-64 p-0" align="end">
          <div class="p-2 font-medium border-b">
            Add Meal to {format(date, "MMM dd")}
          </div>
          
          <div class="border-t p-2 max-h-[200px] overflow-auto">
            <div class="relative mb-2">
              <Search class="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="Search meals..."
                class="w-full pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              />
            </div>
            
            <div class="space-y-1 mt-2">
              {#if filteredMeals.length === 0}
                <div class="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No matching meals found.' : 'All meals already scheduled for this day.'}
                </div>
              {:else}
                {#each filteredMeals as meal (meal.id)}
                  <Button
                    variant="ghost"
                    class="w-full justify-between text-left py-2"
                    onclick={() => addMealToDay(meal.id, formatted)}
                  >
                    <span class="font-medium">{meal.name}</span>
                    <span class="text-xs text-muted-foreground">{meal.totalTime} min</span>
                  </Button>
                {/each}
              {/if}
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
    </Card.Header>
    <Card.Content class="px-2 py-2 flex flex-col gap-1">
      {#if meals[formatted] !== undefined}
        {#if meals[formatted] && meals[formatted].length > 0}
          {#each meals[formatted] as meal}
          <div class="relative group">
            <Button variant="outline" href={`/plates/${meal.id}`} class="w-full pr-6">
              <div class="text-xs sm:text-sm flex justify-between w-full items-center">
                <div>{meal.name}</div>
                <div class="text-xs sm:text-xs">{meal.totalTime} min</div>
              </div>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              class="absolute right-0 top-0 h-full opacity-0 group-hover:opacity-100 transition-opacity"
              onclick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                removeMealFromDay(meal.id, formatted);
              }}
            >
            <i class='bx bx-x'></i>
            </Button>
          </div>
          {/each}
        {:else}
          <div class="text-[10px] sm:text-xs text-center py-2">No meal planned</div>
        {/if}
      {:else}
        <Skeleton class="h-[40px] w-full rounded-lg" />
      {/if}
    </Card.Content>
  </Card.Root>
  {/each}
</div>