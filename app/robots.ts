import type { MetadataRoute } from "next";
import { RobotsService } from "@/server/seo/RobotsService";

export default function robots(): MetadataRoute.Robots {
  return RobotsService.build();
}
