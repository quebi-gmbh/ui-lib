import type { ComponentMeta } from "./types"
import { activityPulseMeta } from "./activity-pulse.meta"
import { alertDialogMeta } from "./alert-dialog.meta"
import { areaChartMeta } from "./area-chart.meta"
import { asyncMultipleSelectMeta } from "./async-multiple-select.meta"
import { asyncSelectMeta } from "./async-select.meta"
import { avatarMeta } from "./avatar.meta"
import { badgeMeta } from "./badge.meta"
import { barChartMeta } from "./bar-chart.meta"
import { barListMeta } from "./bar-list.meta"
import { breadcrumbsMeta } from "./breadcrumbs.meta"
import { buttonMeta } from "./button.meta"
import { buttonGroupMeta } from "./button-group.meta"
import { calendarMeta } from "./calendar.meta"
import { calendarShellMeta } from "./calendar-shell.meta"
import { calendarTimelineMeta } from "./calendar-timeline.meta"
import { calendarToolbarMeta } from "./calendar-toolbar.meta"
import { cardMeta } from "./card.meta"
import { carouselMeta } from "./carousel.meta"
import { chartMeta } from "./chart.meta"
import { checkboxMeta } from "./checkbox.meta"
import { choiceBoxMeta } from "./choice-box.meta"
import { colorAreaMeta } from "./color-area.meta"
import { colorFieldMeta } from "./color-field.meta"
import { colorPickerMeta } from "./color-picker.meta"
import { colorSliderMeta } from "./color-slider.meta"
import { colorSwatchMeta } from "./color-swatch.meta"
import { colorSwatchPickerMeta } from "./color-swatch-picker.meta"
import { colorThumbMeta } from "./color-thumb.meta"
import { colorWheelMeta } from "./color-wheel.meta"
import { comboBoxMeta } from "./combo-box.meta"
import { commandMenuMeta } from "./command-menu.meta"
import { commitGraphMeta } from "./commit-graph.meta"
import { composedChartMeta } from "./composed-chart.meta"
import { conformAsyncMultipleSelectMeta } from "./conform-async-multiple-select.meta"
import { conformAsyncSelectMeta } from "./conform-async-select.meta"
import { conformCalendarMeta } from "./conform-calendar.meta"
import { conformCalendarTimelineMeta } from "./conform-calendar-timeline.meta"
import { conformCheckboxMeta } from "./conform-checkbox.meta"
import { conformCheckboxGroupMeta } from "./conform-checkbox-group.meta"
import { conformChoiceBoxMeta } from "./conform-choice-box.meta"
import { conformColorFieldMeta } from "./conform-color-field.meta"
import { conformColorPickerMeta } from "./conform-color-picker.meta"
import { conformColorSwatchPickerMeta } from "./conform-color-swatch-picker.meta"
import { conformComboBoxMeta } from "./conform-combo-box.meta"
import { conformDateFieldMeta } from "./conform-date-field.meta"
import { conformDatePickerMeta } from "./conform-date-picker.meta"
import { conformDateRangePickerMeta } from "./conform-date-range-picker.meta"
import { conformDayScheduleMeta } from "./conform-day-schedule.meta"
import { conformFieldMeta } from "./conform-field.meta"
import { conformFileTriggerMeta } from "./conform-file-trigger.meta"
import { conformInputOtpMeta } from "./conform-input-otp.meta"
import { conformMonthPickerMeta } from "./conform-month-picker.meta"
import { conformMultipleSelectMeta } from "./conform-multiple-select.meta"
import { conformNumberFieldMeta } from "./conform-number-field.meta"
import { conformRadioGroupMeta } from "./conform-radio-group.meta"
import { conformRangeCalendarMeta } from "./conform-range-calendar.meta"
import { conformSearchFieldMeta } from "./conform-search-field.meta"
import { conformSelectMeta } from "./conform-select.meta"
import { conformSliderMeta } from "./conform-slider.meta"
import { conformStoragePickerMeta } from "./conform-storage-picker.meta"
import { conformSwitchMeta } from "./conform-switch.meta"
import { conformTagFieldMeta } from "./conform-tag-field.meta"
import { conformTextareaMeta } from "./conform-textarea.meta"
import { conformTimeFieldMeta } from "./conform-time-field.meta"
import { conformWeekPickerMeta } from "./conform-week-picker.meta"
import { conformYearPickerMeta } from "./conform-year-picker.meta"
import { containerMeta } from "./container.meta"
import { contextMenuMeta } from "./context-menu.meta"
import { dataTableMeta } from "./data-table.meta"
import { dateFieldMeta } from "./date-field.meta"
import { datePickerMeta } from "./date-picker.meta"
import { dateRangePickerMeta } from "./date-range-picker.meta"
import { dayScheduleMinimapMeta } from "./day-schedule-minimap.meta"
import { dayScheduleMeta } from "./day-schedule.meta"
import { dayViewMeta } from "./day-view.meta"
import { descriptionListMeta } from "./description-list.meta"
import { dialogMeta } from "./dialog.meta"
import { disclosureGroupMeta } from "./disclosure-group.meta"
import { drawerMeta } from "./drawer.meta"
import { dropZoneMeta } from "./drop-zone.meta"
import { dropdownMeta } from "./dropdown.meta"
import { elapsedTimeMeta } from "./elapsed-time.meta"
import { energyClassBadgeMeta } from "./energy-class-badge.meta"
import { fieldMeta } from "./field.meta"
import { filterBarMeta } from "./filter-bar.meta"
import { filterBuilderMeta } from "./filter-builder.meta"
import { filterRailMeta } from "./filter-rail.meta"
import { fileTriggerMeta } from "./file-trigger.meta"
import { formattedDateMeta } from "./formatted-date.meta"
import { formattedNumberMeta } from "./formatted-number.meta"
import { formattedStorageMeta } from "./formatted-storage.meta"
import { galleryMeta } from "./gallery.meta"
import { gridListMeta } from "./grid-list.meta"
import { headingMeta } from "./heading.meta"
import { iconTileMeta } from "./icon-tile.meta"
import { inputMeta } from "./input.meta"
import { inputOtpMeta } from "./input-otp.meta"
import { itemMeta } from "./item.meta"
import { keyboardMeta } from "./keyboard.meta"
import { leaderboardMeta } from "./leaderboard.meta"
import { lineChartMeta } from "./line-chart.meta"
import { listMeta } from "./list.meta"
import { linkMeta } from "./link.meta"
import { linkButtonMeta } from "./link-button.meta"
import { linkToggleGroupMeta } from "./link-toggle-group.meta"
import { listBoxMeta } from "./list-box.meta"
import { loaderMeta } from "./loader.meta"
import { menuMeta } from "./menu.meta"
import { meterMeta } from "./meter.meta"
import { miniMonthMeta } from "./mini-month.meta"
import { modalMeta } from "./modal.meta"
import { monthPickerMeta } from "./month-picker.meta"
import { monthViewMeta } from "./month-view.meta"
import { multipleSelectMeta } from "./multiple-select.meta"
import { navbarMeta } from "./navbar.meta"
import { noteMeta } from "./note.meta"
import { numberFieldMeta } from "./number-field.meta"
import { paginationMeta } from "./pagination.meta"
import { panelMeta } from "./panel.meta"
import { pieChartMeta } from "./pie-chart.meta"
import { popoverMeta } from "./popover.meta"
import { progressBarMeta } from "./progress-bar.meta"
import { progressCircleMeta } from "./progress-circle.meta"
import { quickActionsMeta } from "./quick-actions.meta"
import { radarChartMeta } from "./radar-chart.meta"
import { radialBarChartMeta } from "./radial-bar-chart.meta"
import { radioMeta } from "./radio.meta"
import { rangeCalendarMeta } from "./range-calendar.meta"
import { scrollAreaMeta } from "./scroll-area.meta"
import { scatterChartMeta } from "./scatter-chart.meta"
import { searchFieldMeta } from "./search-field.meta"
import { selectMeta } from "./select.meta"
import { separatorMeta } from "./separator.meta"
import { serverTableMeta } from "./server-table.meta"
import { sheetMeta } from "./sheet.meta"
import { showMoreMeta } from "./show-more.meta"
import { sidebarMeta } from "./sidebar.meta"
import { signalBarsMeta } from "./signal-bars.meta"
import { skeletonMeta } from "./skeleton.meta"
import { sliderMeta } from "./slider.meta"
import { snippetMeta } from "./snippet.meta"
import { sparklineMeta } from "./sparkline.meta"
import { statMeta } from "./stat.meta"
import { statusDotMeta } from "./status-dot.meta"
import { stepperMeta } from "./stepper.meta"
import { sunburstChartMeta } from "./sunburst-chart.meta"
import { switchMeta } from "./switch.meta"
import { tableMeta } from "./table.meta"
import { tableControlsMeta } from "./table-controls.meta"
import { tableOfContentsMeta } from "./table-of-contents.meta"
import { tableShellMeta } from "./table-shell.meta"
import { tabsMeta } from "./tabs.meta"
import { tagFieldMeta } from "./tag-field.meta"
import { tagGroupMeta } from "./tag-group.meta"
import { textMeta } from "./text.meta"
import { textFieldMeta } from "./text-field.meta"
import { textareaMeta } from "./textarea.meta"
import { timeFieldMeta } from "./time-field.meta"
import { toastMeta } from "./toast.meta"
import { toggleMeta } from "./toggle.meta"
import { toggleGroupMeta } from "./toggle-group.meta"
import { toolbarMeta } from "./toolbar.meta"
import { tooltipMeta } from "./tooltip.meta"
import { trackerMeta } from "./tracker.meta"
import { treemapMeta } from "./treemap.meta"
import { treeMeta } from "./tree.meta"
import { typingIndicatorMeta } from "./typing-indicator.meta"
import { weekPickerMeta } from "./week-picker.meta"
import { weekViewMeta } from "./week-view.meta"
import { yearPickerMeta } from "./year-picker.meta"

