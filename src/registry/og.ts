/**
 * Every component's OG scene, by slug.
 *
 * Deliberately not part of `ComponentEntry` in ./index.ts, which the home page
 * and both galleries import: wiring the scenes in there would put a hundred and
 * fifty more modules into the chunk every visitor downloads, to draw a picture
 * only the screenshot step ever looks at. `src/routes/og.$slug.tsx` imports this
 * map instead, so the scenes stay in the chunk that route splits into. What does
 * live on the metadata is the opt-out (`noOgScene`), because that is plain data
 * and tests/og-scenes.test.ts has to read both halves to pair them.
 */
import type { OgScene } from "./types"
import { activityPulseOgScene } from "./activity-pulse.og"
import { alertDialogOgScene } from "./alert-dialog.og"
import { areaChartOgScene } from "./area-chart.og"
import { asyncMultipleSelectOgScene } from "./async-multiple-select.og"
import { asyncSelectOgScene } from "./async-select.og"
import { avatarOgScene } from "./avatar.og"
import { badgeOgScene } from "./badge.og"
import { barChartOgScene } from "./bar-chart.og"
import { barListOgScene } from "./bar-list.og"
import { breadcrumbsOgScene } from "./breadcrumbs.og"
import { buttonOgScene } from "./button.og"
import { buttonGroupOgScene } from "./button-group.og"
import { calendarOgScene } from "./calendar.og"
import { calendarShellOgScene } from "./calendar-shell.og"
import { calendarTimelineOgScene } from "./calendar-timeline.og"
import { calendarToolbarOgScene } from "./calendar-toolbar.og"
import { cardOgScene } from "./card.og"
import { carouselOgScene } from "./carousel.og"
import { chartOgScene } from "./chart.og"
import { checkboxOgScene } from "./checkbox.og"
import { choiceBoxOgScene } from "./choice-box.og"
import { colorAreaOgScene } from "./color-area.og"
import { colorFieldOgScene } from "./color-field.og"
import { colorPickerOgScene } from "./color-picker.og"
import { colorSliderOgScene } from "./color-slider.og"
import { colorSwatchOgScene } from "./color-swatch.og"
import { colorSwatchPickerOgScene } from "./color-swatch-picker.og"
import { colorThumbOgScene } from "./color-thumb.og"
import { colorWheelOgScene } from "./color-wheel.og"
import { comboBoxOgScene } from "./combo-box.og"
import { commandMenuOgScene } from "./command-menu.og"
import { commitGraphOgScene } from "./commit-graph.og"
import { composedChartOgScene } from "./composed-chart.og"
import { conformAsyncMultipleSelectOgScene } from "./conform-async-multiple-select.og"
import { conformAsyncSelectOgScene } from "./conform-async-select.og"
import { conformCalendarOgScene } from "./conform-calendar.og"
import { conformCalendarTimelineOgScene } from "./conform-calendar-timeline.og"
import { conformCheckboxOgScene } from "./conform-checkbox.og"
import { conformCheckboxGroupOgScene } from "./conform-checkbox-group.og"
import { conformChoiceBoxOgScene } from "./conform-choice-box.og"
import { conformColorFieldOgScene } from "./conform-color-field.og"
import { conformColorPickerOgScene } from "./conform-color-picker.og"
import { conformColorSwatchPickerOgScene } from "./conform-color-swatch-picker.og"
import { conformComboBoxOgScene } from "./conform-combo-box.og"
import { conformDateFieldOgScene } from "./conform-date-field.og"
import { conformDatePickerOgScene } from "./conform-date-picker.og"
import { conformDateRangePickerOgScene } from "./conform-date-range-picker.og"
import { conformDayScheduleOgScene } from "./conform-day-schedule.og"
import { conformFieldOgScene } from "./conform-field.og"
import { conformFileTriggerOgScene } from "./conform-file-trigger.og"
import { conformInputOtpOgScene } from "./conform-input-otp.og"
import { conformMonthPickerOgScene } from "./conform-month-picker.og"
import { conformMultipleSelectOgScene } from "./conform-multiple-select.og"
import { conformNumberFieldOgScene } from "./conform-number-field.og"
import { conformRadioGroupOgScene } from "./conform-radio-group.og"
import { conformRangeCalendarOgScene } from "./conform-range-calendar.og"
import { conformSearchFieldOgScene } from "./conform-search-field.og"
import { conformSelectOgScene } from "./conform-select.og"
import { conformSliderOgScene } from "./conform-slider.og"
import { conformStoragePickerOgScene } from "./conform-storage-picker.og"
import { conformSwitchOgScene } from "./conform-switch.og"
import { conformTagFieldOgScene } from "./conform-tag-field.og"
import { conformTextareaOgScene } from "./conform-textarea.og"
import { conformTimeFieldOgScene } from "./conform-time-field.og"
import { conformWeekPickerOgScene } from "./conform-week-picker.og"
import { conformYearPickerOgScene } from "./conform-year-picker.og"
import { contextMenuOgScene } from "./context-menu.og"
import { dataTableOgScene } from "./data-table.og"
import { dateFieldOgScene } from "./date-field.og"
import { datePickerOgScene } from "./date-picker.og"
import { dateRangePickerOgScene } from "./date-range-picker.og"
import { dayScheduleMinimapOgScene } from "./day-schedule-minimap.og"
import { dayScheduleOgScene } from "./day-schedule.og"
import { dayViewOgScene } from "./day-view.og"
import { descriptionListOgScene } from "./description-list.og"
import { dialogOgScene } from "./dialog.og"
import { disclosureGroupOgScene } from "./disclosure-group.og"
import { drawerOgScene } from "./drawer.og"
import { dropZoneOgScene } from "./drop-zone.og"
import { dropdownOgScene } from "./dropdown.og"
import { elapsedTimeOgScene } from "./elapsed-time.og"
import { energyClassBadgeOgScene } from "./energy-class-badge.og"
import { fieldOgScene } from "./field.og"
import { filterBarOgScene } from "./filter-bar.og"
import { filterBuilderOgScene } from "./filter-builder.og"
import { filterRailOgScene } from "./filter-rail.og"
import { fileTriggerOgScene } from "./file-trigger.og"
import { formattedDateOgScene } from "./formatted-date.og"
import { formattedNumberOgScene } from "./formatted-number.og"
import { formattedStorageOgScene } from "./formatted-storage.og"
import { galleryOgScene } from "./gallery.og"
import { gridListOgScene } from "./grid-list.og"
import { headingOgScene } from "./heading.og"
import { iconTileOgScene } from "./icon-tile.og"
import { inputOgScene } from "./input.og"
import { inputOtpOgScene } from "./input-otp.og"
import { itemOgScene } from "./item.og"
import { keyboardOgScene } from "./keyboard.og"
import { leaderboardOgScene } from "./leaderboard.og"
import { lineChartOgScene } from "./line-chart.og"
import { linkOgScene } from "./link.og"
import { linkButtonOgScene } from "./link-button.og"
import { linkToggleGroupOgScene } from "./link-toggle-group.og"
import { listBoxOgScene } from "./list-box.og"
import { loaderOgScene } from "./loader.og"
import { menuOgScene } from "./menu.og"
import { meterOgScene } from "./meter.og"
import { modalOgScene } from "./modal.og"
import { monthPickerOgScene } from "./month-picker.og"
import { miniMonthOgScene } from "./mini-month.og"
import { monthViewOgScene } from "./month-view.og"
import { multipleSelectOgScene } from "./multiple-select.og"
import { navbarOgScene } from "./navbar.og"
import { noteOgScene } from "./note.og"
import { numberFieldOgScene } from "./number-field.og"
import { paginationOgScene } from "./pagination.og"
import { panelOgScene } from "./panel.og"
import { pieChartOgScene } from "./pie-chart.og"
import { popoverOgScene } from "./popover.og"
import { progressBarOgScene } from "./progress-bar.og"
import { progressCircleOgScene } from "./progress-circle.og"
import { radarChartOgScene } from "./radar-chart.og"
import { radialBarChartOgScene } from "./radial-bar-chart.og"
import { radioOgScene } from "./radio.og"
import { rangeCalendarOgScene } from "./range-calendar.og"
import { scatterChartOgScene } from "./scatter-chart.og"
import { scrollAreaOgScene } from "./scroll-area.og"
import { searchFieldOgScene } from "./search-field.og"
import { selectOgScene } from "./select.og"
import { separatorOgScene } from "./separator.og"
import { serverTableOgScene } from "./server-table.og"
import { sheetOgScene } from "./sheet.og"
import { showMoreOgScene } from "./show-more.og"
import { sidebarOgScene } from "./sidebar.og"
import { signalBarsOgScene } from "./signal-bars.og"
import { skeletonOgScene } from "./skeleton.og"
import { sliderOgScene } from "./slider.og"
import { snippetOgScene } from "./snippet.og"
import { sparklineOgScene } from "./sparkline.og"
import { statOgScene } from "./stat.og"
import { statusDotOgScene } from "./status-dot.og"
import { stepperOgScene } from "./stepper.og"
import { sunburstChartOgScene } from "./sunburst-chart.og"
import { switchOgScene } from "./switch.og"
import { tableOgScene } from "./table.og"
import { tableControlsOgScene } from "./table-controls.og"
import { tableShellOgScene } from "./table-shell.og"
import { tabsOgScene } from "./tabs.og"
import { tagFieldOgScene } from "./tag-field.og"
import { tagGroupOgScene } from "./tag-group.og"
import { textOgScene } from "./text.og"
import { textFieldOgScene } from "./text-field.og"
import { textareaOgScene } from "./textarea.og"
import { timeFieldOgScene } from "./time-field.og"
import { toastOgScene } from "./toast.og"
import { toggleOgScene } from "./toggle.og"
import { toggleGroupOgScene } from "./toggle-group.og"
import { toolbarOgScene } from "./toolbar.og"
import { tooltipOgScene } from "./tooltip.og"
import { trackerOgScene } from "./tracker.og"
import { treeOgScene } from "./tree.og"
import { treemapOgScene } from "./treemap.og"
import { typingIndicatorOgScene } from "./typing-indicator.og"
import { weekPickerOgScene } from "./week-picker.og"
import { weekViewOgScene } from "./week-view.og"
import { yearPickerOgScene } from "./year-picker.og"

