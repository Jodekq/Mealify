<!-- src/routes/add_plate/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { toast } from "svelte-sonner";
  
  let name = '';
  let portions = 1;
  let workingTime = 0;
  let cookingTime = 0;
  let restTime = 0;
  let isSubmitting = false;
  let errorMessage = '';
  let successMessage = '';
  
  async function handleSubmit() {
    try {
      isSubmitting = true;
      
      if (!name) {
        toast.error('Please enter a meal name');
        isSubmitting = false;
        return;
      }
      
      const formData = {
        name,
        portions,
        workingTime,
        cookingTime,
        restTime,
        ingredients: ingredients.map(ing => ({
          name: ing.name,
          unit: ing.unit,
          amount: ing.amount
        })),
        steps: steps.map(step => ({
          number: step.number,
          text: step.text,
          extra_text: step.extra_text,
          description: step.description
        }))
      };
      
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Meal saved successfully');
        window.location.href = "/saved_plates";
      } else {
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      toast.error('An error occurred while saving the meal');
    } finally {
      isSubmitting = false;
    }
  }

  let ingredients = [];

  function addIngredient() {
    ingredients = [...ingredients, { id: crypto.randomUUID(), amount: '', unit: '', name: '' }];
  }

  function removeIngredient(id) {
    ingredients = ingredients.filter(ingredient => ingredient.id !== id);
  }

  function selectUnit(ingredientId, selectedUnit) {
    ingredients = ingredients.map(ingredient => 
      ingredient.id === ingredientId 
        ? { ...ingredient, unit: selectedUnit.value || selectedUnit } 
        : ingredient
    );
  }

  let steps = [];

  function addStep() {
    steps = [...steps, { id: crypto.randomUUID(), number: steps.length + 1, text: '', extra_text: '', description: '' }];
  }

  function removeStep(id) {
    steps = steps.filter(step => step.id !== id).map((step, index) => ({
      ...step,
      number: index + 1
    }));
  }
</script>

<div class="mt-4 mx-auto px-2 sm:container">
  <div class="text-2xl font-bold mb-4 text-center">Add Plate</div>
  <Card.Root class="mx-auto mb-4">
    <Card.Content class="flex gap-4">
      <form on:submit|preventDefault={handleSubmit} class="space-y-4 w-full flex flex-col">
        <div class="flex gap-4">
          <div class="w-3/4">
            <Label class="pl-1" for="name">Plate Name</Label>
            <Input type="text" id="name" bind:value={name} placeholder="name" />
          </div>
          <div class="w-1/4">
            <Label class="pl-1" for="portions">Portions</Label>
            <Input type="number" id="portions" bind:value={portions} placeholder="portions" />
          </div>
          <div class="w-1/4 self-end flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="w-1/3">
            <Label class="pl-1" for="working_time">Working time</Label>
            <Input type="number" id="working_time" bind:value={workingTime} placeholder="in minutes" />
          </div>
          <div class="w-1/3">
            <Label class="pl-1" for="cooking_time">Cooking time</Label>
            <Input type="number" id="cooking_time" bind:value={cookingTime} placeholder="in minutes" />
          </div>
          <div class="w-1/3">
            <Label class="pl-1" for="rest_time">Rest time</Label>
            <Input type="number" id="rest_time" bind:value={restTime} placeholder="in minutes" />
          </div>
        </div>
        <div class="border p-2 rounded-lg">
          <div class="text-lg font-medium pb-2">Ingredients</div>
          <Button variant="outline" class="content-center mb-4" type="button" onclick={addIngredient}><i class='bx bx-plus'></i> Add Ingredient</Button>
          {#each ingredients as ingredient (ingredient.id)}
          <div class="flex gap-2">
            <div class="sm:w-3/4 w-2/4">
              <Label class="pl-1" for={`ingredient_name-${ingredient.id}`}>Name</Label>
              <Input type="text" id={`ingredient_name-${ingredient.id}`} bind:value={ingredient.name} placeholder="name" />
            </div>
            <div class="w-1/4">
              <Label class="pl-1" for={`amount-${ingredient.id}`}>Amount</Label>
              <Input type="number" id={`amount-${ingredient.id}`} bind:value={ingredient.amount} placeholder="number" />
            </div>
            <div class="sm:w-1/4 w-2/4">
              <Label class="pl-1" for={`unit-${ingredient.id}`}>Unit</Label>
              <Select.Root onSelectedChange={(selected) => selectUnit(ingredient.id, selected)}>
                <Select.Trigger>
                  {ingredient.unit || 'Select unit'}
                </Select.Trigger>
                <Select.Content class="w-[180px]">
                  <Select.Item value="gram">g (gram)</Select.Item>
                  <Select.Item value="kilogram">kg (kilogram)</Select.Item>
                  <Select.Item value="milliliter">ml (milliliter)</Select.Item>
                  <Select.Item value="liter">l (liter)</Select.Item>
                  <Select.Item value="piece">piece</Select.Item>
                  <Select.Item value="teaspoon">tsp (teaspoon)</Select.Item>
                  <Select.Item value="tablespoon">tbsp (tablespoon)</Select.Item>
                  <Select.Item value="cup">cup (cup)</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
            <Button variant="ghost" class="p-1 self-end" type="button" onclick={() => removeIngredient(ingredient.id)}><i class='bx bx-trash'></i></Button>
          </div>
          {/each}
        </div>
        <div class="border rounded-lg p-2">
          <div class="text-lg font-medium pb-2">Description</div>
          <Button variant="outline" class="content-center mb-4" type="button" onclick={addStep}><i class='bx bx-plus'></i> Add Step</Button>
            {#each steps as step (step.id)}
              <div class="shadow-md space-y-2 flex flex-col sm:flex-row gap-4 mb-2">
                <div class="sm:w-1/3 w-full flex flex-col gap-2">
                  <div class="text-m font-medium pl-1">Step {step.number}</div>
                  <div>
                    <Label class="pl-1" for={`step_text-${step.id}`}>Step Text</Label>
                    <Input type="text" id={`step_text-${step.id}`} bind:value={step.text} placeholder="short description" />
                  </div>
                  <div>
                    <Label class="pl-1" for={`extra_text-${step.id}`}>Extra Text</Label>
                    <Input type="text" id={`extra_text-${step.id}`} bind:value={step.extra_text} placeholder="working time or °C" />
                  </div>
                </div>
                <div class="sm:w-2/3 w-full">
                  <Label for={`description-${step.id}`} class="pl-1">Step {step.number} description</Label>
                  <Textarea placeholder="Longer description" bind:value={step.description} id={`description-${step.id}`} />
                </div>
                <Button variant="ghost" class="p-1 w-full sm:w-fit self-center" type="button" onclick={() => removeStep(step.id)}><i class='bx bx-trash'></i></Button>
              </div>
            {/each}        
        </div>
      </form>
    </Card.Content>		
  </Card.Root>
</div>