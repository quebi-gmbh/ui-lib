import type { ComponentEntry } from "./types"
import { metaRegistry } from "./meta"
import { areaChartExamples } from "./area-chart.examples"
import { avatarExamples } from "./avatar.examples"
import { badgeExamples } from "./badge.examples"
import { barChartExamples } from "./bar-chart.examples"
import { barListExamples } from "./bar-list.examples"
import { breadcrumbsExamples } from "./breadcrumbs.examples"
import { buttonExamples } from "./button.examples"
import { buttonGroupExamples } from "./button-group.examples"
import { calendarExamples } from "./calendar.examples"
import { cardExamples } from "./card.examples"
import { carouselExamples } from "./carousel.examples"
import { chartExamples } from "./chart.examples"
import { checkboxExamples } from "./checkbox.examples"
import { choiceBoxExamples } from "./choice-box.examples"
import { colorAreaExamples } from "./color-area.examples"
import { colorFieldExamples } from "./color-field.examples"
import { colorPickerExamples } from "./color-picker.examples"
import { colorSliderExamples } from "./color-slider.examples"
import { colorSwatchExamples } from "./color-swatch.examples"
import { colorSwatchPickerExamples } from "./color-swatch-picker.examples"
import { colorThumbExamples } from "./color-thumb.examples"
import { colorWheelExamples } from "./color-wheel.examples"
import { comboBoxExamples } from "./combo-box.examples"
import { commandMenuExamples } from "./command-menu.examples"
import { conformCheckboxExamples } from "./conform-checkbox.examples"
import { conformColorPickerExamples } from "./conform-color-picker.examples"
import { conformColorSwatchPickerExamples } from "./conform-color-swatch-picker.examples"
import { conformDateFieldExamples } from "./conform-date-field.examples"
import { conformDatePickerExamples } from "./conform-date-picker.examples"
import { conformFieldExamples } from "./conform-field.examples"
import { conformNumberFieldExamples } from "./conform-number-field.examples"
import { conformSelectExamples } from "./conform-select.examples"
import { conformStoragePickerExamples } from "./conform-storage-picker.examples"
import { containerExamples } from "./container.examples"
import { contextMenuExamples } from "./context-menu.examples"
import { dateFieldExamples } from "./date-field.examples"
import { datePickerExamples } from "./date-picker.examples"
import { dateRangePickerExamples } from "./date-range-picker.examples"
import { descriptionListExamples } from "./description-list.examples"
import { dialogExamples } from "./dialog.examples"
import { disclosureGroupExamples } from "./disclosure-group.examples"
import { drawerExamples } from "./drawer.examples"
import { dropZoneExamples } from "./drop-zone.examples"
import { dropdownExamples } from "./dropdown.examples"
import { energyClassBadgeExamples } from "./energy-class-badge.examples"
import { fieldExamples } from "./field.examples"
import { fileTriggerExamples } from "./file-trigger.examples"
import { formattedDateExamples } from "./formatted-date.examples"
import { formattedNumberExamples } from "./formatted-number.examples"
import { formattedStorageExamples } from "./formatted-storage.examples"
import { galleryExamples } from "./gallery.examples"
import { gridListExamples } from "./grid-list.examples"
import { headingExamples } from "./heading.examples"
import { inputExamples } from "./input.examples"
import { inputOtpExamples } from "./input-otp.examples"
import { keyboardExamples } from "./keyboard.examples"
import { leaderboardExamples } from "./leaderboard.examples"
import { lineChartExamples } from "./line-chart.examples"
import { linkExamples } from "./link.examples"
import { linkButtonExamples } from "./link-button.examples"
import { linkToggleGroupExamples } from "./link-toggle-group.examples"
import { listBoxExamples } from "./list-box.examples"
import { loaderExamples } from "./loader.examples"
import { menuExamples } from "./menu.examples"
import { meterExamples } from "./meter.examples"
import { modalExamples } from "./modal.examples"
import { multipleSelectExamples } from "./multiple-select.examples"
import { navbarExamples } from "./navbar.examples"
import { noteExamples } from "./note.examples"
import { numberFieldExamples } from "./number-field.examples"
import { paginationExamples } from "./pagination.examples"
import { pieChartExamples } from "./pie-chart.examples"
import { popoverExamples } from "./popover.examples"
import { progressBarExamples } from "./progress-bar.examples"
import { progressCircleExamples } from "./progress-circle.examples"
import { radioExamples } from "./radio.examples"
import { rangeCalendarExamples } from "./range-calendar.examples"
import { scrollAreaExamples } from "./scroll-area.examples"
import { searchFieldExamples } from "./search-field.examples"
import { selectExamples } from "./select.examples"
import { separatorExamples } from "./separator.examples"
import { sheetExamples } from "./sheet.examples"
import { showMoreExamples } from "./show-more.examples"
import { sidebarExamples } from "./sidebar.examples"
import { skeletonExamples } from "./skeleton.examples"
import { sliderExamples } from "./slider.examples"
import { snippetExamples } from "./snippet.examples"
import { stepperExamples } from "./stepper.examples"
import { switchExamples } from "./switch.examples"
import { tableExamples } from "./table.examples"
import { tabsExamples } from "./tabs.examples"
import { tagFieldExamples } from "./tag-field.examples"
import { tagGroupExamples } from "./tag-group.examples"
import { textExamples } from "./text.examples"
import { textFieldExamples } from "./text-field.examples"
import { textareaExamples } from "./textarea.examples"
import { timeFieldExamples } from "./time-field.examples"
import { toastExamples } from "./toast.examples"
import { toggleExamples } from "./toggle.examples"
import { toggleGroupExamples } from "./toggle-group.examples"
import { toolbarExamples } from "./toolbar.examples"
import { tooltipExamples } from "./tooltip.examples"
import { trackerExamples } from "./tracker.examples"
import { treeExamples } from "./tree.examples"

