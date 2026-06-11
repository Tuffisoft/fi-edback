import * as react from 'react';

/**
 * Drop this into your root layout — it reads the two NEXT_PUBLIC_ env vars
 * and renders nothing when feedback is disabled or the project slug is missing.
 *
 * <FeedbackRoot /> is the only component the host app needs to add.
 */
declare function FeedbackRoot(): react.JSX.Element | null;

export { FeedbackRoot };
