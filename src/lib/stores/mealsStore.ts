// src/lib/stores/mealsStore.ts
import { writable, derived } from 'svelte/store';
import type { Meal } from '$lib/types';

export const allMeals = writable<Meal[]>([]);

export const todaysMeals = writable<Meal[]>([]);

export const scheduledMeals = writable<Record<string, Array<{ name: string; totalTime: number, id: string }>>>({});

export const mealSchedules = writable<Record<string, string[]>>({});

export const isLoading = writable(false);

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getTodayFormatted = (): string => {
  return formatDate(new Date());
};

export async function fetchAllMeals() {
  try {
    isLoading.set(true);
    const response = await fetch('/api/meals');
    if (!response.ok) throw new Error('Failed to fetch meals');
    
    const data = await response.json();
    if (data.meals) {
      allMeals.set(data.meals);
    }
  } catch (error) {
    console.error('Error fetching all meals:', error);
  } finally {
    isLoading.set(false);
  }
}

export async function fetchTodaysMeals() {
  try {
    isLoading.set(true);
    const response = await fetch('/api/meals/today');
    if (!response.ok) throw new Error('Failed to fetch today\'s meals');
    
    const data = await response.json();
    if (data.meals) {
      todaysMeals.set(data.meals);
    }
  } catch (error) {
    console.error('Error fetching today\'s meals:', error);
  } finally {
    isLoading.set(false);
  }
}

export async function fetchCalendarMeals() {
  try {
    isLoading.set(true);
    const response = await fetch('/api/schedule');
    if (!response.ok) throw new Error('Failed to fetch schedule');
    
    const data = await response.json();
    scheduledMeals.set(data.meals || {});
    
    initializeMealSchedules();
  } catch (error) {
    console.error('Error fetching calendar meals:', error);
  } finally {
    isLoading.set(false);
  }
}

export function initializeMealSchedules() {
  let schedules: Record<string, string[]> = {};
  
  scheduledMeals.update(meals => {
    Object.entries(meals).forEach(([date, mealsForDate]) => {
      mealsForDate.forEach(meal => {
        if (!schedules[meal.id]) {
          schedules[meal.id] = [];
        }
        
        if (!schedules[meal.id].includes(date)) {
          schedules[meal.id].push(date);
        }
      });
    });
    
    mealSchedules.set(schedules);
    return meals;
  });
}

export async function addMealToDay(mealId: string, date: string) {
  try {
    isLoading.set(true);
    
    let selectedMeal: Meal | undefined;
    allMeals.update(meals => {
      selectedMeal = meals.find(m => m.id === mealId);
      return meals;
    });
    
    if (!selectedMeal) {
      throw new Error('Meal not found');
    }
    
    let currentDates: string[] = [];
    mealSchedules.update(schedules => {
      currentDates = [...(schedules[mealId] || [])];
      if (!currentDates.includes(date)) {
        currentDates.push(date);
      }
      schedules[mealId] = currentDates;
      return schedules;
    });
    
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
      throw new Error('Failed to update schedule');
    }
    
    scheduledMeals.update(meals => {
      const updatedMeals = [...(meals[date] || [])];
      updatedMeals.push({
        id: selectedMeal.id,
        name: selectedMeal.name,
        totalTime: selectedMeal.totalTime
      });
      
      meals[date] = updatedMeals;
      return meals;
    });
    
    if (date === getTodayFormatted()) {
      todaysMeals.update(meals => {
        if (!meals.some(m => m.id === selectedMeal.id)) {
          return [...meals, selectedMeal];
        }
        return meals;
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error adding meal to day:', error);
    return false;
  } finally {
    isLoading.set(false);
  }
}

export async function removeMealFromDay(mealId: string, date: string) {
  try {
    isLoading.set(true);
    
    let updatedDates: string[] = [];
    mealSchedules.update(schedules => {
      const currentDates = schedules[mealId] || [];
      updatedDates = currentDates.filter(d => d !== date);
      
      if (updatedDates.length === 0) {
        delete schedules[mealId];
      } else {
        schedules[mealId] = updatedDates;
      }
      
      return schedules;
    });
    
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
      throw new Error('Failed to update schedule');
    }
    
    scheduledMeals.update(meals => {
      if (meals[date]) {
        meals[date] = meals[date].filter(m => m.id !== mealId);
      }
      return meals;
    });
    
    if (date === getTodayFormatted()) {
      todaysMeals.update(meals => meals.filter(m => m.id !== mealId));
    }
    
    return true;
  } catch (error) {
    console.error('Error removing meal from day:', error);
    return false;
  } finally {
    isLoading.set(false);
  }
}

export function initializeStore() {
  return Promise.all([
    fetchAllMeals(),
    fetchTodaysMeals(),
    fetchCalendarMeals()
  ]);
}