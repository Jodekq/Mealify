<script lang="ts">
	import '../app.css';
	import Heading from './heading.svelte';
	import Footer from './footer.svelte';

	import '@fontsource-variable/montserrat';
	import '@fontsource-variable/nunito';

	export let data;
</script>

<svelte:head>
	<title>Plate Pilot</title>
</svelte:head>

<Heading {data} />
<slot />
<Footer />