export const ogScenes: Record<string, OgScene> = {
  "activity-pulse": activityPulseOgScene,
  "alert-dialog": alertDialogOgScene,
  "area-chart": areaChartOgScene,
  "async-multiple-select": asyncMultipleSelectOgScene,
  "async-select": asyncSelectOgScene,
  "avatar": avatarOgScene,
  "badge": badgeOgScene,
  "bar-chart": barChartOgScene,
  "bar-list": barListOgScene,
  "breadcrumbs": breadcrumbsOgScene,
  "button": buttonOgScene,
  "button-group": buttonGroupOgScene,
  "calendar": calendarOgScene,
  "calendar-shell": calendarShellOgScene,
  "calendar-timeline": calendarTimelineOgScene,
  "calendar-toolbar": calendarToolbarOgScene,
  "card": cardOgScene,
  "carousel": carouselOgScene,
  "chart": chartOgScene,
  "checkbox": checkboxOgScene,
  "choice-box": choiceBoxOgScene,
  "color-area": colorAreaOgScene,
  "color-field": colorFieldOgScene,
  "color-picker": colorPickerOgScene,
  "color-slider": colorSliderOgScene,
  "color-swatch": colorSwatchOgScene,
  "color-swatch-picker": colorSwatchPickerOgScene,
  "color-thumb": colorThumbOgScene,
  "color-wheel": colorWheelOgScene,
  "combo-box": comboBoxOgScene,
  "command-menu": commandMenuOgScene,
  "commit-graph": commitGraphOgScene,
  "composed-chart": composedChartOgScene,
  "conform-async-multiple-select": conformAsyncMultipleSelectOgScene,
  "conform-async-select": conformAsyncSelectOgScene,
  "conform-calendar": conformCalendarOgScene,
  "conform-calendar-timeline": conformCalendarTimelineOgScene,
  "conform-checkbox": conformCheckboxOgScene,
  "conform-checkbox-group": conformCheckboxGroupOgScene,
  "conform-choice-box": conformChoiceBoxOgScene,
  "conform-color-field": conformColorFieldOgScene,
  "conform-color-picker": conformColorPickerOgScene,
  "conform-color-swatch-picker": conformColorSwatchPickerOgScene,
  "conform-combo-box": conformComboBoxOgScene,
  "conform-date-field": conformDateFieldOgScene,
  "conform-date-picker": conformDatePickerOgScene,
  "conform-date-range-picker": conformDateRangePickerOgScene,
  "conform-day-schedule": conformDayScheduleOgScene,
  "conform-field": conformFieldOgScene,
  "conform-file-trigger": conformFileTriggerOgScene,
  "conform-input-otp": conformInputOtpOgScene,
  "conform-month-picker": conformMonthPickerOgScene,
  "conform-multiple-select": conformMultipleSelectOgScene,
  "conform-number-field": conformNumberFieldOgScene,
  "conform-radio-group": conformRadioGroupOgScene,
  "conform-range-calendar": conformRangeCalendarOgScene,
  "conform-search-field": conformSearchFieldOgScene,
  "conform-select": conformSelectOgScene,
  "conform-slider": conformSliderOgScene,
  "conform-storage-picker": conformStoragePickerOgScene,
  "conform-switch": conformSwitchOgScene,
  "conform-tag-field": conformTagFieldOgScene,
  "conform-textarea": conformTextareaOgScene,
  "conform-time-field": conformTimeFieldOgScene,
  "conform-week-picker": conformWeekPickerOgScene,
  "conform-year-picker": conformYearPickerOgScene,
  "context-menu": contextMenuOgScene,
  "data-table": dataTableOgScene,
  "date-field": dateFieldOgScene,
  "date-picker": datePickerOgScene,
  "date-range-picker": dateRangePickerOgScene,
  "day-schedule": dayScheduleOgScene,
  "day-schedule-minimap": dayScheduleMinimapOgScene,
  "day-view": dayViewOgScene,
  "description-list": descriptionListOgScene,
  "dialog": dialogOgScene,
  "disclosure-group": disclosureGroupOgScene,
  "drawer": drawerOgScene,
  "drop-zone": dropZoneOgScene,
  "dropdown": dropdownOgScene,
  "elapsed-time": elapsedTimeOgScene,
  "energy-class-badge": energyClassBadgeOgScene,
  "field": fieldOgScene,
  "file-trigger": fileTriggerOgScene,
  "filter-bar": filterBarOgScene,
  "filter-builder": filterBuilderOgScene,
  "filter-rail": filterRailOgScene,
  "formatted-date": formattedDateOgScene,
  "formatted-number": formattedNumberOgScene,
  "formatted-storage": formattedStorageOgScene,
  "gallery": galleryOgScene,
  "grid-list": gridListOgScene,
  "heading": headingOgScene,
  "icon-tile": iconTileOgScene,
  "input": inputOgScene,
  "input-otp": inputOtpOgScene,
  "item": itemOgScene,
  "keyboard": keyboardOgScene,
  "leaderboard": leaderboardOgScene,
  "line-chart": lineChartOgScene,
  "link": linkOgScene,
  "link-button": linkButtonOgScene,
  "link-toggle-group": linkToggleGroupOgScene,
  "list-box": listBoxOgScene,
  "loader": loaderOgScene,
  "menu": menuOgScene,
  "meter": meterOgScene,
  "modal": modalOgScene,
  "month-picker": monthPickerOgScene,
  "mini-month": miniMonthOgScene,
  "month-view": monthViewOgScene,
  "multiple-select": multipleSelectOgScene,
  "navbar": navbarOgScene,
  "note": noteOgScene,
  "number-field": numberFieldOgScene,
  "pagination": paginationOgScene,
  "panel": panelOgScene,
  "pie-chart": pieChartOgScene,
  "popover": popoverOgScene,
  "progress-bar": progressBarOgScene,
  "progress-circle": progressCircleOgScene,
  "radar-chart": radarChartOgScene,
  "radial-bar-chart": radialBarChartOgScene,
  "radio": radioOgScene,
  "range-calendar": rangeCalendarOgScene,
  "scatter-chart": scatterChartOgScene,
  "scroll-area": scrollAreaOgScene,
  "search-field": searchFieldOgScene,
  "select": selectOgScene,
  "separator": separatorOgScene,
  "server-table": serverTableOgScene,
  "sheet": sheetOgScene,
  "show-more": showMoreOgScene,
  "sidebar": sidebarOgScene,
  "signal-bars": signalBarsOgScene,
  "skeleton": skeletonOgScene,
  "slider": sliderOgScene,
  "snippet": snippetOgScene,
  "sparkline": sparklineOgScene,
  "stat": statOgScene,
  "status-dot": statusDotOgScene,
  "stepper": stepperOgScene,
  "sunburst-chart": sunburstChartOgScene,
  "switch": switchOgScene,
  "table": tableOgScene,
  "table-controls": tableControlsOgScene,
  "table-shell": tableShellOgScene,
  "tabs": tabsOgScene,
  "tag-field": tagFieldOgScene,
  "tag-group": tagGroupOgScene,
  "text": textOgScene,
  "text-field": textFieldOgScene,
  "textarea": textareaOgScene,
  "time-field": timeFieldOgScene,
  "toast": toastOgScene,
  "toggle": toggleOgScene,
  "toggle-group": toggleGroupOgScene,
  "toolbar": toolbarOgScene,
  "tooltip": tooltipOgScene,
  "tracker": trackerOgScene,
  "tree": treeOgScene,
  "treemap": treemapOgScene,
  "typing-indicator": typingIndicatorOgScene,
  "week-picker": weekPickerOgScene,
  "week-view": weekViewOgScene,
  "year-picker": yearPickerOgScene,
}
