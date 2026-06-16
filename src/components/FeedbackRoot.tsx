"use client";

import { useState, useEffect } from "react";
import { FeedbackLauncher } from "./FeedbackLauncher";

/**
 * Drop this into your root layout — it reads the two NEXT_PUBLIC_ env vars
 * and renders nothing when feedback is disabled or the project slug is missing.
 *
 * The mounted check ensures the widget never renders during SSR, avoiding
 * hydration mismatches. Feedback is purely interactive and has no value
 * being server-rendered.
 *
 * <FeedbackRoot /> is the only component the host app needs to add.
 */
export function FeedbackRoot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("[fi-edback] FeedbackRoot mounted");
    console.log(
      "[fi-edback] NEXT_PUBLIC_ENABLE_FEEDBACK:",
      process.env.NEXT_PUBLIC_ENABLE_FEEDBACK,
    );
    console.log(
      "[fi-edback] NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG:",
      process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG,
    );
    setMounted(true);
  }, []);

  if (!mounted) {
    console.log("[fi-edback] Not mounted yet, waiting for client-side render");
    return null;
  }

  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") {
    console.log(
      '[fi-edback] Feedback disabled (NEXT_PUBLIC_ENABLE_FEEDBACK is not "true")',
    );
    return null;
  }

  const projectSlug = process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG;
  if (!projectSlug) {
    console.log(
      "[fi-edback] No project slug configured (NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG missing)",
    );
    return null;
  }

  console.log(
    "[fi-edback] Rendering FeedbackLauncher with projectSlug:",
    projectSlug,
  );
  return <FeedbackLauncher projectSlug={projectSlug} />;
}
