<!-- src/lib/components/ui/loading-bar/index.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let loading;
  export let progress;
  
  export let color = '#22c55e'; 
  export let height = '3px';
  export let duration = 300; 
  export let autoIncrement = true;
  export let fixed = true; 

  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let visible = false;
  let currentProgress = 0;
  let highestProgress = 0; 
  
  $: {
    if ($loading) {
      visible = true;
      if (autoIncrement) startProgressIncrement();
    } else {
      if (visible) {
        currentProgress = 100;
        highestProgress = 100;
        setTimeout(() => {
          visible = false;
          currentProgress = 0;
          highestProgress = 0;
        }, 200);
      }
    }
  }
  
  $: {
    if ($progress > highestProgress) {
      highestProgress = $progress;
      currentProgress = $progress;
    }
  }
  
  function startProgressIncrement() {
    if (progressInterval) clearInterval(progressInterval);
    
    progressInterval = setInterval(() => {
      progress.update(p => {
        const increment = (90 - p) / 10;
        const next = p + (increment > 0.2 ? increment : 0.2);
        
        return next > 90 ? 90 : next;
      });
    }, duration);
  }
  
  function stopProgressIncrement() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }
  
  onMount(() => {
    if ($loading && autoIncrement) startProgressIncrement();
  });
  
  onDestroy(() => {
    stopProgressIncrement();
  });
</script>

{#if visible}
  <div 
    class="{fixed ? 'fixed' : 'absolute'} top-0 left-0 right-0 z-50 w-full pointer-events-none"
    aria-hidden="true"
  >
    <div
      class="h-full bg-primary"
      style="width: {currentProgress}%; height: {height}; transition: width {duration}ms ease-out; background-color: {color};"
    ></div>
  </div>
{/if}