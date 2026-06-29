"use client";

import { useEffect } from "react";
import { recordView } from "./RecentlyViewed";

export default function RecordView({
  slug, title, image, price,
}: {
  slug: string; title: string; image: string | null; price: number;
}) {
  useEffect(() => {
    recordView({ slug, title, image, price });
  }, [slug, title, image, price]);

  return null;
}
