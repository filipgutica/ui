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
    summary: 'Opens a modal side panel with contained keyboard focus.',
    usage: 'Use a drawer for temporary navigation or supporting content. The trigger slot accepts one button. For page navigation, keep native navigation in the server-rendered page until hydration; the application decides when to replace it with the drawer and when to close the drawer at a desktop breakpoint. Content attributes are forwarded to the panel. To focus a link destination after the drawer closes, prevent closeAutoFocus and focus that heading instead of the trigger.',
    props: [
      { name: 'open', required: true, type: 'boolean', description: 'Controls whether the drawer is visible.' },
      { name: 'title', required: true, type: 'string', description: 'Visible, accessible drawer title.' },
    ],
    slots: [
      { name: 'trigger', type: 'unknown', description: 'Single button that opens the drawer and receives restored focus, when supplied.' },
      { name: 'default', type: 'unknown', description: 'Drawer content.' },
    ],
    events: [
      { name: 'update:open', type: 'boolean', description: 'Emitted when the drawer opens or closes.' },
      { name: 'closeAutoFocus', type: 'Event', description: 'Cancelable focus restoration event. Call preventDefault before focusing another destination.' },
    ],
    example: {
      title: 'Page navigation',
      description: 'Escape, the backdrop, and the close button dismiss the drawer.',
      code: `<UiDrawer v-model:open="open" title="Navigation">\n  <template #trigger>\n    <UiButton variant="secondary" size="lg">Menu</UiButton>\n  </template>\n  <nav aria-label="On this page">\n    <a href="#overview" @click="open = false">Overview</a>\n  </nav>\n</UiDrawer>`,
    },
  },
  {
    category: 'Layout',
    slug: 'tabs',
    name: 'UiTabs',
    title: 'Tabs',
    summary: 'Switches between related panels while retaining their content state.',
    usage: 'Supply unique item values and an accessible group label. The Left and Right arrow keys, Home, and End select tabs. SSR and the first hydration render show every labelled panel; after mounting, the tab controls appear and inactive panels are hidden. A tab strip narrower than its tabs scrolls, fades each clipped edge, and keeps the selected tab in view when it resizes. Keep page section headings outside the tabs when they are anchor destinations. If enhancement changes the page height, re-align an initial hash after layout settles.',
    props: [
      { name: 'items', required: true, type: 'readonly UiTabItem[]', description: 'Ordered items with a unique value and visible label.' },
      { name: 'label', required: true, type: 'string', description: 'Accessible name for the tab list.' },
      { name: 'modelValue', required: true, type: 'string', description: 'Selected item value. An absent value displays the first item.' },
    ],
    slots: [
      { name: 'panel', type: '{ value: string }', description: 'Content for each item. The panel remains mounted when inactive.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emitted when a tab is selected by pointer or keyboard.' },
    ],
    example: {
      title: 'Related captures',
      description: 'The panel slot receives the item value.',
      code: `<UiTabs\n  v-model="capture"\n  label="Process captures"\n  :items="[{ value: 'list', label: 'List' }, { value: 'details', label: 'Details' }]"\n>\n  <template #panel="{ value }">\n    <p v-if="value === 'list'">Process list capture</p>\n    <p v-else>Process details capture</p>\n  </template>\n</UiTabs>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'alert',
    name: 'UiAlert',
    title: 'Alert',
    summary: 'Communicates contextual status and important feedback.',
    usage: 'Use alerts for information that should remain visible near the work it affects. Danger and error tones announce immediately with an alert role; other tones use a polite status role.',
    props: [
      { name: 'tone', required: false, type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'", default: "'neutral'", description: 'Sets the semantic tone and announcement behavior.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Alert message and supporting content.' },
    ],
    events: [],
    example: {
      title: 'Import status',
      description: 'Keep the message specific and actionable.',
      code: `<UiAlert tone="success">\n  Theme imported successfully.\n</UiAlert>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'badge',
    name: 'UiBadge',
    title: 'Badge',
    summary: 'Labels compact state, category, or metadata.',
    usage: 'Use badges for short, scannable labels. Do not rely on color alone; the text should communicate the state.',
    props: [
      { name: 'tone', required: false, type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'", default: "'neutral'", description: 'Sets the semantic color treatment.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Short badge label.' },
    ],
    events: [],
    example: {
      title: 'Status labels',
      description: 'Use text and tone together so status never depends on color alone.',
      code: `<UiBadge tone="info">Queued</UiBadge>\n<UiBadge tone="success">Passed</UiBadge>\n<UiBadge tone="warning">Needs review</UiBadge>\n<UiBadge tone="error">Failed</UiBadge>`,
    },
  },
  {
    category: 'Actions',
    slug: 'button',
    name: 'UiButton',
    title: 'Button',
    summary: 'Triggers an action with clear visual priority and accessible loading and disabled states.',
    usage: 'Use one primary button for the main action in a region. Use secondary or ghost variants for supporting actions and danger only for destructive operations.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'loading', required: false, type: 'boolean', default: 'false', description: 'Disables the button and exposes aria-busy.' },
      { name: 'size', required: false, type: "UiControlSize | 'compact' | 'default'", default: "'md'", description: "Sets the shared control density. Use sm, md, or lg; compact and default are deprecated aliases retained for existing buttons." },
      { name: 'type', required: false, type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Sets the native button type.' },
      { name: 'variant', required: false, type: "'primary' | 'secondary' | 'ghost' | 'danger' | 'text'", default: "'primary'", description: 'Sets action emphasis.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Button label and optional icon.' },
    ],
    events: [
      { name: 'click', type: 'MouseEvent', description: 'Native click event when the button is enabled.' },
    ],
    example: {
      title: 'Supporting action',
      description: 'Use the secondary variant when the action is useful but not dominant.',
      code: `<UiButton variant="secondary" size="sm">\n  Inspect evidence\n</UiButton>`,
    },
  },
  {
    category: 'Forms',
    slug: 'checkbox',
    name: 'UiCheckbox',
    title: 'Checkbox',
    summary: 'Controls an independent boolean choice.',
    usage: 'Use a checkbox when the user can independently turn an option on or off. Keep the label beside the control and describe the result, not the implementation.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'modelValue', required: false, type: 'boolean', default: 'false', description: 'The checked state used by v-model.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible checkbox label.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'boolean', description: 'Emitted when the checked state changes.' },
    ],
    example: {
      title: 'Preference',
      description: 'Use v-model for the controlled boolean state.',
      code: `<UiCheckbox v-model="includeArchived">\n  Include archived sessions\n</UiCheckbox>`,
    },
  },
  {
    category: 'Forms',
    slug: 'radio-card',
    name: 'UiRadioCard',
    title: 'Radio card',
    summary: 'Presents one rich option inside a radio-card group.',
    usage: 'Use UiRadioCard inside UiRadioCardGroup when supporting content or a preview helps users compare mutually exclusive options. Use a select for simple text choices.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents this option from being selected.' },
      { name: 'value', required: true, type: 'string', description: 'Value selected by the parent group.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible option content.' },
    ],
    events: [],
    example: {
      title: 'Theme option',
      description: 'Pair the card with a group that owns the selected value.',
      code: `<UiRadioCardGroup v-model="scheme" aria-label="Color scheme">\n  <UiRadioCard value="dark">\n    <strong>Dark</strong>\n    <span>Use a dark interface.</span>\n  </UiRadioCard>\n</UiRadioCardGroup>`,
    },
  },
  {
    category: 'Forms',
    slug: 'radio-card-group',
    name: 'UiRadioCardGroup',
    title: 'Radio card group',
    summary: 'Owns the selected value and keyboard behavior for related radio cards.',
    usage: 'Use this group when exactly one rich option may be selected. Give it an accessible name and place UiRadioCard children inside it.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents every card from being selected.' },
      { name: 'loop', required: false, type: 'boolean', default: 'true', description: 'Loops arrow-key navigation from the last card to the first.' },
      { name: 'modelValue', required: true, type: 'string', description: 'Selected card value used by v-model.' },
      { name: 'orientation', required: false, type: "'horizontal' | 'vertical'", description: 'Restricts arrow-key navigation to one axis when the layout has a fixed orientation.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'UiRadioCard options.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emitted when the selected card changes.' },
    ],
    example: {
      title: 'Color scheme',
      description: 'The group provides native radio behavior across the cards.',
      code: `<UiRadioCardGroup v-model="scheme" aria-label="Color scheme">\n  <UiRadioCard value="system">System</UiRadioCard>\n  <UiRadioCard value="light">Light</UiRadioCard>\n  <UiRadioCard value="dark">Dark</UiRadioCard>\n</UiRadioCardGroup>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'dialog',
    name: 'UiDialog',
    title: 'Dialog',
    summary: 'Focuses attention on a short, interruptive task.',
    usage: 'Use dialogs for tasks that must be completed or dismissed before returning to the page. Provide a concise title, optional description, and explicit footer actions. Content attributes, including class and style, are forwarded to the dialog panel so applications can size larger content.',
    props: [
      { name: 'description', required: false, type: 'string', description: 'Optional supporting text linked to the dialog.' },
      { name: 'open', required: true, type: 'boolean', description: 'Controls whether the dialog is visible.' },
      { name: 'title', required: true, type: 'string', description: 'Accessible dialog title.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Dialog body.' },
      { name: 'footer', type: 'unknown', description: 'Footer actions.' },
    ],
    events: [
      { name: 'update:open', type: 'boolean', description: 'Emitted when the dialog opens or closes.' },
    ],
    example: {
      title: 'Confirmation',
      description: 'Keep the action and consequence visible together.',
      code: `<UiDialog v-model:open="open" title="Remove theme">\n  This removes the saved theme.\n  <template #footer>\n    <UiButton variant="danger">Remove</UiButton>\n  </template>\n</UiDialog>`,
    },
  },
  {
    category: 'Forms',
    slug: 'field',
    name: 'UiField',
    title: 'Field',
    summary: 'Groups a label, form control, help text, and validation error.',
    usage: 'Wrap UiInput or UiSelect in a field to connect its label and description automatically. Show either help text or an error so the current guidance is unambiguous.',
    props: [
      { name: 'controlId', required: true, type: 'string', description: 'ID supplied to the nested control and label.' },
      { name: 'description', required: false, type: 'string', description: 'Optional help text.' },
      { name: 'error', required: false, type: 'string', description: 'Validation error that replaces the description.' },
      { name: 'label', required: true, type: 'string', description: 'Visible control label.' },
    ],
    slots: [
      { name: 'default', type: '{ descriptionId?: string; errorId?: string }', description: 'Form control, with IDs available for custom controls.' },
    ],
    events: [],
    example: {
      title: 'Search field',
      description: 'The nested input receives the field accessibility relationships.',
      code: `<UiField\n  control-id="theme-search"\n  label="Search themes"\n  description="Search Open VSX by name."\n>\n  <UiInput v-model="query" type="search" />\n</UiField>`,
    },
  },
  {
    category: 'Forms',
    slug: 'input',
    name: 'UiInput',
    title: 'Input',
    summary: 'Collects a single line of text.',
    usage: 'Use an input inside UiField for a visible label and help or error relationship. Choose the native input type that matches the expected value.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents editing.' },
      { name: 'id', required: false, type: 'string', description: 'Native ID. Inside UiField, the field\'s controlId replaces it.' },
      { name: 'invalid', required: false, type: 'boolean', default: 'false', description: 'Marks the control invalid outside UiField.' },
      { name: 'modelValue', required: false, type: 'string', default: "''", description: 'Current value used by v-model.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
      { name: 'type', required: false, type: "'text' | 'search' | 'email' | 'password' | 'url'", default: "'text'", description: 'Native input type.' },
    ],
    slots: [],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emitted when the value changes.' },
    ],
    example: {
      title: 'Search input',
      description: 'Use the search type when filtering content.',
      code: `<UiInput\n  v-model="query"\n  type="search"\n  placeholder="Search sessions"\n/>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'progress',
    name: 'UiProgress',
    title: 'Progress',
    summary: 'Shows determinate progress toward completion.',
    usage: 'Use progress when both the current value and maximum are known. Supply a label that identifies the work for assistive technology.',
    props: [
      { name: 'label', required: true, type: 'string', description: 'Accessible name for the progress bar.' },
      { name: 'max', required: true, type: 'number', description: 'Maximum value.' },
      { name: 'value', required: true, type: 'number | null', description: 'Current value; null renders at zero.' },
    ],
    slots: [],
    events: [],
    example: {
      title: 'Import progress',
      description: 'Pair the bar with visible status text when exact progress matters.',
      code: `<UiProgress\n  label="Theme import progress"\n  :value="3"\n  :max="5"\n/>`,
    },
  },
  {
    category: 'Forms',
    slug: 'select',
    name: 'UiSelect',
    title: 'Select',
    summary: 'Chooses one value from a short, known set.',
    usage: 'Use a select when the available values are known and mutually exclusive. Put it inside UiField and keep option labels concise.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents selection.' },
      { name: 'id', required: false, type: 'string', description: 'Native ID. Inside UiField, the field\'s controlId replaces it.' },
      { name: 'invalid', required: false, type: 'boolean', default: 'false', description: 'Marks the control invalid outside UiField.' },
      { name: 'modelValue', required: false, type: 'string', default: "''", description: 'Selected value used by v-model.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Native option and optgroup elements.' },
    ],
    events: [
      { name: 'update:modelValue', type: 'string', description: 'Emitted when the selected value changes.' },
    ],
    example: {
      title: 'Status filter',
      description: 'Use a clear default option that describes the unfiltered state.',
      code: `<UiSelect v-model="status">\n  <option value="all">All statuses</option>\n  <option value="failed">Failed</option>\n</UiSelect>`,
    },
  },
  {
    category: 'Forms',
    slug: 'slider',
    name: 'UiSlider',
    title: 'Slider',
    summary: 'Lets users choose one numeric value from a bounded range.',
    usage: 'Use a slider when relative position within a range matters more than entering an exact number. Always provide an accessible label and show the current value when precision matters.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'id', required: false, type: 'string', description: 'Identifier applied to the slider thumb. Inherits the surrounding UiField control ID.' },
      { name: 'label', required: true, type: 'string', description: 'Accessible label for the slider thumb.' },
      { name: 'max', required: false, type: 'number', default: '100', description: 'Maximum selectable value. Invalid ranges fall back to 100 above min.' },
      { name: 'min', required: false, type: 'number', default: '0', description: 'Minimum selectable value. Non-finite values fall back to 0.' },
      { name: 'modelValue', required: false, type: 'number', default: 'min', description: 'Current value used by v-model; display is clamped to the configured range.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
      { name: 'step', required: false, type: 'number', default: '1', description: 'Positive amount for each arrow-key or pointer increment. Page Up, Page Down, and Shift with an arrow key move 10 steps. Invalid values fall back to 1.' },
    ],
    slots: [],
    events: [
      { name: 'update:modelValue', type: 'number', description: 'Emitted when the selected value changes.' },
    ],
    example: {
      title: 'Threshold',
      description: 'Pair the slider with a visible value when the exact selection matters.',
      code: `<UiSlider\n  v-model="threshold"\n  label="Confidence threshold"\n/>\n<span>{{ threshold }}%</span>`,
    },
  },
  {
    category: 'Layout',
    slug: 'code-block',
    name: 'UiCodeBlock',
    title: 'Code block',
    summary: 'Presents syntax-highlighted, copyable source code using the active theme.',
    usage: 'Set language to match the source so the code block can highlight it. Colors follow the active theme. Use line numbers when referencing specific lines; copying always preserves the original source. For repetitive short commands, set variant="compact" to place the copy action beside the code without repeated header labels. Add wrap when long commands should break onto another line.',
    props: [
      { name: 'code', required: true, type: 'string', description: 'Source text displayed in the code block.' },
      { name: 'language', required: false, type: 'string', default: "'text'", description: 'Language used for syntax highlighting and the header. Unknown languages render as plain text.' },
      { name: 'title', required: false, type: 'string', default: "''", description: 'Accessible code label. Also displayed in the default header.' },
      { name: 'variant', required: false, type: "'default' | 'compact'", default: "'default'", description: 'Default shows a labelled header. Compact places actions beside the code and keeps the title as an accessible label.' },
      { name: 'copyable', required: false, type: 'boolean', default: 'true', description: 'Shows the clipboard action.' },
      { name: 'lineNumbers', required: false, type: 'boolean', default: 'false', description: 'Shows line numbers beside the code.' },
      { name: 'wrap', required: false, type: 'boolean', default: 'false', description: 'Wraps long lines instead of requiring horizontal scrolling.' },
    ],
    slots: [
      { name: 'actions', type: 'unknown', description: 'Additional actions placed beside the copy button.' },
    ],
    events: [],
    example: {
      title: 'Copyable snippet',
      description: 'Use the default layout for source files and the compact layout for short commands.',
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
    summary: 'Groups related content and actions in a structured container.',
    usage: 'Use a card for one coherent subject. Put the heading in title, adjacent controls in actions, primary content in the default slot, and supporting metadata or actions in footer.',
    props: [
      { name: 'title', required: false, type: 'string', description: 'Simple card title; the title slot takes precedence.' },
      { name: 'titleTag', required: false, type: "'h2' | 'h3' | 'h4' | 'h5' | 'h6'", default: "'h3'", description: 'Heading level used for the card title.' },
    ],
    slots: [
      { name: 'actions', type: 'unknown', description: 'Controls aligned with the title.' },
      { name: 'default', type: 'unknown', description: 'Primary card content.' },
      { name: 'footer', type: 'unknown', description: 'Supporting metadata or footer actions.' },
      { name: 'title', type: 'unknown', description: 'Custom title content.' },
    ],
    events: [],
    example: {
      title: 'Session summary',
      description: 'Keep content and related actions in predictable regions.',
      code: `<UiCard title="Session summary">\n  <template #actions>\n    <UiButton variant="ghost" size="sm">View</UiButton>\n  </template>\n  <p>12 tool calls across 4 turns.</p>\n  <template #footer>Updated just now</template>\n</UiCard>`,
    },
  },
  {
    category: 'Layout',
    slug: 'figure',
    name: 'UiFigure',
    title: 'Figure',
    summary: 'Frames a visual on a quiet plate with a caption below.',
    usage: 'Use a figure for a diagram, table, or interactive example that the surrounding prose refers to. Set number when the text cites the figure. Wide content scrolls inside the plate instead of the page. The consumer owns the spacing around the figure.',
    props: [
      { name: 'number', required: false, type: 'number', description: 'Prefixes the caption with "Figure N." when set.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Plate content.' },
      { name: 'caption', type: 'unknown', description: 'Caption text shown below the plate.' },
    ],
    events: [],
    example: {
      title: 'Numbered figure',
      description: 'Cite the figure by number in the surrounding text.',
      code: `<UiFigure :number="1">\n  <SafeguardTable />\n  <template #caption>\n    Each safeguard stops one problem before review.\n  </template>\n</UiFigure>`,
    },
  },
  {
    category: 'Feedback',
    slug: 'score',
    name: 'UiScore',
    title: 'Score',
    summary: 'Shows a small score as filled pips beside its value.',
    usage: 'Use a score for a short rating, such as 2 of 3. The pips are decorative; the visible text, such as 2/3, is the accessible value. Out-of-range scores are clamped to 0 through max.',
    props: [
      { name: 'max', required: false, type: 'number', default: '3', description: 'Number of pips. Values that are not positive integers use 3.' },
      { name: 'score', required: true, type: 'number', description: 'Score shown by the filled pips and the text.' },
    ],
    slots: [],
    events: [],
    example: {
      title: 'Rating',
      description: 'Place the score next to the item it rates.',
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
    summary: 'Turns an option on or off with a pressed button and a switch indicator.',
    usage: 'Use a toggle button when a choice changes what the surrounding content shows. Put a group of toggle buttons in an element with role="group" and an accessible name. Space and Enter toggle the button. The label and the description both form its accessible name.',
    props: [
      { name: 'disabled', required: false, type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'pressed', required: false, type: 'boolean', default: 'false', description: 'The pressed state used by v-model:pressed.' },
      { name: 'size', required: false, type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the shared control density.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Visible label.' },
      { name: 'description', type: 'unknown', description: 'Short secondary text below the label, when supplied.' },
    ],
    events: [
      { name: 'update:pressed', type: 'boolean', description: 'Emitted when the pressed state changes.' },
    ],
    example: {
      title: 'Safeguard',
      description: 'Use v-model:pressed for the controlled state.',
      code: `<UiToggleButton v-model:pressed="testsEnabled">\n  Tests with signal\n  <template #description>Pillar 3</template>\n</UiToggleButton>`,
    },
  },
]

export const componentDocBySlug = (slug: string): ComponentDoc | undefined =>
  componentDocs.find(component => component.slug === slug)
