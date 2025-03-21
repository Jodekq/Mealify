<script>
  import { Progress } from "$lib/components/ui/progress";

  let upcomingFeatures = [
    { title: "Meal Sharing", description: "Easily share your meals with friends", progress: 100 },
    { title: "ToBuy List", description: "Keep track of what you need to buy", progress: 30 },
    { title: "Families", description: "Organize meals for your family", progress: 0 },
  ];
</script>

<div class="rounded-lg p-6 mt-8 flex flex-col items-center">
  <div class="text-2xl font-semibold mb-4">Upcoming Features</div>
  <div class="flex flex-col items-center">
    {#each upcomingFeatures as feature}
      <div class="mb-4 text-center">
        <div class="text-xl font-semibold">{feature.title}</div>
        <p class="text-gray-500 items-center">{feature.description}</p>
        <Progress value={feature.progress} />
      </div>
    {/each}
  </div>
  <!-- <p class="text-sm text-gray-500 mt-4">Stay tuned for more updates!</p> -->
</div>