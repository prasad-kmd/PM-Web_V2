"use client";

import { createAuthClient } from "better-auth/react";

/** Same-origin client; the browser never receives the database connection. */
export const authClient = createAuthClient();
