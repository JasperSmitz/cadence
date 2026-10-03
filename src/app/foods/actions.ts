"use server";
import { revalidatePath } from "next/cache";
import { getDatabase } from "@/db/client";
import { deleteFood, saveFood } from "@/features/foods/persistence";

export async function saveFoodAction(form: FormData) {
  try {
    const result = saveFood(
      getDatabase(),
      Object.fromEntries(form.entries()),
      form.has("id") ? form.get("id") : undefined,
    );
    if (result.ok) revalidatePath("/foods");
    return result;
  } catch (error) {
    console.error("Food save failed", error);
    return {
      ok: false as const,
      message: "Could not save. Your values are still here; please try again.",
    };
  }
}
export async function deleteFoodAction(id: unknown) {
  try {
    const result = deleteFood(getDatabase(), id);
    if (result.ok) revalidatePath("/foods");
    return result;
  } catch (error) {
    console.error("Food delete failed", error);
    return {
      ok: false as const,
      message: "Could not delete. Please try again.",
    };
  }
}
