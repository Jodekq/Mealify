<script lang="ts">
  import { onMount } from "svelte";
  import { 
    addDays, 
    format, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    getMonth, 
    addWeeks, 
    subWeeks,
    isSameDay,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isWithinInterval
  } from "date-fns";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import * as Popover from "$lib/components/ui/popover";
  import * as Tabs from "$lib/components/ui/tabs";
  import { Search, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { toast } from "svelte-sonner";
  import type { Meal } from "$lib/types";

  // Calendar data
  let meals: Record<string, Array<{ name: string; totalTime: number, id: string }>> = {};
  let isLoading = false;
  let mealSchedules: Record<string, string[]> = {};

  // View state
  let viewMode: "month" | "week" = "month";
  let today = new Date();
  let currentDate = new Date();
  let currentMonth = getMonth(currentDate);
  
  // Week days for header labels
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Navigation and selection state
  let allMeals: Meal[] = [];
  let filteredMeals: Meal[] = [];
  let searchQuery = "";
  let selectedDate: string = "";
  let openPopoverDate: string | null = null;

  // Generate calendar data based on current view
  $: calendarDays = generateCalendarDays(currentDate, viewMode);
  $: monthLabel = format(currentDate, "MMMM yyyy");
  $: weekLabel = `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`;

  onMount(async () => {
    await fetchCalendarMeals();
    await fetchAllMeals();
    initializeMealSchedules();
  });

  function generateCalendarDays(date: Date, view: "month" | "week") {
    if (view === "week") {
      // Get days for the week view
      const start = startOfWeek(date);
      const end = endOfWeek(date);
      return eachDayOfInterval({ start, end });
    } else {
      // Get days for the month view (up to 30 days)
      // Start from the beginning of the current week
      const startDate = startOfWeek(date);
      // Create an array of up to 30 days
      return Array.from({ length: 30 }, (_, i) => addDays(startDate, i));
    }
  }

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
  }

  async function fetchCalendarMeals() {
    try {
      isLoading = true;
      const response = await fetch("/api/schedule");
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      meals = Object.assign({}, data.meals || {}); 
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

  function navigateToNextPeriod() {
    if (viewMode === "week") {
      currentDate = addWeeks(currentDate, 1);
    } else {
      // Move forward 4 weeks in month view
      currentDate = addWeeks(currentDate, 4);
    }
  }

  function navigateToPreviousPeriod() {
    if (viewMode === "week") {
      currentDate = subWeeks(currentDate, 1);
    } else {
      // Move backward 4 weeks in month view
      currentDate = subWeeks(currentDate, 4);
    }
  }

  function goToToday() {
    currentDate = new Date();
  }

  function changeView(newView: "month" | "week") {
    viewMode = newView;
    // Reset to current date when changing views to prevent confusion
    currentDate = new Date();
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

  function getDayClasses(date: Date) {
    const isToday = isSameDay(date, today);
    const isCurrentMonth = isSameMonth(date, currentDate);
    
    return `
      relative
      h-full min-h-[120px]
      border border-border
      p-1
      ${isToday ? 'bg-primary/10 border-primary' : 'bg-card'}
      ${isCurrentMonth ? '' : 'opacity-50'}
    `;
  }
</script>

<Card.Root class="mb-8 w-full">
  <Card.Header class="pb-0 sm:p-6 p-2">
    <div class="flex justify-between items-center mb-4">
      <Card.Title class="text-xl">Meal Calendar</Card.Title>
      
      <div class="flex gap-2">
        <Tabs.Root value={viewMode} onValueChange={(value) => changeView(value as "month" | "week")}>
          <Tabs.List class="grid w-full grid-cols-2">
            <Tabs.Trigger value="month">Month</Tabs.Trigger>
            <Tabs.Trigger value="week">Week</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
    </div>
    
    <div class="flex justify-between items-center">
      <Button variant="outline" size="sm" onclick={navigateToPreviousPeriod}>
        <ChevronLeft class="h-4 w-4" />
      </Button>
      
      <div class="flex items-center gap-2">
        <h3 class="font-medium text-lg">
          {viewMode === "month" ? monthLabel : weekLabel}
        </h3>
        <Button variant="outline" size="sm" onclick={goToToday}>Today</Button>
      </div>
      
      <Button variant="outline" size="sm" onclick={navigateToNextPeriod}>
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </Card.Header>
  
  <Card.Content class="p-0 overflow-hidden">
    {#if viewMode === "month"}
      <!-- Month View -->
      <div class="w-full">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 text-center border-b">
          {#each weekdays as day}
            <div class="p-2 text-sm font-medium">{day}</div>
          {/each}
        </div>
        
        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 auto-rows-fr">
          {#each calendarDays as date}
            {@const dateFormatted = format(date, "yyyy-MM-dd")}
            <div class={getDayClasses(date)}>
              <!-- Date Display -->
              <div class="flex justify-between items-start">
                <span class="text-sm font-medium">{format(date, "d")}</span>
                
                <Popover.Root open={openPopoverDate === dateFormatted} onOpenChange={(open) => {
                  if (open) {
                    selectedDate = dateFormatted;
                    openPopoverDate = dateFormatted;
                    filteredMeals = filterMeals(dateFormatted);
                  } else {
                    openPopoverDate = null;
                  }
                }}>
                  <Popover.Trigger asChild let:builder>
                    <Button 
                      builders={[builder]} 
                      variant="ghost" 
                      size="icon" 
                      class="h-5 w-5"
                      onclick={() => openMealSelector(dateFormatted)}
                    >
                      <i class='bx bx-plus text-xs'></i>
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
                              onclick={() => addMealToDay(meal.id, dateFormatted)}
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
              </div>
              
              <!-- Meal List -->
              <div class="mt-1 space-y-1 overflow-y-auto max-h-[120px]">
                {#if meals[dateFormatted] !== undefined}
                  {#if meals[dateFormatted] && meals[dateFormatted].length > 0}
                    {#each meals[dateFormatted] as meal}
                      <div class="relative group">
                        <Button 
                          variant="ghost" 
                          href={`/plates/${meal.id}`} 
                          class="w-full text-left p-1 h-auto text-xs flex justify-between items-center truncate hover:bg-secondary"
                        >
                          <span class="truncate">{meal.name}</span>
                          <span class="text-muted-foreground text-[10px]">{meal.totalTime}m</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          class="absolute right-0 top-0 h-full w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                          onclick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            removeMealFromDay(meal.id, dateFormatted);
                          }}
                        >
                          <i class='bx bx-x text-[10px]'></i>
                        </Button>
                      </div>
                    {/each}
                  {/if}
                {:else if isLoading}
                  <Skeleton class="h-4 w-full" />
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Week View -->
      <div class="w-full">
        <!-- Weekday Headers for Week View -->
        <div class="grid grid-cols-7 text-center border-b">
          {#each calendarDays as date, i}
            <div class="p-2 font-medium {isSameDay(date, today) ? 'bg-primary/10' : ''}">
              <div>{weekdays[i]}</div>
              <div class="text-lg">{format(date, "d")}</div>
            </div>
          {/each}
        </div>
        
        <!-- Week Calendar with Expanded View -->
        <div class="grid grid-cols-7 min-h-[500px]">
          {#each calendarDays as date}
            {@const dateFormatted = format(date, "yyyy-MM-dd")}
            <div class={`border p-2 ${isSameDay(date, today) ? 'bg-primary/10 border-primary' : ''}`}>
              <!-- Add Button -->
              <div class="flex justify-end mb-2">
                <Popover.Root open={openPopoverDate === dateFormatted} onOpenChange={(open) => {
                  if (open) {
                    selectedDate = dateFormatted;
                    openPopoverDate = dateFormatted;
                    filteredMeals = filterMeals(dateFormatted);
                  } else {
                    openPopoverDate = null;
                  }
                }}>
                  <Popover.Trigger asChild let:builder>
                    <Button 
                      builders={[builder]} 
                      variant="outline" 
                      size="sm" 
                      class="h-8 px-2 flex gap-1"
                      onclick={() => openMealSelector(dateFormatted)}
                    >
                      <i class='bx bx-plus'></i>
                      <div class="hidden sm:block">Add Meal</div>
                    </Button>
                  </Popover.Trigger>
                  
                  <Popover.Content class="w-72 p-0" align="end">
                    <div class="p-2 font-medium border-b">
                      Add Meal to {format(date, "EEEE, MMM dd")}
                    </div>
                    
                    <div class="border-t p-2 max-h-[300px] overflow-auto">
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
                              onclick={() => addMealToDay(meal.id, dateFormatted)}
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
              </div>
              
              <!-- Meal List for Week View -->
              <div class="space-y-2">
                {#if meals[dateFormatted] !== undefined}
                  {#each meals[dateFormatted] as meal}
                    <Card.Root class="overflow-hidden">
                      <div class="relative group">
                        <Button 
                          variant="ghost" 
                          href={`/plates/${meal.id}`} 
                          class="w-full text-left p-2 h-auto flex flex-col items-start"
                        >
                          <div class="font-medium">{meal.name}</div>
                          <div class="flex items-center text-xs text-muted-foreground">
                            <i class='bx bx-time-five mr-1'></i> {meal.totalTime} min
                          </div>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          class="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onclick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            removeMealFromDay(meal.id, dateFormatted);
                          }}
                        >
                          <i class='bx bx-x'></i>
                        </Button>
                      </div>
                    </Card.Root>
                  {/each}
                {:else if isLoading}
                  <Skeleton class="h-16 w-full" />
                  <Skeleton class="h-16 w-full" />
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>