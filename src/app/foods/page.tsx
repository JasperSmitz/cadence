import { getDatabase } from "@/db/client";
import { listFoods } from "@/features/foods/persistence";
import { FoodsWorkspace } from "@/features/foods/workspace";
export const metadata = { title: "Foods" };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const foods = listFoods(getDatabase(), search);
  return <FoodsWorkspace foods={foods} search={search} />;
}
