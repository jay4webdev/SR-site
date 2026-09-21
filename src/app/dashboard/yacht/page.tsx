import { notFound } from "next/navigation";
import YachtForm from "./YachtForm";
import { getYacht } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function YachtPage() {
  const yacht = await getYacht("finch-65");
  if (!yacht) notFound();
  return <YachtForm yacht={yacht} />;
}
