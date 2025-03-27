<!-- src/routes/tobuy/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Input } from "$lib/components/ui/input";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import type { tobuyItem, tobuyList } from "$lib/types";
  import { Badge } from "$lib/components/ui/badge/index.js";

  let lists: tobuyList[] = [];
  let isLoading = true;
  let newListName = "";
  let isCreatingList = false;
  let activeListId: string | null = null;
  
  let listInputs: Record<string, {
    name: string;
    amount: number | null;
    unit: string | null;
  }> = {};

  onMount(async () => {
    await fetchLists();
  });

  async function fetchLists() {
    try {
      isLoading = true;
      const response = await fetch('/api/tobuy');
      
      if (!response.ok) {
        throw new Error('Failed to fetch shopping lists');
      }
      
      const data = await response.json();
      lists = data.lists;
      
      lists.forEach(list => {
        if (!listInputs[list.id]) {
          listInputs[list.id] = {
            name: '',
            amount: null,
            unit: null
          };
        }
      });
      
      const defaultList = lists.find(list => list.isDefault);
      if (defaultList) {
        activeListId = defaultList.id;
      }
      
      lists = lists.map(list => ({
        ...list,
        items: sortItemsByChecked(list.items)
      }));
    } catch (error) {
      console.error("Error fetching lists:", error);
      toast.error("Failed to load shopping lists");
    } finally {
      isLoading = false;
    }
  }

  function sortItemsByChecked(items: tobuyItem[]): tobuyItem[] {
    return [...items].sort((a, b) => {
      if (a.checked === b.checked) return 0;
      return a.checked ? 1 : -1;
    });
  }

  async function createList() {
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    try {
      isCreatingList = true;
      const response = await fetch('/api/tobuy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newListName.trim() })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create list');
      }
      
      newListName = "";
      toast.success("List created successfully");
      await fetchLists();
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Failed to create list");
    } finally {
      isCreatingList = false;
    }
  }

  async function deleteList(id: string) {
    try {
      const response = await fetch(`/api/tobuy/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete list');
      }
      
      toast.success("List deleted successfully");
      await fetchLists();
    } catch (error) {
      console.error("Error deleting list:", error);
      toast.error("Failed to delete list");
    }
  }

  async function addItem(listId: string) {
    const input = listInputs[listId];
    if (!input || !input.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      const response = await fetch(`/api/tobuy/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: input.name.trim(),
          amount: input.amount,
          unit: input.unit
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add item');
      }
      
      listInputs[listId] = {
        name: '',
        amount: null,
        unit: null
      };
      
      await fetchLists();
      toast.success("Item added successfully");
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item");
    }
  }

  async function toggleItemChecked(listId: string, itemId: string, currentValue: boolean) {
    console.log(`Toggling item ${itemId} in list ${listId} from ${currentValue} to ${!currentValue}`);
    
    try {
      const response = await fetch(`/api/tobuy/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checked: !currentValue })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        throw new Error('Failed to update item');
      }
      
      lists = lists.map(list => {
        if (list.id === listId) {
          const updatedItems = list.items.map(item => 
            item.id === itemId ? {...item, checked: !currentValue} : item
          );
          return {
            ...list,
            items: sortItemsByChecked(updatedItems)
          };
        }
        return list;
      });
      
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
      await fetchLists();
    }
  }

  async function deleteItem(listId: string, itemId: string) {
    try {
      const response = await fetch(`/api/tobuy/${listId}/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      lists = lists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.filter(item => item.id !== itemId)
          };
        }
        return list;
      });
      
      toast.success("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
      await fetchLists();
    }
  }

  async function clearCompletedItems(listId: string) {
    try {
      const response = await fetch(`/api/tobuy/${listId}/clear`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear completed items');
      }
      
      lists = lists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.filter(item => !item.checked)
          };
        }
        return list;
      });
      
      toast.success("Completed items cleared successfully");
    } catch (error) {
      console.error("Error clearing completed items:", error);
      toast.error("Failed to clear completed items");
      await fetchLists();
    }
  }

  function selectUnit(listId: string, selectedUnit) {
    if (listInputs[listId]) {
      listInputs[listId].unit = selectedUnit.value || selectedUnit;
    }
  }
  
  function setActiveList(listId: string) {
    activeListId = listId;
  }
</script>

<Toaster />