export const metaRegistry: ComponentMeta[] = [
  activityPulseMeta,
  alertDialogMeta,
  areaChartMeta,
  asyncMultipleSelectMeta,
  asyncSelectMeta,
  avatarMeta,
  badgeMeta,
  barChartMeta,
  barListMeta,
  breadcrumbsMeta,
  buttonMeta,
  buttonGroupMeta,
  calendarMeta,
  calendarShellMeta,
  calendarTimelineMeta,
  calendarToolbarMeta,
  cardMeta,
  carouselMeta,
  chartMeta,
  checkboxMeta,
  choiceBoxMeta,
  colorAreaMeta,
  colorFieldMeta,
  colorPickerMeta,
  colorSliderMeta,
  colorSwatchMeta,
  colorSwatchPickerMeta,
  colorThumbMeta,
  colorWheelMeta,
  comboBoxMeta,
  commandMenuMeta,
  commitGraphMeta,
  composedChartMeta,
  conformAsyncMultipleSelectMeta,
  conformAsyncSelectMeta,
  conformCalendarMeta,
  conformCalendarTimelineMeta,
  conformCheckboxMeta,
  conformCheckboxGroupMeta,
  conformChoiceBoxMeta,
  conformColorFieldMeta,
  conformColorPickerMeta,
  conformColorSwatchPickerMeta,
  conformComboBoxMeta,
  conformDateFieldMeta,
  conformDatePickerMeta,
  conformDateRangePickerMeta,
  conformDayScheduleMeta,
  conformFieldMeta,
  conformFileTriggerMeta,
  conformInputOtpMeta,
  conformMonthPickerMeta,
  conformMultipleSelectMeta,
  conformNumberFieldMeta,
  conformRadioGroupMeta,
  conformRangeCalendarMeta,
  conformSearchFieldMeta,
  conformSelectMeta,
  conformSliderMeta,
  conformStoragePickerMeta,
  conformSwitchMeta,
  conformTagFieldMeta,
  conformTextareaMeta,
  conformTimeFieldMeta,
  conformWeekPickerMeta,
  conformYearPickerMeta,
  containerMeta,
  contextMenuMeta,
  dataTableMeta,
  dateFieldMeta,
  datePickerMeta,
  dateRangePickerMeta,
  dayScheduleMeta,
  dayScheduleMinimapMeta,
  dayViewMeta,
  descriptionListMeta,
  dialogMeta,
  disclosureGroupMeta,
  drawerMeta,
  dropZoneMeta,
  dropdownMeta,
  elapsedTimeMeta,
  energyClassBadgeMeta,
  fieldMeta,
  fileTriggerMeta,
  filterBarMeta,
  filterBuilderMeta,
  filterRailMeta,
  formattedDateMeta,
  formattedNumberMeta,
  formattedStorageMeta,
  galleryMeta,
  gridListMeta,
  headingMeta,
  iconTileMeta,
  inputMeta,
  inputOtpMeta,
  itemMeta,
  keyboardMeta,
  leaderboardMeta,
  lineChartMeta,
  listMeta,
  linkMeta,
  linkButtonMeta,
  linkToggleGroupMeta,
  listBoxMeta,
  loaderMeta,
  menuMeta,
  meterMeta,
  miniMonthMeta,
  modalMeta,
  monthPickerMeta,
  monthViewMeta,
  multipleSelectMeta,
  navbarMeta,
  noteMeta,
  numberFieldMeta,
  paginationMeta,
  panelMeta,
  pieChartMeta,
  popoverMeta,
  progressBarMeta,
  progressCircleMeta,
  quickActionsMeta,
  radarChartMeta,
  radialBarChartMeta,
  radioMeta,
  rangeCalendarMeta,
  scatterChartMeta,
  scrollAreaMeta,
  searchFieldMeta,
  selectMeta,
  separatorMeta,
  serverTableMeta,
  sheetMeta,
  showMoreMeta,
  sidebarMeta,
  signalBarsMeta,
  skeletonMeta,
  sliderMeta,
  snippetMeta,
  sparklineMeta,
  statMeta,
  statusDotMeta,
  stepperMeta,
  sunburstChartMeta,
  switchMeta,
  tableMeta,
  tableControlsMeta,
  tableOfContentsMeta,
  tableShellMeta,
  tabsMeta,
  tagFieldMeta,
  tagGroupMeta,
  textMeta,
  textFieldMeta,
  textareaMeta,
  timeFieldMeta,
  toastMeta,
  toggleMeta,
  toggleGroupMeta,
  toolbarMeta,
  tooltipMeta,
  trackerMeta,
  treemapMeta,
  treeMeta,
  typingIndicatorMeta,
  weekPickerMeta,
  weekViewMeta,
  yearPickerMeta,
]
