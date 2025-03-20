<script lang="ts">
	import { enhance } from '$app/forms';

	import LoginForm from "$lib/components/login-form.svelte";
</script>

<div class="w3-card w3-margin w3-padding">
	<form class="w3-container" method="post">
		<div class="flex h-screen w-full items-center justify-center px-4">
			<LoginForm />
		</div>
	</form>
</div>