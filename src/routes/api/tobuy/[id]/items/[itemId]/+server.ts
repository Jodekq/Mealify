// src/routes/api/tobuy/[id]/items/[itemId]/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prismaClient';

// PATCH: Update a shopping item
export const PATCH = (async ({ params, request, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    // Log all available params
    console.log("All params:", params);
    
    // Get params directly
    const listId = params.id;
    // Check if itemId exists in params
    if (!params.itemId) {
      console.error("itemId parameter is missing");
      return json({ error: "Item ID is required" }, { status: 400 });
    }
    const itemId = params.itemId;
    
    console.log(`PATCH request - User: ${userId}, List: ${listId}, Item: ${itemId}`);

    // First verify that the list exists
    const list = await prisma.toBuyList.findUnique({
      where: {
        id: listId
      }
    });
    

    if (!list) {
      console.error(`List not found: ${listId}`);
      console.log('Request params:', params);
      console.log('Looking for list with ID:', listId);
      console.log('Prisma models available:', Object.keys(prisma));
      return json({ error: "Shopping list not found ioha", params }, { status: 404 });
    }
    
    // Then verify it belongs to the user
    if (list.user_id !== userId) {
      console.error(`List ${listId} does not belong to user ${userId}`);
      return json({ error: "Not authorized to access this list" }, { status: 403 });
    }
    
    const data = await request.json();
    console.log("Request body:", data);
    
    // Verify the item exists in the specified list
    const existingItem = await prisma.toBuyItem.findUnique({
      where: {
        id: itemId
      }
    });

    if (!existingItem) {
      console.error(`Item not found: ${itemId}`);
      return json({ error: "Shopping item not found" }, { status: 404 });
    }
    
    // Make sure the item belongs to the specified list
    if (existingItem.list_id !== listId) {
      console.error(`Item ${itemId} does not belong to list ${listId}`);
      return json({ error: "Item does not belong to this list" }, { status: 400 });
    }

    // Update the item
    const updatedItem = await prisma.toBuyItem.update({
      where: {
        id: itemId
      },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        amount: data.amount !== undefined ? data.amount : undefined,
        unit: data.unit !== undefined ? data.unit : undefined,
        checked: data.checked !== undefined ? data.checked : undefined
      }
    });
    
    console.log(`Successfully updated item ${itemId}`);

    return json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("Error updating shopping item:", error);
    return json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}) satisfies RequestHandler;

// DELETE: Delete a shopping item
export const DELETE = (async ({ params, locals }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get params directly
    const listId = params.id;
    const itemId = params.itemId;
    
    console.log(`DELETE request - User: ${userId}, List: ${listId}, Item: ${itemId}`);

    // First verify that the list exists
    const list = await prisma.toBuyList.findUnique({
      where: {
        id: listId
      }
    });

    if (!list) {
      console.error(`List not found: ${listId}`);
      return json({ error: "Shopping list not found" }, { status: 404 });
    }
    
    // Then verify it belongs to the user
    if (list.user_id !== userId) {
      console.error(`List ${listId} does not belong to user ${userId}`);
      return json({ error: "Not authorized to access this list" }, { status: 403 });
    }
    
    // Verify the item exists
    const existingItem = await prisma.toBuyItem.findUnique({
      where: {
        id: itemId
      }
    });

    if (!existingItem) {
      console.error(`Item not found: ${itemId}`);
      return json({ error: "Shopping item not found" }, { status: 404 });
    }
    
    // Make sure the item belongs to the specified list
    if (existingItem.list_id !== listId) {
      console.error(`Item ${itemId} does not belong to list ${listId}`);
      return json({ error: "Item does not belong to this list" }, { status: 400 });
    }

    // Delete the item
    await prisma.toBuyItem.delete({
      where: {
        id: itemId
      }
    });
    
    console.log(`Successfully deleted item ${itemId}`);

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}) satisfies RequestHandler;