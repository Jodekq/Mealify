<!-- src/routes/plates/[id]/+page.svelte -->
<script lang="ts">
  import Plate from "$lib/components/plate.svelte";
  import { Toaster } from "svelte-sonner";

  export let data;
</script>

<div class="sm:container mt-4 mx-auto px-2">
  <Plate meal={data.meal}/>
</div>