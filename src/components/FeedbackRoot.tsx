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
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") return null;

  const projectSlug = process.env.NEXT_PUBLIC_FEEDBACK_PROJECT_SLUG;
  if (!projectSlug) return null;

  // Hide on small screens — this is a desktop review tool.
  // 768px matches the standard tablet/desktop breakpoint.
  if (window.innerWidth < 768) return null;

  return <FeedbackLauncher projectSlug={projectSlug} />;
}
