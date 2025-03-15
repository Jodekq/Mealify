<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
  import * as Select from "$lib/components/ui/select/index.js";

  import { Textarea } from "$lib/components/ui/textarea/index.js";
</script>

<Card.Root class="mx-auto">
  <Card.Header>
    <div class="flex justify-between">
      <div class="flex flex-row gap-4">
        <Card.Title class="content-center">Gericht Name</Card.Title>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="rounded-lg border px-2 content-center bg-secondary text-sm font-medium ">Time</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Group>
              <DropdownMenu.GroupHeading>Total time</DropdownMenu.GroupHeading>
              <DropdownMenu.Separator />
              <DropdownMenu.GroupHeading>Working time</DropdownMenu.GroupHeading>
              <DropdownMenu.GroupHeading>Cooking time</DropdownMenu.GroupHeading>
              <DropdownMenu.GroupHeading>Rest time</DropdownMenu.GroupHeading>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <div class="rounded-lg border px-2 content-center cursor-pointer bg-secondary text-sm font-medium ">Current Day</div>
      <Button variant="secondary">Switch</Button>
    </div>
  </Card.Header>
  <Card.Content class="flex flex-row gap-4">
    <div>
      <div class="flex flex-col gap-2 rounded-lg border p-2 sticky top-0 w-fit">
        <div class="p-1 flex gap-2">
          <div>
            <label for="portions" class="text-m font-medium">Portions</label>
            <input 
              type="number" 
              id="portions" 
              name="portions" 
              min="1" 
              value="1"
              class="w-full rounded-lg mt-1 bg-secondary px-2 py-2 border text-sm font-medium max-w-14" 
              placeholder="Enter number of portions" />
          </div>
        </div>
        <div class="px-2 font-bold">Ingredients</div>
        <div class="flex flex-col gap-2 px-2">
          <div>a kg Zutat</div>
          <div>a kg Zutat</div>
          <div>a kg Zutat</div>
        </div>
      </div>
    </div>
    <ScrollArea class="h-[300px] w-full">
      <div class="flex flex-col gap-4">
        <div class="flex flex-row gap-4">
          <div class="flex-[1]">
            <div class="flex flex-col border rounded-lg py-2">
              <div class="flex justify-center">1. Schritt</div>
              <div class="flex justify-center">Irgendwas tun</div>
              <div class="flex justify-center">7 min</div>
            </div>
          </div>
          <div class="flex-[2]">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col border rounded-lg py-2">
                <div class="flex px-2">1. Schritt Beschreibung</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-row gap-4">
          <div class="flex-[1]">
            <div class="flex flex-col border rounded-lg py-2">
              <div class="flex justify-center">2. Schritt</div>
              <div class="flex justify-center">Irgendwas tun</div>
              <div class="flex justify-center">7 min</div>
            </div>
          </div>
          <div class="flex-[2]">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col border rounded-lg py-2">
                <div class="flex px-2">2. Schritt Beschreibung</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-row gap-4">
          <div class="flex-[1]">
            <div class="flex flex-col border rounded-lg py-2">
              <div class="flex justify-center">3. Schritt</div>
              <div class="flex justify-center">Irgendwas tun</div>
              <div class="flex justify-center">7 min</div>
            </div>
          </div>
          <div class="flex-[2]">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col border rounded-lg py-2">
                <div class="flex px-2">3. Schritt Beschreibung</div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-row gap-4">
          <div class="flex-[1]">
            <div class="flex flex-col border rounded-lg py-2">
              <div class="flex justify-center">4. Schritt</div>
              <div class="flex justify-center">Irgendwas tun</div>
              <div class="flex justify-center">7 min</div>
            </div>
          </div>
          <div class="flex-[2]">
            <div class="flex flex-col gap-4">
              <div class="flex flex-col border rounded-lg py-2">
                <div class="flex px-2">4. Schritt Beschreibung</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  </Card.Content>
</Card.Root>