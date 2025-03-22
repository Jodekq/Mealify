<script lang="ts">
	import * as Popover from "$lib/components/ui/popover";
</script>

<div class="container mt-32 mx-auto">
	<footer class="py-8 flex justify-center">
		<nav class="flex flex-row justify-between sm:w-1/2 w-full">
			<div class="flex flex-col gap-20">
				<div>
					<div class="text-xl font-bold">Plate Pilot</div>
					<div>Manage what you eat.</div>
				</div>
				<div>Made with &lt3 by @jodek</div>
			</div>
			<div class="flex flex-col gap-2">
				<div>CONNECT</div>
				<Popover.Root>
					<Popover.Trigger>Contact me</Popover.Trigger>
					<Popover.Content class="flex-col gap-2">
						<div class="flex gap-1">
							<div>Add</div>
							<div class="font-bold">@jodek</div>
							<div>on discord</div>
						</div>
						<a href="https://discord.com/users/Jodek" target="_blank">or click here</a>
					</Popover.Content> 
				</Popover.Root>
				<a href="https://github.com/Jodekq/PlatePilot" target="_blank">Github</a>
			</div>
		</nav>
	</footer>
</div>