<div class="mt-4 mx-auto px-2 sm:container">
  <div class="flex flex-col gap-4 items-center mb-6">
    <div class="text-xl font-bold">My ToBuy Lists</div>
    <div class="flex items-center gap-2 w-full">
      <Input 
        type="text" 
        placeholder="New list name" 
        bind:value={newListName} 
        class="w-3/4"
      />
      <Button 
        variant="default" 
        disabled={isCreatingList} 
        on:click={createList}
        class="w-1/4"
      >
        <i class='bx bx-plus mr-1'></i> New List
      </Button>
    </div>
  </div>

  {#if isLoading}
    <div class="space-y-6">
      <Skeleton class="h-[300px] w-full rounded-lg" />
      <Skeleton class="h-[300px] w-full rounded-lg" />
    </div>
  {:else if lists.length === 0}
    <Card.Root class="flex flex-col items-center justify-center p-6">
      <p class="text-lg mb-4">You don't have any tobuy lists yet</p>
      <p class="text-muted-foreground mb-4">Create a new list to get started</p>
    </Card.Root>
  {:else}
    <div class="space-y-8">
      {#each lists as list}
        <Card.Root>
          <Card.Header class="flex flex-row items-center justify-between sm:p-6 p-2 sm:pb-0">
            <div>
              <Card.Title class="text-xl flex items-center gap-2">
                {list.name}
                {#if list.isDefault}
                  <Badge variant="secondary">Default list</Badge>
                {/if}
              </Card.Title>
              <Card.Description>
                {list.items.filter(i => !i.checked).length} remaining,
                {list.items.filter(i => i.checked).length} completed
              </Card.Description>
            </div>
            
            <div class="flex gap-2">
              <Button 
                class="flex gap-2"
                variant="outline" 
                size="sm" 
                on:click={() => clearCompletedItems(list.id)}
                disabled={!list.items.some(item => item.checked)}
              >
                <i class='bx bx-check-double'></i>
                <div class="sm:block hidden">Clear Completed</div>
              </Button>
              
              {#if !list.isDefault}
                <AlertDialog.Root>
                  <AlertDialog.Trigger>
                    <Button variant="outline" size="sm" class="text-destructive hover:bg-destructive/10">
                      <i class='bx bx-trash mr-1'></i> Delete List
                    </Button>
                  </AlertDialog.Trigger>
                  <AlertDialog.Content>
                    <AlertDialog.Header>
                      <AlertDialog.Title>Delete list?</AlertDialog.Title>
                      <AlertDialog.Description>
                        Are you sure you want to delete "{list.name}"? This action cannot be undone.
                      </AlertDialog.Description>
                    </AlertDialog.Header>
                    <AlertDialog.Footer>
                      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                      <AlertDialog.Action 
                        class={buttonVariants({ variant: "destructive" })}
                        on:click={() => deleteList(list.id)}
                      >
                        Delete
                      </AlertDialog.Action>
                    </AlertDialog.Footer>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              {/if}
            </div>
          </Card.Header>
          
          <Card.Content class="sm:p-6 p-2">
            <div class="mb-2 p-2 border rounded-md bg-muted/40" class:border-accent={activeListId === list.id}>
              <div class="flex gap-2">
                <div class="w-full">
                  <Label for={`item-name-${list.id}`} class="pl-1">Item</Label>
                  <Input 
                    id={`item-name-${list.id}`}
                    type="text" 
                    placeholder="Item name" 
                    bind:value={listInputs[list.id].name} 
                    on:focus={() => setActiveList(list.id)}
                  />
                </div>
                <!-- <div class="w-1/5">
                  <Label for={`item-amount-${list.id}`}>Amount</Label>
                  <Input 
                    class="pl-1"
                    id={`item-amount-${list.id}`}
                    type="number" 
                    placeholder=" amount" 
                    bind:value={listInputs[list.id].amount} 
                    on:focus={() => setActiveList(list.id)}
                  />
                </div>
                <div class="w-1/5">
                  <Label for={`item-unit-${list.id}`}>Unit</Label>
                  <Select.Root onSelectedChange={(selected) => selectUnit(list.id, selected)}>
                    <Select.Trigger class="w-full" id={`item-unit-${list.id}`} onfocus={() => setActiveList(list.id)}>
                      {listInputs[list.id].unit || 'Select'}
                    </Select.Trigger>
                    <Select.Content>
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
                </div> -->
                <div class="flex items-end">
                  <Button 
                    variant="default" 
                    disabled={!listInputs[list.id].name?.trim() || activeListId !== list.id} 
                    on:click={() => addItem(list.id)}
                    class="h-10 flex gap-2"
                  >
                    <i class='bx bx-plus'></i>
                    <div class="sm:block hidden">Add</div>
                  </Button>
                </div>
              </div>
            </div>
      
            <!-- Shopping items list -->
            {#if list.items.length === 0}
              <div class="p-6 text-center text-muted-foreground">
                This list is empty. Add some items to get started.
              </div>
            {:else}
              <div class="space-y-2">
                {#each list.items as item}
                  <div class="flex items-center justify-between p-3 rounded-md border {item.checked ? 'bg-muted opacity-70' : ''}">
                    <div class="flex items-center gap-3">
                      <!-- Use on:click instead of onclick to properly handle the event -->
                      <button
                        type="button"
                        class="flex h-4 w-4 items-center justify-center rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        data-state={item.checked ? 'checked' : 'unchecked'}
                        on:click|stopPropagation={() => toggleItemChecked(list.id, item.id, item.checked)}
                      >
                        {#if item.checked}
                          <i class='bx bx-check text-xs'></i>
                        {/if}
                      </button>
                      <span class={item.checked ? 'line-through text-muted-foreground' : ''}>
                        {item.name}
                        {#if item.amount}
                          <span class="ml-1 text-sm text-gray-500">
                            {item.amount} {item.unit || ''}
                          </span>
                        {/if}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      class="hover:bg-secondary"
                      on:click={() => deleteItem(list.id, item.id)}
                    >
                      <i class='bx bx-trash'></i>
                    </Button>
                  </div>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>