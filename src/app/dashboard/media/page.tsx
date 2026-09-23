import { getAllMedia } from "@/lib/media";
import { getButtonDownloadsConfig } from "@/lib/button-downloads";
import MediaManager from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [mediaList, buttonConfig] = await Promise.all([
    getAllMedia(),
    getButtonDownloadsConfig(),
  ]);

  return <MediaManager media={mediaList} buttonDownloads={buttonConfig} />;
}
