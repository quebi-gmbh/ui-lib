import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { installStaleDeployRecovery } from "@/lib/stale-deploy";

// Before hydration, because a route module is a dynamic import too: on a site
// whose every file is cached for ten minutes and whose every deploy replaces
// every hash, a document can outlive the chunks it names. See the module.
installStaleDeployRecovery();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
