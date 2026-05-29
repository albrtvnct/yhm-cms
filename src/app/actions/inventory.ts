"use server";

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function getInventoryData() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    const items = await prisma.inventoryItem.findMany({
      where: { churchId: session.churchId },
      orderBy: { createdAt: 'desc' }
    });

    const totalCount = items.length;
    const totalPrice = items.reduce((acc, curr) => acc + curr.price, 0);

    // Group by division for Graph
    const divisionMap: Record<string, number> = {};
    const divisionPriceMap: Record<string, number> = {};
    
    items.forEach(item => {
      if (!divisionMap[item.division]) {
        divisionMap[item.division] = 0;
        divisionPriceMap[item.division] = 0;
      }
      divisionMap[item.division] += 1;
      divisionPriceMap[item.division] += item.price;
    });

    const divisions = Object.keys(divisionMap).map(div => ({
      name: div,
      count: divisionMap[div],
      totalPrice: divisionPriceMap[div],
      percent: totalCount > 0 ? Math.round((divisionMap[div] / totalCount) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        totalCount,
        totalPrice,
        divisions,
        items
      }
    };
  } catch (err: any) {
    console.error("Error fetching inventory data:", err);
    return { success: false, error: err.message };
  }
}

export async function addInventoryItem(data: any) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    await prisma.inventoryItem.create({
      data: {
        name: data.name,
        code: data.code,
        price: parseFloat(data.price),
        condition: data.condition,
        division: data.division,
        notes: data.notes || "",
        churchId: session.churchId
      }
    });

    revalidatePath('/dashboard/inventaris');
    return { success: true };
  } catch (err: any) {
    console.error("Error adding inventory item:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };

    // Verify ownership
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item || item.churchId !== session.churchId) {
      return { success: false, error: "Not found or unauthorized" };
    }

    await prisma.inventoryItem.delete({
      where: { id }
    });

    revalidatePath('/dashboard/inventaris');
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting inventory item:", err);
    return { success: false, error: err.message };
  }
}
