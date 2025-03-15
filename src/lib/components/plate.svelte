<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
</script>

<Card.Root class="mx-auto">
  <Card.Header>
    <div class="flex justify-between">
      <div class="flex flex-row gap-4">
        <Card.Title class="content-center">Gericht Name</Card.Title>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="rounded-lg border px-2 content-center">Time</DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Group>
              <DropdownMenu.GroupHeading>Total time:</DropdownMenu.GroupHeading>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>Working time</DropdownMenu.Item>
              <DropdownMenu.Item>Cooking / Baking time</DropdownMenu.Item>
              <DropdownMenu.Item>Rest time</DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
      <div class="rounded-lg border px-2 content-center">Current Day</div>
      <Button variant="outline">Switch</Button>
    </div>
  </Card.Header>
  <Card.Content class="flex flex-row gap-4">
    <div>
      <div class="flex flex-col gap-6">
        <div>N Portionen</div>
        <div>Zutaten</div>
        <div class="flex flex-col gap-2">
          <div>a kg Zutat</div>
          <div>a kg Zutat</div>
          <div>a kg Zutat</div>
        </div>
      </div>
    </div>
    <div>

    </div>
    <div>

    </div>
  </Card.Content>
</Card.Root>