<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import Heading from './heading.svelte';
	import Footer from './footer.svelte';
	import LoadingBar from '$lib/components/loading-bar.svelte';
	import { isLoading, loadingProgress } from '$lib/stores/loadingStore';
	import { afterNavigate, beforeNavigate } from '$app/navigation';

	import '@fontsource-variable/montserrat';
	import '@fontsource-variable/nunito';

	beforeNavigate(() => {
		isLoading.set(true);
		loadingProgress.set(0);
	});

	afterNavigate(() => {
		loadingProgress.set(100);
		setTimeout(() => {
			isLoading.set(false);
			loadingProgress.set(0);
		}, 300);
	});

	export let data;
</script>

<svelte:head>
	<title>Mealify</title>
	<meta name="theme-color" content="#22c55e">
	<meta name="robots" content="index,follow">
	<meta name="googlebot" content="index,follow">
</svelte:head>

<LoadingBar loading={isLoading} progress={loadingProgress} />

<Heading {data} />
<slot />
<Footer />