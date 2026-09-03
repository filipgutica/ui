export interface ApiItem {
  name: string
  type: string
  default?: string
  description: string
}

export interface ComponentDoc {
  category: 'Actions' | 'Forms' | 'Feedback' | 'Layout'
  slug: string
  name: string
  title: string
  summary: string
  usage: string
  props: ApiItem[]
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
    category: 'Feedback',
    slug: 'alert',
    name: 'UiAlert',
    title: 'Alert',
    summary: 'Communicates contextual status and important feedback.',
    usage: 'Use alerts for information that should remain visible near the work it affects. Danger and error tones announce immediately with an alert role; other tones use a polite status role.',
    props: [
      { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'error'", default: "'neutral'", description: 'Sets the semantic tone and announcement behavior.' },
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
      { name: 'tone', type: "'neutral' | 'info' | 'success' | 'warning' | 'danger'", default: "'neutral'", description: 'Sets the semantic color treatment.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Short badge label.' },
    ],
    events: [],
    example: {
      title: 'Status label',
      description: 'Pair the tone with an explicit label.',
      code: `<UiBadge tone="warning">Needs review</UiBadge>`,
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
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'loading', type: 'boolean', default: 'false', description: 'Disables the button and exposes aria-busy.' },
      { name: 'size', type: "'default' | 'compact'", default: "'default'", description: 'Sets the control height and spacing.' },
      { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Sets the native button type.' },
      { name: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'danger' | 'text'", default: "'primary'", description: 'Sets action emphasis.' },
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
      code: `<UiButton variant="secondary" size="compact">\n  Inspect evidence\n</UiButton>`,
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
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents interaction.' },
      { name: 'modelValue', type: 'boolean', default: 'false', description: 'The checked state used by v-model.' },
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
    category: 'Feedback',
    slug: 'dialog',
    name: 'UiDialog',
    title: 'Dialog',
    summary: 'Focuses attention on a short, interruptive task.',
    usage: 'Use dialogs for tasks that must be completed or dismissed before returning to the page. Provide a concise title, optional description, and explicit footer actions.',
    props: [
      { name: 'description', type: 'string', description: 'Optional supporting text linked to the dialog.' },
      { name: 'open', type: 'boolean', description: 'Controls whether the dialog is visible.' },
      { name: 'title', type: 'string', description: 'Accessible dialog title.' },
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
      { name: 'controlId', type: 'string', description: 'ID supplied to the nested control and label.' },
      { name: 'description', type: 'string', description: 'Optional help text.' },
      { name: 'error', type: 'string', description: 'Validation error that replaces the description.' },
      { name: 'label', type: 'string', description: 'Visible control label.' },
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
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents editing.' },
      { name: 'id', type: 'string', description: 'Native ID; inherited from UiField when omitted.' },
      { name: 'invalid', type: 'boolean', default: 'false', description: 'Marks the control invalid outside UiField.' },
      { name: 'modelValue', type: 'string', default: "''", description: 'Current value used by v-model.' },
      { name: 'type', type: "'text' | 'search' | 'email' | 'password' | 'url'", default: "'text'", description: 'Native input type.' },
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
      { name: 'label', type: 'string', description: 'Accessible name for the progress bar.' },
      { name: 'max', type: 'number', description: 'Maximum value.' },
      { name: 'value', type: 'number | null', description: 'Current value; null renders at zero.' },
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
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Prevents selection.' },
      { name: 'id', type: 'string', description: 'Native ID; inherited from UiField when omitted.' },
      { name: 'invalid', type: 'boolean', default: 'false', description: 'Marks the control invalid outside UiField.' },
      { name: 'modelValue', type: 'string', default: "''", description: 'Selected value used by v-model.' },
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
    category: 'Layout',
    slug: 'surface',
    name: 'UiSurface',
    title: 'Surface',
    summary: 'Groups related content with restrained visual structure.',
    usage: 'Use surfaces when a meaningful content group needs a boundary. Avoid nesting many surfaces; spacing and headings are often enough.',
    props: [
      { name: 'as', type: 'string', default: "'section'", description: 'Rendered HTML element or component.' },
      { name: 'padding', type: "'none' | 'compact' | 'default'", default: "'default'", description: 'Internal spacing.' },
    ],
    slots: [
      { name: 'default', type: 'unknown', description: 'Grouped content.' },
    ],
    events: [],
    example: {
      title: 'Summary panel',
      description: 'Use a heading to make the region easy to scan.',
      code: `<UiSurface as="section" padding="compact">\n  <h2>Session summary</h2>\n  <p>12 tool calls across 4 turns.</p>\n</UiSurface>`,
    },
  },
]

export const componentDocBySlug = (slug: string): ComponentDoc | undefined =>
  componentDocs.find(component => component.slug === slug)
