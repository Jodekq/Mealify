//src/lib/types.ts
export type User = {
  id: string;
  username: string;
  meals: Meal[];
  schedule: MealSchedule[];
  sharedMeals: SharedMeal[];
};

export type Ingredient = {
  id: string;
  name: string;
  unit?: string | null;
  meals?: MealIngredient[];
};

export type MealIngredient = {
  id: string;
  meal_id: string;
  ingredient_id: string;
  ingredient: Ingredient;
  amount?: number | null;
};

export type MealStep = {
  id: string;
  meal_id: string;
  stepNumber: number;
  text: string;
  extraText?: string;
  description?: string;
};

export type Meal = {
  id: string;
  user_id: string;
  name: string;
  workingTime: number;
  cookingTime: number;
  restTime: number;
  totalTime: number;
  portions: number;
  ingredients: MealIngredient[];
  steps?: MealStep[];
  schedule?: MealSchedule[];
  sharedMeals?: SharedMeal[];
  scheduledDates?: ScheduledDate[];
};

export type MealSchedule = {
  id: string;
  user_id: string;
  meal_id: string;
  date: string;
  meal: Meal | null;
};

export type SharedMeal = {
  id: string;
  meal_id: string;
  creator_id: string;
  meal: Meal;
  creator: User;
  shared_at: string;
  expires_at?: string;
};

export type RollingCalendar = {
  startDate: string;
  days: MealSchedule[];
};

export type ScheduledDate = {
  id: string;
  date: string;
};

export type tobuyItem = {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
};

export type tobuyList = {
  id: string;
  name: string;
  isDefault: boolean;
  items: tobuyItem[];
};