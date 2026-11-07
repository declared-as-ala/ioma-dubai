import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip API routes, static files, and Next internals.
  // eslint-disable-next-line no-useless-escape -- pattern kept exactly as shipped
  matcher: ["/((?!api|_next|_vercel|.*\..*).*)"],
};
