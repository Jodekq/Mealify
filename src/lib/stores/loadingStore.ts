// src/lib/stores/loadingStore.ts
import { writable } from 'svelte/store';

export const isLoading = writable(false);
export const loadingProgress = writable(0);

export function startLoading() {
  isLoading.set(true);
  loadingProgress.set(0);
}

export function updateProgress(value: number) {
  const progress = Math.min(100, Math.max(0, value));
  loadingProgress.set(progress);
}

export function completeLoading() {
  loadingProgress.set(100);
  setTimeout(() => {
    isLoading.set(false);
    loadingProgress.set(0);
  }, 300);
}

export function simulateProgress(durationMs = 2000, targetProgress = 90) {
  startLoading();
  
  const stepTime = 100; 
  const steps = durationMs / stepTime;
  const increment = targetProgress / steps;
  let currentStep = 0;
  
  const interval = setInterval(() => {
    currentStep++;
    const nextProgress = currentStep * increment;
    
    if (nextProgress >= targetProgress) {
      clearInterval(interval);
      return;
    }
    
    updateProgress(nextProgress);
  }, stepTime);
  
  return {
    complete: () => {
      clearInterval(interval);
      completeLoading();
    },
    cancel: () => {
      clearInterval(interval);
      isLoading.set(false);
      loadingProgress.set(0);
    }
  };
}