export const PORT = 8099;
export const OFFSET = 8;
const URL_ = `http://localhost:${PORT}/index.html`;

// One table covering three things at once:
//  - the bug: a bottom-anchored overlay under a positioned <html> or <body>
//  - the guard: flipping and clamping, which is driven by the *boundary* measurement
//    and must not move when the *container* measurement is corrected
//  - the mask: with shouldFlip left on, a positioned <body> flips to a top-anchored
//    placement and looks fine, which is why the body case is easy to miss
//
// `scroll: 1100` puts a trigger 400px down the viewport (room above -> stays `top`).
// `scroll: 1450` puts it 50px down (no room above -> flips to `bottom`).
export const CASES = [
  {name: 'static, popover', trigger: '#popover-trigger', target: 'html', position: '', scroll: 1100, expect: 'top'},
  {name: 'static, select', trigger: '#select-trigger', target: 'html', position: '', scroll: 1100, expect: 'top'},
  {name: 'static, menu', trigger: '#menu-trigger', target: 'html', position: '', scroll: 1100, expect: 'top'},

  {name: 'html relative, popover', trigger: '#popover-trigger', target: 'html', position: 'relative', scroll: 1100, expect: 'top'},
  {name: 'html relative, select', trigger: '#select-trigger', target: 'html', position: 'relative', scroll: 1100, expect: 'top'},
  {name: 'html relative, menu', trigger: '#menu-trigger', target: 'html', position: 'relative', scroll: 1100, expect: 'top'},

  {name: 'static, must flip', trigger: '#popover-trigger', target: 'html', position: '', scroll: 1450, expect: 'bottom'},
  {name: 'html relative, must flip', trigger: '#popover-trigger', target: 'html', position: 'relative', scroll: 1450, expect: 'bottom'},

  {name: 'body relative, popover', trigger: '#popover-trigger', target: 'body', position: 'relative', scroll: 1100, expect: 'top'},
  {name: 'body relative, must flip', trigger: '#popover-trigger', target: 'body', position: 'relative', scroll: 1450, expect: 'bottom'},

  {name: 'no-flip, static', trigger: '#noflip-trigger', target: 'html', position: '', scroll: 1100, expect: 'top'},
  {name: 'no-flip, html relative', trigger: '#noflip-trigger', target: 'html', position: 'relative', scroll: 1100, expect: 'top'},
  {name: 'no-flip, body relative', trigger: '#noflip-trigger', target: 'body', position: 'relative', scroll: 1100, expect: 'top'},
];

/** Open each case in a fresh page and record where the overlay actually landed. */
export async function measure(browser) {
  const rows = [];

  for (const c of CASES) {
    const page = await browser.newPage({
      viewport: {width: 1000, height: 800},
      hasTouch: false,
      isMobile: false,
    });
    await page.goto(URL_);

    await page.evaluate(
      ({target, position}) => {
        (target === 'html' ? document.documentElement : document.body).style.position = position;
      },
      {target: c.target, position: c.position},
    );
    // Scroll explicitly, so no auto-scroll-into-view perturbs the geometry.
    await page.evaluate((y) => window.scrollTo(0, y), c.scroll);
    await page.waitForTimeout(50);

    await page.click(c.trigger);
    await page.waitForSelector('.react-aria-Popover', {state: 'attached'});
    await page.waitForTimeout(150);

    const m = await page.evaluate((triggerSel) => {
      const trigger = document.querySelector(triggerSel).getBoundingClientRect();
      const el = document.querySelector('.react-aria-Popover');
      const overlay = el.getBoundingClientRect();
      return {
        placement: el.getAttribute('data-placement'),
        // Whichever side it ended up on, it should sit `offset` px from the trigger.
        gap: Math.round(
          overlay.top >= trigger.bottom ? overlay.top - trigger.bottom : trigger.top - overlay.bottom,
        ),
        emitted: el.style.bottom ? `bottom: ${el.style.bottom}` : `top: ${el.style.top}`,
        overlayY: Math.round(overlay.top + window.scrollY),
        onScreen: overlay.top >= 0 && overlay.bottom <= window.innerHeight,
        overshoot: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      };
    }, c.trigger);

    rows.push({...c, ...m, pass: m.placement === c.expect && m.gap === OFFSET && m.onScreen});
    await page.close();
  }

  return rows;
}
