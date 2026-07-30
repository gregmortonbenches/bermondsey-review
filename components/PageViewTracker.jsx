"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordPageView } from "@/lib/analytics";

export default function PageViewTracker({ path }) {
  useEffect(() => {
    recordPageView(createClient(), path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return null;
}
