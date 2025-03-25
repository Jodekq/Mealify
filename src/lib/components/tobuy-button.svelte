<!-- src/lib/components/add-to-tobuy-button.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";

  export let ingredientName: string;
  export let amount: number;
  export let unit: string;
  export let compact = false;

  let defaultListId: string | null = null;
  let isLoading = false;
  let isAddingItem = false;

  onMount(async () => {
    await fetchDefaultList();
  });

  async function fetchDefaultList() {
    try {
      isLoading = true;
      const response = await fetch('/api/tobuy');
      
      if (!response.ok) {
        throw new Error('Failed to fetch shopping lists');
      }
      
      const data = await response.json();
      const defaultList = data.lists.find(list => list.isDefault);
      
      if (defaultList) {
        defaultListId = defaultList.id;
      } else if (data.lists.length > 0) {
        defaultListId = data.lists[0].id;
      }
    } catch (error) {
      console.error("Error fetching default list:", error);
    } finally {
      isLoading = false;
    }
  }

  async function addToDefaultList() {
    if (!defaultListId) {
      toast.error("No shopping list available");
      return;
    }

    console.log(ingredientName, amount, unit);

    try {
      isAddingItem = true;
      const response = await fetch(`/api/tobuy/${defaultListId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: ingredientName,
          amount,
          unit
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item to list');
      }
      
      toast.success("Added to default ToBuy list", {
        description: `${amount} ${unit} ${ingredientName}`
      });
    } catch (error) {
      console.error("Error adding item to list:", error);
      toast.error("Failed to add item to shopping list");
    } finally {
      isAddingItem = false;
    }
  }
</script>

{#if compact}
  <Button 
    variant="ghost" 
    size="icon"
    class="h-6 w-6 rounded-lg p-0"
    on:click={addToDefaultList}
    disabled={isAddingItem || isLoading || !defaultListId}
    title="Add to shopping list"
  >
    <i class='bx bx-cart-add'></i>
  </Button>
{:else}
  <Button 
    variant="outline" 
    size="sm"
    class="ml-2 px-2 py-1 h-fit"
    on:click={addToDefaultList}
    disabled={isAddingItem || isLoading || !defaultListId}
  >
    <i class='bx bx-cart-add mr-1'></i>
    Add to ToBuy
  </Button>
{/if}