<script>
  import * as Card from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";
  import { Separator } from "$lib/components/ui/separator";

  // Current features
  const currentFeatures = [
    { 
      title: "Meal Creation", 
      description: "Create detailed recipes with steps, ingredients, and cooking times",
      icon: "bx-food-menu"
    },
    { 
      title: "Meal Planning", 
      description: "Schedule meals on your calendar",
      icon: "bx-calendar"
    },
    { 
      title: "Meal Sharing", 
      description: "Easily share your meals with friends",
      icon: "bx-share"
    },
    { 
      title: "ToBuy List", 
      description: "Keep track of what you need to buy",
      icon: "bx-cart"
    },
  ];

  // Upcoming features
  const upcomingFeatures = [
    { 
      title: "Nutrition Info", 
      description: "Add info about vitamins, minerals, and other nutrition facts to your meals",
      progress: 15,
      icon: "bx-spa"
    },
    { 
      title: "Families", 
      description: "Organize meals for your family",
      progress: 5,
      icon: "bx-group"
    },
    { 
      title: "Routines", 
      description: "Schedule meals or anything else for specific days of the week",
      progress: 20,
      icon: "bx-repeat"
    },
    { 
      title: "Import Recipes", 
      description: "Import meals from other sources or websites",
      progress: 5,
      icon: "bx-import"
    },
    { 
      title: "Categories", 
      description: "Organize meals by categories (breakfast, lunch, dinner, etc.)",
      progress: 25,
      icon: "bx-category"
    },
    { 
      title: "Search", 
      description: "Search for specific saved plates",
      progress: 35,
      icon: "bx-search"
    },
  ];

</script>

<div class="mt-16 mb-8">
  <div class="text-3xl font-bold text-center mb-8">Mealify Features</div>
  <Card.Root class="mb-8">
    <Card.Header>
      <Card.Title class="text-2xl flex items-center">
        <i class="bx bx-check-circle text-primary mr-2"></i>
        Available Features
      </Card.Title>
      <Card.Description>
        Features that are currently available in Mealify
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each currentFeatures as feature}
          <div class="border rounded-lg p-4 h-full flex flex-col">
            <div class="flex items-center mb-2">
              <i class="bx {feature.icon} text-2xl text-primary mr-2"></i>
              <h3 class="font-semibold">{feature.title}</h3>
            </div>
            <p class="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-2xl flex items-center">
        <i class="bx bx-time text-primary mr-2"></i>
        Upcoming Features
      </Card.Title>
      <Card.Description>
        Features that are currently in development
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {#each upcomingFeatures as feature}
          <div class="relative border border-dashed rounded-lg p-4 h-full flex flex-col overflow-hidden">
            <div class="absolute inset-0 rounded-lg"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                  <i class="bx {feature.icon} text-2xl text-primary mr-2"></i>
                  <h3 class="font-semibold">{feature.title}</h3>
                </div>
                <span class="text-xs font-medium bg-secondary px-2 py-1 rounded-full">
                  {feature.progress}%
                </span>
              </div>
              <p class="text-sm text-muted-foreground mb-3">{feature.description}</p>
              <Progress value={feature.progress} class="h-1.5" />
            </div>
          </div>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>
</div>