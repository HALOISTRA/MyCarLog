import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ vehicleId: string }>;
}

/**
 * Share settings page — redirects to the vehicle page with the share tab active.
 * The actual share management UI lives inside VehicleTabs (share tab).
 */
export default async function ShareSettingsPage({ params }: Props) {
  const { vehicleId } = await params;
  redirect(`/garage/${vehicleId}?tab=share`);
}
