<!-- src/routes/my-shares/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { toast } from "svelte-sonner";
  import { Toaster } from "$lib/components/ui/sonner";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

  type SharedMeal = {
    id: string;
    shareCode: string;
    createdAt: string;
    expiresAt: string | null;
    views: number;
    meal: {
      id: string;
      name: string;
      totalTime: number;
    };
  };

  let sharedMeals: SharedMeal[] = [];
  let isLoading = true;
  let mealToDelete: SharedMeal | null = null;
  let isDeleting = false;

  onMount(async () => {
    try {
      const response = await fetch('/api/shares');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      sharedMeals = data.shares || [];
      isLoading = false;
    } catch (error) {
      console.error("Error fetching shared meals:", error);
      isLoading = false;
    }
  });

  async function copyShareLink(shareCode: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    const shareLink = `${window.location.origin}/shared/${shareCode}`;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy share link");
      console.error("Error copying to clipboard:", error);
    }
  }

  async function deleteShare() {
    if (!mealToDelete) return;
    
    isDeleting = true;
    
    try {
      const response = await fetch(`/api/shares/${mealToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete share');
      }
      
      sharedMeals = sharedMeals.filter(share => share.id !== mealToDelete.id);
      
      toast.success("Share link copied to clipboard!", {
        description: "You can now share this with your friends."
      });
      mealToDelete = null;
    } catch (error) {
      console.error("Error deleting shared meal:", error);
      toast.error("Failed to delete share link");
    } finally {
      isDeleting = false;
    }
  }

  function confirmDelete(share: SharedMeal) {
    mealToDelete = share;
  }
</script>

<Toaster />

<AlertDialog.Root open={!!mealToDelete}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete Share Link</AlertDialog.Title>
      <AlertDialog.Description>
        Are you sure you want to delete this share link? This will permanently remove access for anyone who has this link.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={deleteShare} disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>

<div class="container mt-4 mx-auto">
  <div class="text-2xl font-bold mb-4 text-center">My Shared Plates</div>
  
  {#if isLoading}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card.Root>
        <Card.Header>
          <Skeleton class="h-6 w-40 rounded-lg" />
          <Skeleton class="h-4 w-32 rounded-lg" />
        </Card.Header>
        <Card.Content>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between">
              <Skeleton class="h-4 w-36 rounded-lg" />
            </div>
            <Skeleton class="h-10 w-full rounded-lg" />
            <Skeleton class="h-10 w-full rounded-lg" />
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {:else if sharedMeals.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each sharedMeals as share}
        <Card.Root>
          <Card.Header>
            <Card.Title>{share.meal.name}</Card.Title>
            <Card.Description>
              Shared on {new Date(share.createdAt).toLocaleDateString()}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="flex flex-col gap-2">
              <div class="flex justify-between">
                <span>Expires: {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : 'Never'}</span>
              </div>
              <Button onclick={(e) => copyShareLink(share.shareCode, e)} variant="outline" class="w-full">
                <i class='bx bx-copy mr-2'></i> Copy Share Link
              </Button>
              <div class="grid grid-cols-2 gap-2">
                <a href={`/shared/${share.shareCode}`} target="_blank" class="w-full">
                  <Button variant="ghost" class="w-full">
                    <i class='bx bx-link-external mr-2'></i> View
                  </Button>
                </a>
                <Button variant="destructive" onclick={() => confirmDelete(share)} class="w-full">
                  <i class='bx bx-trash mr-2'></i> Delete
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center py-20">
      <div class="text-xl font-bold mb-4">No Shared Meals Yet</div>
      <p class="text-muted-foreground mb-6">You haven't shared any meals yet. Go to a meal and click the share button to create a shareable link.</p>
      <Button href="/saved_plates">Browse your saved plates</Button>
    </div>
  {/if}
</div>