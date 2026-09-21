import { PassThrough } from "node:stream";

import type { EntryContext, RouterContextProvider } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";

import { completeDocument } from "@/lib/document-shape";

/**
 * How long a document render may take before it is aborted.
 *
 * The framework template ships 5s, chosen for a server streaming to a reader:
 * it bounds how long a slow boundary may hold the connection open *after* the
 * shell has already gone out. This entry waits for the whole tree instead (see
 * `completeDocument`), so the same number now bounds the whole page — and the
 * thing on the other end is `@react-router/dev`'s prerender loop, which gives
 * each request 10s of its own before it gives up. A page that would have
 * finished in 7s must not be killed at 6s by a deadline the prerender was
 * willing to wait past.
 *
 * So: abort at 8s + 1s = 9s, just inside the prerender's 10s. Both ceilings end
 * the build; ours ends it with the render error in `onError` and a 500 the
 * prerender reports as `Prerender: Request failed for <path>: 500`, rather than
 * with a socket timeout that names nothing. The prerender's 10s is not
 * configurable from `react-router.config.ts` — the plugin reads only
 * `buildDirectory` and `concurrency` from it — so it is a fixed ceiling to sit
 * under, not a number to raise in step with this one.
 *
 * The whole 176-page prerender runs in about 17s today, so no page is near
 * either limit. The number decides what a page that *cannot* render completely
 * does, and the answer has to be "fail the build", never "ship the skeleton".
 */
export const streamTimeout = 8_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  // https://httpwg.org/specs/rfc9110.html#HEAD
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    // Abort the render after `streamTimeout` so a boundary that never resolves
    // fails the page instead of hanging the build. `onError` runs for each
    // aborted boundary and sets the status to 500, so the prerender rejects the
    // page rather than writing a half-rendered one. Cleared by whichever of the
    // ready callback / `onShellError` gets there first — the render is over by
    // then, so there is no later work to keep the timer alive for.
    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    );

    // Every document this entry renders is a file, not a response. `ssr: false`
    // in `react-router.config.ts` means React Router will not render a document
    // for a path that is not in `prerender()` — anything else is handed the SPA
    // shell — so what reaches here is what `react-router build` is about to
    // write into `build/client/**/index.html` for GitHub Pages to serve as a
    // static file. The only connection it streams to is the prerender loop's
    // own request, which reads the body to the end before writing the file.
    //
    // So there is no reader to stream to and no crawler test to make (the
    // template's `isbot` branch), and both halves of `completeDocument` apply
    // unconditionally: wait for the whole tree, and write each resolved
    // boundary where its fallback would have been rather than outlining the
    // large ones to the end of the document. Its comment is the long form.
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        progressiveChunkSize: completeDocument.progressiveChunkSize,
        [completeDocument.readyOption]() {
          clearTimeout(timeoutId);

          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error: unknown) {
          clearTimeout(timeoutId);
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Logged unconditionally, unlike the template, which logs only after
          // the shell has gone out on the grounds that a shell error rejects
          // and is logged by `handleDocumentRequest` instead. Nothing goes out
          // before the ready callback here, so that test is always false and
          // the branch would swallow every boundary error in the build. A
          // shell error printed twice is a much smaller problem than a
          // prerender that fails with a 500 and no cause.
          console.error(error);
        },
      },
    );
  });
}
