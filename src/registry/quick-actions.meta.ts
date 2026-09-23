import type { ComponentMeta } from "./types"

export const quickActionsMeta: ComponentMeta = {
  slug: "quick-actions",
  name: "Quick Actions",
  description:
    "Everything you can do from here, in one place: a trigger — a header Button or a floating round button in the bottom-right corner — opens a panel listing this screen's actions, grouped, and picking one runs it and closes the panel. The panel is a Drawer that comes up from the bottom on a narrow viewport and in from the right on a wide one, and the list is a react-aria Menu built from the library's menu items, with icons, descriptions, shortcut hints, danger intent and link actions. No search field: that is what tells it apart from Command Menu.",
  category: "Overlays",
  tags: ["overlay", "actions", "menu", "fab", "floating", "sheet", "drawer", "mobile", "touch"],
  usage: {
    when: [
      "The handful of things that matter on this screen, collected behind one button so the page does not need a toolbar of them.",
      "A mobile layout whose header has no room for actions — `QuickActionsFab` sits in the thumb's corner.",
      "Pointer and touch users who want to see what is possible rather than type what they want.",
    ],
    whenNot: [
      "A list long enough to need searching. That is a `CommandMenu`, which is keyboard-first search over many commands.",
      "A global keyboard shortcut to open it. That job belongs to `CommandMenu`.",
      "Two or three actions that fit in the header. Show them as `Button`s — a hidden action is one more tap.",
      "Actions on one row or one object on the page. That is a `Menu` anchored to it, or a `ContextMenu`.",
      "A speed-dial of mini buttons fanning out of the FAB. It does not scale past about four actions and is hard to make accessible; the panel covers that case.",
    ],
    instead: [
      {
        job: "Finding a command by name",
        use: [{ name: "CommandMenu", slug: "command-menu" }],
      },
      {
        job: "Actions on one thing",
        use: [
          { name: "Menu", slug: "menu", when: "Anchored to a button beside the thing." },
          { name: "ContextMenu", slug: "context-menu", when: "On right-click or long-press." },
        ],
      },
      {
        job: "A few actions that fit",
        use: [
          { name: "Button", slug: "button" },
          { name: "Toolbar", slug: "toolbar" },
        ],
      },
    ],
  },
}
