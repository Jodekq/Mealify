<script lang="ts">
	import Plate from "$lib/components/plate.svelte";

  export let data
</script>

<main class="container mt-32 mx-auto">
	<div class="mt-8 space-y-6">
		<h1>Hello, {data.user?.username}</h1>
	</div>
	<Plate />
</main>
