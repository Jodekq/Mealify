<script lang="ts">
  import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select";
  
  let name = '';
  let email = '';
  let message = '';
  
  async function handleSubmit() {
    try {
      const formData = { name, email, message };
      
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert('Data saved successfully!');
        // Reset form
        name = '';
        email = '';
        message = '';
      } else {
        alert('Failed to save data.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('An error occurred while saving data.');
    }
  }

  let ingredients = [];

  function addIngredient() {
    ingredients = [...ingredients, { id: crypto.randomUUID(), amount: '', unit: '', name: '' }];
  }

  function removeIngredient(id) {
    ingredients = ingredients.filter(ingredient => ingredient.id !== id);
  }
</script>

<div class="sm:px-8 mt-4 mx-auto px-2">
  <Card.Root class="mx-auto mb-4">
    <Card.Content class="flex gap-4">
        <form on:submit|preventDefault={handleSubmit} class="space-y-4 w-full flex flex-col">
          <div class="flex gap-4">
            <div class="w-3/4">
              <Label class="pl-1" for="name">Plate Name</Label>
              <Input type="text" id="name" placeholder="name" />
            </div>
            <div class="w-1/4">
              <Label class="pl-1" for="portions">Portions</Label>
              <Input type="number" id="portions" placeholder="portions" />
            </div>
            <div class="w-1/4 self-end flex justify-end">
              <Button>Save</Button>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="w-1/3">
              <Label class="pl-1" for="working_time">Working time</Label>
              <Input type="number" id="working_time" placeholder="in minutes" />
            </div>
            <div class="w-1/3">
              <Label class="pl-1" for="cooking_time">Cooking time</Label>
              <Input type="number" id="cooking_time" placeholder="in minutes" />
            </div>
            <div class="w-1/3">
              <Label class="pl-1" for="rest_time">Rest time</Label>
              <Input type="number" id="rest_time" placeholder="in minutes" />
            </div>
          </div>
          <div class="border p-2 rounded-lg">
            <div class="text-sm font-medium pb-2">Ingredients</div>
            <Button variant="outline" class="conent-center" onclick={addIngredient}><i class='bx bx-plus'></i> Add Ingredient</Button>
            {#each ingredients as ingredient (ingredient.id)}
            <div class="flex gap-2 pt-2">
              <div class="w-1/4">
                <Label class="pl-1" for="amount">Amount</Label>
                <Input type="number" id="amount" placeholder="number" />
              </div>
              <div class="sm:w-1/4 w-2/4">
                <Label class="pl-1" for="unit">Unit</Label>
                <Select.Root>
                  <Select.Trigger>
                    <Select.Value placeholder="unit" />
                  </Select.Trigger>
                  <Select.Content class="w-[180px]">
                    <Select.Item value="grams">g (grams)</Select.Item>
                    <Select.Item value="kilograms">kg (kilograms)</Select.Item>
                    <Select.Item value="milliliters">ml (milliliters)</Select.Item>
                    <Select.Item value="liters">l (liters)</Select.Item>
                    <Select.Item value="piece">piece</Select.Item>
                    <Select.Item value="teaspoon">tsp (teaspoon)</Select.Item>
                    <Select.Item value="tablespoon">tbsp (tablespoon)</Select.Item>
                    <Select.Item value="cup">cup (cup)</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
              <div class="sm:w-3/4 w-2/4">
                <Label class="pl-1" for="ingredient_name">Name</Label>
                <Input type="text" id="ingredient_name" placeholder="name" />
              </div>
              <Button variant="ghost" class="p-1 self-end" onclick={() => removeIngredient(ingredient.id)}><i class='bx bx-trash'></i></Button>
            </div>
            {/each}
          </div>
        </form>
    </Card.Content>		
  </Card.Root>
</div>
