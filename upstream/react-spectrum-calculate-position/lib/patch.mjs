import {copyFile, readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';

// The candidate fix, applied to the installed package rather than to a fork, so that
// "stock" and "patched" are the same released build of react-aria differing in exactly
// these lines. `npm run verify-fix` applies it, measures, and puts it back.
const FILE = new URL(
  '../node_modules/react-aria/dist/private/overlays/calculatePosition.mjs',
  import.meta.url,
).pathname;
const PRISTINE = `${FILE}.orig`;

const ANCHOR = `    } else {
        ({ width: width, height: height, top: top, left: left } = $954926fb6168ae2a$var$getOffset(containerNode, false));`;

// Only the size fields are overridden. `scroll`, `top` and `left` stay on the document
// path, and the `else` branch is left alone -- widening the branch itself would also
// change the *boundary* measurement, which wants viewport semantics, and overlays would
// stop flipping. See the README.
const PATCH = `        // FIX: \`body\`/\`html\` is only the initial containing block while it is static.
        // Once it is positioned, absolutely positioned children resolve against its own
        // box, so report that box's size rather than the viewport's.
        if (window.getComputedStyle(containerNode).position !== 'static') {
            let box = $954926fb6168ae2a$var$getOffset(containerNode, false);
            width = box.width;
            height = box.height;
            totalWidth = box.width;
            totalHeight = box.height;
        }
    } else {
        ({ width: width, height: height, top: top, left: left } = $954926fb6168ae2a$var$getOffset(containerNode, false));`;

async function pristine() {
  if (!existsSync(PRISTINE)) await copyFile(FILE, PRISTINE);
  return readFile(PRISTINE, 'utf8');
}

export async function applyPatch() {
  const stock = await pristine();
  if (!stock.includes(ANCHOR)) {
    throw new Error(
      'anchor not found in calculatePosition.mjs -- react-aria internals changed, ' +
        're-derive the patch against the installed version',
    );
  }
  await writeFile(FILE, stock.replace(ANCHOR, PATCH));
}

export async function revertPatch() {
  await pristine();
  await copyFile(PRISTINE, FILE);
}