const examplesBySlug: Record<string, ComponentEntry["examples"]> = {
  "area-chart": areaChartExamples,
  "avatar": avatarExamples,
  "badge": badgeExamples,
  "bar-chart": barChartExamples,
  "bar-list": barListExamples,
  "breadcrumbs": breadcrumbsExamples,
  "button": buttonExamples,
  "button-group": buttonGroupExamples,
  "calendar": calendarExamples,
  "card": cardExamples,
  "carousel": carouselExamples,
  "chart": chartExamples,
  "checkbox": checkboxExamples,
  "choice-box": choiceBoxExamples,
  "color-area": colorAreaExamples,
  "color-field": colorFieldExamples,
  "color-picker": colorPickerExamples,
  "color-slider": colorSliderExamples,
  "color-swatch": colorSwatchExamples,
  "color-swatch-picker": colorSwatchPickerExamples,
  "color-thumb": colorThumbExamples,
  "color-wheel": colorWheelExamples,
  "combo-box": comboBoxExamples,
  "command-menu": commandMenuExamples,
  "conform-checkbox": conformCheckboxExamples,
  "conform-color-picker": conformColorPickerExamples,
  "conform-color-swatch-picker": conformColorSwatchPickerExamples,
  "conform-date-field": conformDateFieldExamples,
  "conform-date-picker": conformDatePickerExamples,
  "conform-field": conformFieldExamples,
  "conform-number-field": conformNumberFieldExamples,
  "conform-select": conformSelectExamples,
  "conform-storage-picker": conformStoragePickerExamples,
  "container": containerExamples,
  "context-menu": contextMenuExamples,
  "date-field": dateFieldExamples,
  "date-picker": datePickerExamples,
  "date-range-picker": dateRangePickerExamples,
  "description-list": descriptionListExamples,
  "dialog": dialogExamples,
  "disclosure-group": disclosureGroupExamples,
  "drawer": drawerExamples,
  "drop-zone": dropZoneExamples,
  "dropdown": dropdownExamples,
  "energy-class-badge": energyClassBadgeExamples,
  "field": fieldExamples,
  "file-trigger": fileTriggerExamples,
  "formatted-date": formattedDateExamples,
  "formatted-number": formattedNumberExamples,
  "formatted-storage": formattedStorageExamples,
  "gallery": galleryExamples,
  "grid-list": gridListExamples,
  "heading": headingExamples,
  "input": inputExamples,
  "input-otp": inputOtpExamples,
  "keyboard": keyboardExamples,
  "leaderboard": leaderboardExamples,
  "line-chart": lineChartExamples,
  "link": linkExamples,
  "link-button": linkButtonExamples,
  "link-toggle-group": linkToggleGroupExamples,
  "list-box": listBoxExamples,
  "loader": loaderExamples,
  "menu": menuExamples,
  "meter": meterExamples,
  "modal": modalExamples,
  "multiple-select": multipleSelectExamples,
  "navbar": navbarExamples,
  "note": noteExamples,
  "number-field": numberFieldExamples,
  "pagination": paginationExamples,
  "pie-chart": pieChartExamples,
  "popover": popoverExamples,
  "progress-bar": progressBarExamples,
  "progress-circle": progressCircleExamples,
  "radio": radioExamples,
  "range-calendar": rangeCalendarExamples,
  "scroll-area": scrollAreaExamples,
  "search-field": searchFieldExamples,
  "select": selectExamples,
  "separator": separatorExamples,
  "sheet": sheetExamples,
  "show-more": showMoreExamples,
  "sidebar": sidebarExamples,
  "skeleton": skeletonExamples,
  "slider": sliderExamples,
  "snippet": snippetExamples,
  "stepper": stepperExamples,
  "switch": switchExamples,
  "table": tableExamples,
  "tabs": tabsExamples,
  "tag-field": tagFieldExamples,
  "tag-group": tagGroupExamples,
  "text": textExamples,
  "text-field": textFieldExamples,
  "textarea": textareaExamples,
  "time-field": timeFieldExamples,
  "toast": toastExamples,
  "toggle": toggleExamples,
  "toggle-group": toggleGroupExamples,
  "toolbar": toolbarExamples,
  "tooltip": tooltipExamples,
  "tracker": trackerExamples,
  "tree": treeExamples,
}

export const registry: ComponentEntry[] = metaRegistry.map((meta) => ({
  ...meta,
  examples: examplesBySlug[meta.slug] ?? [],
}))

export function getComponent(slug: string): ComponentEntry | undefined {
  return registry.find((c) => c.slug === slug)
}

export type { ComponentEntry, ComponentMeta } from "./types"
