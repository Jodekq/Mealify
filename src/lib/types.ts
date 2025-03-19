//src/lib/types.ts
export type Ingredient = {
  id: string;
  name: string;
  unit: string;
};

export type MealIngredient = {
  id: string;
  ingredient: Ingredient; 
  amount: number;
  unit: string;
  name: string;
};

export type MealStep = {
  id: string;
  stepNumber: number; 
  text: string;
  extraText?: string; 
  description?: string; 
};

export type Meal = {
  id: string;
  name: string;
  ingredients: MealIngredient[];
  steps?: MealStep[];
  workingTime: number;
  cookingTime: number;
  restTime: number;
  totalTime: number;
  portions: number;
  mealSchedules?: MealSchedule[];
  scheduledDates?: ScheduledDate[];
};

export type MealSchedule = {
  id: string;
  date: string;
  meal: Meal | null;
};

export type RollingCalendar = {
  startDate: string; // First day in the rolling view
  days: MealSchedule[]; // Array of 20 days with meal info
};

export type ScheduledDate = {
  id: string;
  date: string;
};