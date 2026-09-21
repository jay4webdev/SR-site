import TripManager from "./TripManager";
import { getAllTripTypes } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getAllTripTypes();
  return <TripManager trips={trips} />;
}
