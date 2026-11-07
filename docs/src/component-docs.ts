export interface ApiItem {
  name: string
  type: string
  default?: string
  description: string
  required?: boolean
}

export interface PropItem extends ApiItem {
  required: boolean
}

export interface ComponentDoc {
  category: 'Actions' | 'Forms' | 'Feedback' | 'Layout'
  slug: string
  name: string
  title: string
  summary: string
  usage: string | string[]
  props: PropItem[]
  slots: ApiItem[]
  events: ApiItem[]
  example: {
    title: string
    description: string
    code: string
  }
}

export const componentDocs: ComponentDoc[] = [
  {
    category: 'Layout',
    slug: 'drawer',
    name: 'UiDrawer',
    title: 'Drawer',
    summary: 'Opens a modal panel from the left edge and contains keyboard focus.',
    usage: [
      'Use UiDrawer for temporary navigation or supporting content. Keep permanent navigation in the page.',
      'Bind open with v-model:open so the application applies requests to open or close the panel.',
      'For page navigation, keep native navigation available through hydration.',
      'In the application, choose when to replace native navigation with the drawer.',
      'When a desktop layout no longer needs the drawer, close it in the application.',
      'Pass panel attributes to UiDrawer. It forwards them to DialogContent.',
    ],
    props: [
      { name: 'open', required: true, type: 'boolean', description: 'Whether the panel is open.' },
      { name: 'title', required: true, type: 'string', description: 'Visible h2 heading that supplies the panel\'s accessible name by default.' },
    ],
    slots: [
      { name: 'trigger', type: 'unknown', description: 'One button that receives trigger attributes and opens the drawer. Closing normally restores focus to this button.' },
      { name: 'default', type: 'unknown', description: 'Content inside the scrollable panel body. Closed content unmounts by default.' },
    ],
    events: [
      { name: 'update:open', type: 'boolean', description: 'Requests the next open value: true to open or false to close.' },
      { name: 'closeAutoFocus', type: 'Event', description: 'Cancelable event before focus restoration on close. Call preventDefault() before focusing a link destination heading or another element.' },
    ],
    example: {
      title: 'Page navigation',
      description: 'Escape, a primary click on the backdrop, and the close button request closure. The navigation link closes the panel by setting open to false.',
      code: `<UiDrawer v-model:open="open" title="Navigation">\n  <template #trigger>\n    <UiButton variant="secondary" size="lg">Menu</UiButton>\n  </template>\n  <nav aria-label="On this page">\n    <a href="#overview" @click="open = false">Overview</a>\n  </nav>\n</UiDrawer>`,
    },
  },
  {
    category: 'Layout',
    slug: 'tabs',
    name: 'UiTabs',
    title: 'Tabs',
    summary: 'Switches between related content panels.',
    usage: [
      'Use tabs for alternative views of related content. Use ordinary sections when all content should stay visible.',
      'Bind modelValue with v-model to apply selection requests.',
      'During SSR and initial hydration, every panel appears under its item\'s h3 heading. After mounting, the tab list appears and inactive panels are hidden.',
      'Left Arrow and Right Arrow move focus between tabs and wrap at either end. In right-to-left layouts, their directions reverse. Home and End move focus to the first and last tabs.',
      'When tabs overflow, the strip scrolls and fades clipped edges. It keeps the active tab visible after selection, item changes, and resizing.',
      'Keep section headings used as link destinations outside UiTabs.',
      'If mounting changes the page height, scroll to the initial URL hash again after layout settles.',
    ],
    props: [
      { name: 'items', required: true, type: 'readonly UiTabItem[]', description: 'Ordered { value, label } items with unique values and visible labels. An empty array renders no tabs or panels.' },
      { name: 'label', required: true, type: 'string', description: 'Accessible name for the tab list, such as \'Process captures\'.' },
      { name: 'modelValue', required: true, type: 'string', description: 'Selected item value. An unmatched value displays the first item without updating the model.' },
    ],
    slots: [
      { name: 'panel', type: '{ value: string }', description: 'Receives { value } for each item. Each panel stays mounted while inactive, so its component state is retained.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emits a different item\'s value on click or focus, including keyboard focus. Selecting the active item emits nothing.' },
    ],
    example: {
      title: 'Related captures',
      description: 'The example uses value to choose between process list and process detail content.',
      code: `<UiTabs\n  v-model="capture"\n  label="Process captures"\n  :items="[{ value: 'list', label: 'List' }, { value: 'details', label: 'Details' }]"\n>\n  <template #panel="{ value }">\n    <p v-if="value === 'list'">Process list capture</p>\n    <p v-else>Process details capture</p>\n  </template>\n</UiTabs>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'alert',
    name: 'UiAlert',
    title: 'Alert',
    summary: 'Displays contextual feedback with a live-region role selected by its tone.',
    usage: [
      'Place feedback near the work it concerns so the message remains available.',
      'State what happened and any action the reader needs to take.',
      'For a short label without live announcements, use UiBadge.',
    ],
    props: [
      { name: 'tone', required: false, type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'", default: "'neutral'", description: 'Sets colors and the live-region role. danger and error use role="alert" for assertive announcements; other tones use role="status" for polite announcements.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Message and supporting content. The component supplies no dismiss control.' },
    ],
    events: [],
    example: {
      title: 'Import status',
      description: 'The success tone presents the completed import as a status message.',
      code: `<UiAlert tone="success">\n  Theme imported successfully.\n</UiAlert>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'badge',
    name: 'UiBadge',
    title: 'Badge',
    summary: 'Displays a compact text label for a state, category, or other metadata.',
    usage: [
      'Keep labels short enough to scan beside the item they describe.',
      'Name the state in text so its meaning does not depend on color.',
      'For feedback that needs live announcements, use UiAlert.',
    ],
    props: [
      { name: 'tone', required: false, type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'", default: "'neutral'", description: 'Sets label colors without adding a live-region role. danger and error share the same styling.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Text that names the state, category, or metadata.' },
    ],
    events: [],
    example: {
      title: 'Status labels',
      description: 'The example pairs Queued, Passed, Needs review, and Failed with their corresponding tones.',
      code: `<UiBadge tone="info">Queued</UiBadge>\n<UiBadge tone="success">Passed</UiBadge>\n<UiBadge tone="warning">Needs review</UiBadge>\n<UiBadge tone="error">Failed</UiBadge>`,
    },
  },
  {
    category: 'Actions',
    slug: 'button',
    name: 'UiButton',
    title: 'Button',
    summary: 'Runs an action through a native button with loading and disabled states.',
    usage: [
      'Use one primary button for the main action in a region.',
      'For supporting actions, use secondary or ghost.',
      'Reserve danger for destructive actions.',
      'For navigation, use a link.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'When true, sets the native disabled attribute to prevent activation.' },
      { name: 'loading', required: false, type: 'boolean', default: 'false', description: 'When true, disables the button, sets aria-busy="true", and adds a spinner. The label remains visible.' },
      { name: 'size', required: false, type: "UiControlSize | 'compact' | 'default'", default: "'md'", description: 'Sets size styling. Prefer sm, md, or lg. Deprecated compact uses md minimum height with small text; default uses lg minimum height and text.' },
      { name: 'type', required: false, type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type. Set submit or reset explicitly when the button should perform that form action.' },
      { name: 'variant', required: false, type: "'primary' | 'secondary' | 'ghost' | 'danger' | 'text'", default: "'primary'", description: 'Sets visual emphasis. The text variant uses underlined text and replaces the size\'s minimum height and padding.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Action label, optionally with an icon. Loading does not replace this content.' },
    ],
    events: [
      { name: 'click', type: 'MouseEvent', description: 'Native MouseEvent from activation. Disabled and loading buttons prevent activation.' },
    ],
    example: {
      title: 'Supporting action',
      description: 'The secondary variant and sm size give Inspect evidence a compact, bordered appearance.',
      code: `<UiButton variant="secondary" size="sm">\n  Inspect evidence\n</UiButton>`,
    },
  },
  {
    category: 'Forms',
    slug: 'checkbox',
    name: 'UiCheckbox',
    title: 'Checkbox',
    summary: 'Presents a labelled checkbox for one independent boolean choice.',
    usage: [
      'Use UiCheckbox when users can turn an option on or off independently.',
      'For mutually exclusive choices, use UiSelect.',
      'Describe the enabled result in the default slot.',
      'Use its own label; UiField does not supply its control ID, help links, or invalid state.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Disables the checkbox, preventing user interaction.' },
      { name: 'modelValue', required: false, type: 'boolean', default: 'false', description: 'Controlled checked state, limited to true and false. Use v-model or handle update:modelValue to retain user changes.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the label text size, checkbox dimensions, spacing, and minimum row height.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible label beside the checkbox, inside its wrapping label element.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'boolean', description: 'Emits the next boolean checked state when the user toggles the checkbox.' },
    ],
    example: {
      title: 'Preference',
      description: 'Checking the box sets includeArchived to true. Clearing it sets includeArchived to false.',
      code: `<UiCheckbox v-model="includeArchived">\n  Include archived sessions\n</UiCheckbox>`,
    },
  },
  {
    category: 'Forms',
    slug: 'radio-card',
    name: 'UiRadioCard',
    title: 'Radio card',
    summary: 'Presents a selectable card with supporting content inside UiRadioCardGroup.',
    usage: [
      'Use UiRadioCard when descriptions or previews help users compare mutually exclusive options.',
      'Place each card inside UiRadioCardGroup.',
      'Give each card a unique value within its group.',
      'For simple text choices, use UiSelect.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents selection and keyboard focus. A disabled UiRadioCardGroup also disables this card.' },
      { name: 'value', required: true, type: 'string', description: 'Value written to the group\'s modelValue when selected. The card is checked when modelValue matches this string.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible label and supporting content inside the radio button. Keep interactive elements outside the card.' },
    ],
    events: [],
    example: {
      title: 'Theme option',
      description: 'The Dark card combines a title and supporting text in one selectable option.',
      code: `<UiRadioCardGroup v-model="scheme" aria-label="Color scheme">\n  <UiRadioCard value="dark">\n    <strong>Dark</strong>\n    <span>Use a dark interface.</span>\n  </UiRadioCard>\n</UiRadioCardGroup>`,
    },
  },
  {
    category: 'Forms',
    slug: 'radio-card-group',
    name: 'UiRadioCardGroup',
    title: 'Radio card group',
    summary: 'Coordinates selection and keyboard navigation for UiRadioCard options.',
    usage: [
      'Use this for mutually exclusive options with descriptions or previews. For simple text choices, use UiSelect.',
      'Give the group an accessible name with aria-label or aria-labelledby.',
      'Bind v-model to the selected value.',
      'Supply UiRadioCard children with unique values.',
      'Use arrow keys without modifiers to move focus and select enabled cards.',
      'Without modifiers, Home and End move focus to the first or last enabled card and select it. If that card already has focus, the key does nothing.',
      'Space selects the focused card. Enter does not select it.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Disables every card without clearing modelValue.' },
      { name: 'loop', required: false, type: 'boolean', default: 'true', description: 'Wraps arrow-key navigation at both ends when true. When false, navigation stops at the first or last enabled card.' },
      { name: 'modelValue', required: true, type: 'string', description: 'Selected card value for v-model. A value that matches no card leaves every card unchecked.' },
      { name: 'orientation', required: false, type: "'horizontal' | 'vertical'", description: 'Limits arrow keys to Left/Right for horizontal or Up/Down for vertical. Omit to allow both axes. Does not change the grid layout.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'UiRadioCard children displayed in a responsive grid. The slot receives no props.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emits the selected card\'s string value for v-model.' },
    ],
    example: {
      title: 'Color scheme',
      description: 'Selecting a color scheme writes system, light, or dark to scheme.',
      code: `<UiRadioCardGroup v-model="scheme" aria-label="Color scheme">\n  <UiRadioCard value="system">System</UiRadioCard>\n  <UiRadioCard value="light">Light</UiRadioCard>\n  <UiRadioCard value="dark">Dark</UiRadioCard>\n</UiRadioCardGroup>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'dialog',
    name: 'UiDialog',
    title: 'Dialog',
    summary: 'Displays a modal panel for a task that interrupts work on the page.',
    usage: [
      'Use a dialog when the user must complete or dismiss a task before returning to the page.',
      'Keep content that does not require an interruption on the page.',
      'Set open to true from your own trigger. Bind v-model:open so dismissal updates your state.',
      'Open the dialog from a focused control so focus can return to that control after dismissal.',
      'For tasks with actions, provide explicit controls in the footer slot.',
      'To resize the panel, pass class or style to UiDialog. These and other content attributes reach the dialog panel.',
    ],
    props: [
      { name: 'description', required: false, type: 'string', description: 'Supporting text beneath the title, linked through aria-describedby. Empty strings omit it. If omitted, pass :aria-describedby="undefined" to remove the unused reference.' },
      { name: 'open', required: true, type: 'boolean', description: 'Controls visibility. By default, the open dialog traps focus and its content unmounts when closed.' },
      { name: 'title', required: true, type: 'string', description: 'Visible heading that provides the dialog\'s accessible name. Supply a concise title that identifies the task.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Task content in the scrollable body below the header.' },
      { name: 'footer', type: 'unknown', description: 'Actions below the body. The footer appears only when this slot exists. Action buttons must update open to close the dialog.' },
    ],
    events: [
      { name: 'update:open', type: 'boolean', description: 'Requests an open-state change. The close button emits false. Escape and outside primary clicks also request dismissal unless prevented.' },
    ],
    example: {
      title: 'Confirmation',
      description: 'The body states what Remove will delete, with the destructive action in the footer.',
      code: `<UiDialog v-model:open="open" title="Remove theme">\n  This removes the saved theme.\n  <template #footer>\n    <UiButton variant="danger">Remove</UiButton>\n  </template>\n</UiDialog>`,
    },
  },
  {
    category: 'Forms',
    slug: 'field',
    name: 'UiField',
    title: 'Field',
    summary: 'Connects a visible label and help or error text to a form control.',
    usage: [
      'Wrap one UiInput, UiSelect, or UiSwitch in UiField to connect its label and message automatically.',
      'Inside UiField, UiSlider receives controlId and the message links. Name it with its label prop.',
      'Give each field a unique controlId.',
      'For a custom control, set its id to controlId and connect its accessibility attributes using the slot IDs.',
      'When a custom control has an error, set its aria-invalid attribute to "true" yourself.',
      'Use UiCheckbox with its own label; it does not receive UiField context.',
    ],
    props: [
      { name: 'controlId', required: true, type: 'string', description: 'Control ID and label target. Overrides id on nested UiInput, UiSelect, UiSlider, and UiSwitch.' },
      { name: 'description', required: false, type: 'string', description: 'Help text shown when nonempty and error is empty. Its ID is ${controlId}-description.' },
      { name: 'error', required: false, type: 'string', description: 'Nonempty text replaces description and marks supported controls invalid. Its ID is ${controlId}-error.' },
      { name: 'label', required: true, type: 'string', description: 'Visible label associated with controlId.' },
    ],
    slots: [
      { name: 'default', type: '{ descriptionId?: string; errorId?: string }', description: 'Control content. descriptionId supplies aria-describedby; errorId supplies aria-errormessage. Each ID is undefined when its message is absent.' },
    ],
    events: [],
    example: {
      title: 'Search field',
      description: 'The field labels the search input and links its help text without attributes on UiInput.',
      code: `<UiField\n  control-id="theme-search"\n  label="Search themes"\n  description="Search Open VSX by name."\n>\n  <UiInput v-model="query" type="search" />\n</UiField>`,
    },
  },
  {
    category: 'Forms',
    slug: 'input',
    name: 'UiInput',
    title: 'Input',
    summary: 'Provides a native input for a single line of text.',
    usage: [
      'For a visible label and automatic help or error links, place UiInput inside UiField.',
      'Outside UiField, provide a visible label associated with id.',
      'Choose type to match the expected text.',
      'Bind v-model to retain user edits.',
      'For choices from a fixed list, use UiSelect.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Disables the native input, preventing user editing.' },
      { name: 'id', required: false, type: 'string', description: 'Native input ID. Inside UiField, controlId replaces this value, even when id is set.' },
      { name: 'invalid', required: false, type: 'boolean', default: 'false', description: 'Sets aria-invalid="true" and applies the error border. A UiField error also marks the input invalid, even when invalid is false.' },
      { name: 'modelValue', required: false, type: 'string', default: "''", description: 'Text displayed in the input and bound through v-model.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the input height, text size, and horizontal padding.' },
      { name: 'type', required: false, type: "'text' | 'search' | 'email' | 'password' | 'url'", default: "'text'", description: 'Native input type. Every supported type uses a string modelValue.' },
    ],
    slots: [],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emits the current string value on each native input event.' },
    ],
    example: {
      title: 'Search input',
      description: 'Use type="search" for a text filter, such as the session search shown here.',
      code: `<UiInput\n  v-model="query"\n  type="search"\n  placeholder="Search sessions"\n/>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'progress',
    name: 'UiProgress',
    title: 'Progress',
    summary: 'Displays task progress as a bar with an accessible name.',
    usage: [
      'When the current value and total are known, pass them as value and max.',
      'When exact progress matters, show visible status text beside the bar.',
      'For a short rating, use UiScore.',
    ],
    props: [
      { name: 'label', required: true, type: 'string', description: 'Accessible name for the work, passed as aria-label. Does not add visible text.' },
      { name: 'max', required: true, type: 'number', description: 'Total represented by a full bar. Zero, negative values, NaN, and infinities use 100.' },
      { name: 'value', required: true, type: 'number | null', description: 'Current amount, clamped from 0 through the effective max. null, NaN, and infinities produce an empty, indeterminate bar without aria-valuenow.' },
    ],
    slots: [],
    events: [],
    example: {
      title: 'Import progress',
      description: 'The sample sets progress to 3 of 5, which fills 60% of the bar.',
      code: `<UiProgress\n  label="Theme import progress"\n  :value="3"\n  :max="5"\n/>`,
    },
  },
  {
    category: 'Forms',
    slug: 'segmented-control',
    name: 'UiSegmentedControl',
    title: 'Segmented control',
    summary: 'Picks one of two to five short options that apply at once, such as a view mode or color theme.',
    usage: [
      'Use a segmented control when every option fits in one row and choosing one takes effect immediately.',
      'For longer or unknown lists, use UiSelect. For choices that need descriptions, use UiRadioCardGroup.',
      'Each option is a button with aria-pressed inside a group named by label, and each button is a Tab stop.',
      'With iconOnly, pass an icon through the icon slot; each item label becomes the button name and tooltip.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Disables every option. An item can also set disabled on its own.' },
      { name: 'iconOnly', required: false, type: 'boolean', default: 'false', description: 'Hides the visible labels and uses them as each button\'s accessible name and tooltip.' },
      { name: 'items', required: true, type: 'readonly { value: string; label: string; disabled?: boolean }[]', description: 'The options, in display order.' },
      { name: 'label', required: true, type: 'string', description: 'Accessible name for the group.' },
      { name: 'modelValue', required: false, type: 'string', description: 'The pressed option\'s value, bound through v-model.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
    ],
    slots: [
      { name: 'icon', type: '{ item: UiSegmentedItem; pressed: boolean }', description: 'Icon shown before each label, or alone with iconOnly. Mark it aria-hidden.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emitted with an option\'s value when it is clicked.' },
    ],
    example: {
      title: 'View mode',
      description: 'The pressed option shows the current view.',
      code: `<UiSegmentedControl\n  v-model="view"\n  label="View"\n  :items="[\n    { value: 'list', label: 'List' },\n    { value: 'board', label: 'Board' },\n    { value: 'timeline', label: 'Timeline' },\n  ]"\n/>`,
    },
  },
  {
    category: 'Forms',
    slug: 'select',
    name: 'UiSelect',
    title: 'Select',
    summary: 'Provides a native select for choosing one string value from supplied options.',
    usage: [
      'Use UiSelect for a short list of known, mutually exclusive choices.',
      'When users must enter text outside the available options, use UiInput.',
      'For a visible label and automatic help or error links, place UiSelect inside UiField.',
      'Outside UiField, provide a visible label associated with id.',
      'Keep option labels concise.',
      'Bind v-model to retain user selections.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Disables the native select, preventing user selection.' },
      { name: 'id', required: false, type: 'string', description: 'Native select ID. Inside UiField, controlId replaces this value, even when id is set.' },
      { name: 'invalid', required: false, type: 'boolean', default: 'false', description: 'Sets aria-invalid="true" and applies the error border. A UiField error also marks the select invalid, even when invalid is false.' },
      { name: 'modelValue', required: false, type: 'string', default: "''", description: 'Selected option value bound through v-model. The empty default does not create a placeholder option.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the select height, text size, and horizontal padding.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Native option elements, optionally grouped in optgroup elements.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emits the selected string value on each native change event.' },
    ],
    example: {
      title: 'Status filter',
      description: 'For the unfiltered state, initialize status to "all". The "All statuses" option names that state.',
      code: `<UiSelect v-model="status">\n  <option value="all">All statuses</option>\n  <option value="failed">Failed</option>\n</UiSelect>`,
    },
  },
  {
    category: 'Forms',
    slug: 'slider',
    name: 'UiSlider',
    title: 'Slider',
    summary: 'Selects one number from a range with a draggable thumb.',
    usage: [
      'Use this for relative adjustments within a range. For exact numeric entry, use a native number input.',
      'Bind v-model to retain user changes.',
      'When precision matters, show the selected value beside the slider.',
      'Arrow keys move one step. Page Up, Page Down, and Shift with an arrow key move 10 steps.',
      'Home and End target min and max through the same step rounding.',
      'Inside UiField, the thumb inherits its description or error link. A field error also sets aria-invalid.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Blocks pointer and keyboard value changes and removes the thumb from the tab order.' },
      { name: 'id', required: false, type: 'string', description: 'Thumb ID. Inside UiField, controlId overrides this prop.' },
      { name: 'label', required: true, type: 'string', description: 'Accessible name assigned to the thumb through aria-label. Required even inside UiField. Does not render a visible label.' },
      { name: 'max', required: false, type: 'number', default: '100', description: 'Upper limit. Non-finite values or values at or below the effective min use effective min + 100.' },
      { name: 'min', required: false, type: 'number', default: '0', description: 'Lower limit. Non-finite values use 0.' },
      { name: 'modelValue', required: false, type: 'number', default: 'min', description: 'Current value for v-model. The display clamps finite values to the range and uses the effective min for missing or non-finite values. These adjustments neither emit updates nor snap to step.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the control\'s minimum height and thumb diameter.' },
      { name: 'step', required: false, type: 'number', default: '1', description: 'Value interval from min for pointer and keyboard changes. Changes snap to this interval, then clamp to the range. Non-finite, zero, or negative values use 1.' },
    ],
    slots: [],
    events: [
      { name: 'update:modelValue', type: 'number', description: 'Emits the new number during pointer or keyboard changes, including while dragging.' },
    ],
    example: {
      title: 'Threshold',
      description: 'The adjacent span adds the percentage suffix to threshold.',
      code: `<UiSlider\n  v-model="threshold"\n  label="Confidence threshold"\n/>\n<span>{{ threshold }}%</span>`,
    },
  },
  {
    category: 'Layout',
    slug: 'code-block',
    name: 'UiCodeBlock',
    title: 'Code block',
    summary: 'Displays source code with optional syntax highlighting and clipboard copying.',
    usage: [
      'Use variant="default" for source files. For short commands, use variant="compact".',
      'For highlighting, choose vue, ts, typescript, js, javascript, json, css, html, bash, sh, or shell.',
      'If copying fails or the clipboard API is unavailable, select the code to copy it manually.',
    ],
    props: [
      { name: 'code', required: true, type: 'string', description: 'Source text to display. The copy button copies this exact string, including whitespace and line endings.' },
      { name: 'language', required: false, type: 'string', default: "'text'", description: 'Language for highlighting and header text. Names ignore case and surrounding spaces. Unsupported languages or highlighting failures show plain text.' },
      { name: 'title', required: false, type: 'string', default: "''", description: 'Accessible code label and default header title. When empty, the header shows language and the accessible label becomes \'<language> code\'.' },
      { name: 'variant', required: false, type: "'default' | 'compact'", default: "'default'", description: 'Default places labels and actions above the code. Compact hides labels and places actions beside the code. Compact blocks use dark terminal colors and decorative \'$ \' prompts for bash, sh, shell, or text. Default blocks use them only for bash, sh, or shell with an empty title. Other blocks use the active theme\'s code colors.' },
      { name: 'copyable', required: false, type: 'boolean', default: 'true', description: 'Shows the copy button, which disables during copying. A live status message reports success or failure.' },
      { name: 'lineNumbers', required: false, type: 'boolean', default: 'false', description: 'Shows line numbers starting at 1 for line references. Numbers are hidden from assistive technology and omitted from clipboard copies.' },
      { name: 'wrap', required: false, type: 'boolean', default: 'false', description: 'Wraps long lines at the available width, including within words. When false, long lines scroll horizontally.' },
    ],
    slots: [
      { name: 'actions', type: 'unknown', description: 'Custom controls before the copy button. These remain available when copyable is false.' },
    ],
    events: [],
    example: {
      title: 'Copyable snippet',
      description: 'The first block labels a Vue snippet. The second shows a wrapped install command with an icon copy button.',
      code: `<UiCodeBlock
  title="Example.vue"
  language="vue"
  :code="snippet"
/>

<UiCodeBlock
  title="Install"
  language="sh"
  code="pnpm add @filipgutica/ui"
  variant="compact"
  wrap
/>`,
    },
  },
  {
    category: 'Layout',
    slug: 'card',
    name: 'UiCard',
    title: 'Card',
    summary: 'Groups one subject\'s content with optional title, action, and footer regions.',
    usage: [
      'Use UiCard when related content needs separate title, action, or footer regions.',
      'For a plain container without these regions, use UiSurface.',
      'Match titleTag to the page\'s heading hierarchy.',
      'In the title slot, supply heading content without another heading element.',
    ],
    props: [
      { name: 'title', required: false, type: 'string', description: 'Fallback heading text. An empty or omitted value creates no heading unless the title slot exists.' },
      { name: 'titleTag', required: false, type: "'h2' | 'h3' | 'h4' | 'h5' | 'h6'", default: "'h3'", description: 'Heading element for both the title prop and the title slot.' },
    ],
    slots: [
      { name: 'actions', type: 'unknown', description: 'Controls beside the heading. This slot also creates a header when no title is supplied.' },
      { name: 'default', type: 'unknown', description: 'Main content in the padded body. Without this slot, the card omits the body.' },
      { name: 'footer', type: 'unknown', description: 'Supporting metadata or actions below the body. Without this slot, the card omits the footer.' },
      { name: 'title', type: 'unknown', description: 'Custom content inside the titleTag heading. Takes precedence over the title prop when it renders content.' },
    ],
    events: [],
    example: {
      title: 'Session summary',
      description: 'The View action sits beside the title. The body holds session data, and the footer holds update metadata.',
      code: `<UiCard title="Session summary">\n  <template #actions>\n    <UiButton variant="ghost" size="sm">View</UiButton>\n  </template>\n  <p>12 tool calls across 4 turns.</p>\n  <template #footer>Updated just now</template>\n</UiCard>`,
    },
  },
  {
    category: 'Layout',
    slug: 'figure',
    name: 'UiFigure',
    title: 'Figure',
    summary: 'Places a visual in a scrollable frame with an optional caption and figure number.',
    usage: [
      'Use UiFigure for diagrams, tables, or interactive examples referenced by surrounding text.',
      'For separate title, action, and footer regions, use UiCard.',
      'When the text cites a figure number, set number to the same value.',
      'Add spacing around UiFigure in the surrounding layout. The component sets its outer margin to zero.',
    ],
    props: [
      { name: 'number', required: false, type: 'number', description: 'Prefixes the caption with \'Figure N.\' A defined value, including 0, creates a caption without the caption slot.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Content inside the frame. The frame accepts keyboard focus so users can scroll wide content horizontally.' },
      { name: 'caption', type: 'unknown', description: 'Caption below the frame and accessible name for its region. Without this slot or number, the caption is omitted and the region is named \'Figure\'.' },
    ],
    events: [],
    example: {
      title: 'Numbered figure',
      description: 'The example places a table above a numbered caption.',
      code: `<UiFigure :number="1">\n  <SafeguardTable />\n  <template #caption>\n    Each safeguard stops one problem before review.\n  </template>\n</UiFigure>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'score',
    name: 'UiScore',
    title: 'Score',
    summary: 'Displays a numeric rating beside a row of filled and empty pips.',
    usage: [
      'Place a short rating beside the item it describes.',
      'The pips are hidden from assistive technology; the visible score/max text carries the value.',
      'For work completed toward a total, use UiProgress.',
    ],
    props: [
      { name: 'max', required: false, type: 'number', default: '3', description: 'Number of pips and the text denominator. Values other than positive integers use 3.' },
      { name: 'score', required: true, type: 'number', description: 'Clamped from 0 through the effective max; NaN and infinities use 0. Fractions remain in the text, but only whole pips fill.' },
    ],
    slots: [],
    events: [],
    example: {
      title: 'Rating',
      description: 'With the default max of 3, :score="2" displays 2/3 and fills two pips.',
      code: `<UiScore :score="2" />`,
    },
  },
  {
    category: 'Forms',
    slug: 'switch',
    name: 'UiSwitch',
    title: 'Switch',
    summary: 'Turns a setting on or off with a standalone switch.',
    usage: 'Use a switch for an immediate on/off setting, such as email notifications. Supply a visible label through label, the default slot, or UiField. Space and Enter toggle the switch. Use UiToggleButton for a pressed card that changes surrounding content.',
    props: [
      { name: 'description', required: false, type: 'string', description: 'Visible help text connected with aria-describedby.' },
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'id', required: false, type: 'string', description: 'Control ID; inherited from UiField or generated when omitted.' },
      { name: 'label', required: false, type: 'string', description: 'Visible label; the default slot takes precedence. Required unless a slot or UiField supplies the label.' },
      { name: 'modelValue', required: false, type: 'boolean', default: 'false', description: 'The on/off state used by v-model.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible label, replacing the label prop.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'boolean', description: 'Emitted when the switch is toggled.' },
    ],
    example: {
      title: 'Email notifications',
      description: 'Keep the label stable as the setting changes.',
      code: `<UiSwitch\n  v-model="emailNotifications"\n  label="Email notifications"\n  description="Receive updates about your account."\n/>`,
    },
  },
  {
    category: 'Forms',
    slug: 'toggle-button',
    name: 'UiToggleButton',
    title: 'Toggle button',
    summary: 'Toggles a boolean option through a pressed button with a visual switch indicator.',
    usage: [
      'Use this for independent choices that change surrounding content. For mutually exclusive options, use UiRadioCardGroup.',
      'Bind v-model:pressed and update the surrounding content from that state.',
      'For related buttons, provide a container with role="group" and an accessible name.',
      'Space and Enter activate the focused button.',
    ],
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Disables pointer and keyboard activation without clearing pressed.' },
      { name: 'pressed', required: false, type: 'boolean', default: 'false', description: 'Controlled pressed state, exposed as aria-pressed. The button stays at this value until the parent updates it.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the button\'s minimum height and label font size.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible label inside the button.' },
      { name: 'description', type: 'unknown', description: 'Secondary text below the label. By default, both slots contribute to the button\'s accessible name.' },
    ],
    events: [
      { name: 'update:pressed', type: 'boolean', description: 'Emits the requested boolean state after activation.' },
    ],
    example: {
      title: 'Safeguard',
      description: 'The Tests with signal option stores its pressed state in testsEnabled.',
      code: `<UiToggleButton v-model:pressed="testsEnabled">\n  Tests with signal\n  <template #description>Pillar 3</template>\n</UiToggleButton>`,
    },
  },
]

export const componentDocBySlug = (slug: string): ComponentDoc | undefined =>
  componentDocs.find(component => component.slug === slug)
