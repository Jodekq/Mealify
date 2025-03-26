<!-- src/routes/plates/[id]/+page.svelte -->
<script lang="ts">
  import SinglePlate from "$lib/components/single-meal.svelte";
  import { Toaster } from "svelte-sonner";

  export let data;
</script>

<div class="sm:container mt-4 mx-auto px-2">
  <SinglePlate meal={data.meal}/>
</div>