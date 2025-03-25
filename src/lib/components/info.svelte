<script>
  import { Progress } from "$lib/components/ui/progress";

  let upcomingFeatures = [
    { title: "Meal Sharing", description: "Easily share your meals with friends", progress: 100 },
    { title: "ToBuy List", description: "Keep track of what you need to buy", progress: 100 },
    { title: "Families", description: "Organize meals for your family", progress: 5 },
    { title: "Routines", description: "Schedule anything for specific days of the week", progress: 20 },
    { title: "Export / Share Calendar", description: "Share your clandar with others or import it into your own calendar", progress: 0 },
    { title: "Import meals", description: "Import meals from other sources", progress: 5 },
    { title: "Search saved plates", description: "Search for specific saved plates", progress: 10 },
  ];
</script>

<div class="rounded-lg p-6 mt-8 flex flex-col items-center">
  <div class="text-2xl font-semibold mb-4">Upcoming Features</div>
  <div class="flex flex-col items-center">
    {#each upcomingFeatures as feature}
      <div class="mb-4 items-center flex flex-col">
        <div class="text-xl font-semibold">{feature.title}</div>
        <p class="text-gray-500 items-center">{feature.description}</p>
        <Progress value={feature.progress} class="w-[200px]" />
      </div>
    {/each}
  </div>
  <!-- <p class="text-sm text-gray-500 mt-4">Stay tuned for more updates!</p> -->
</div>