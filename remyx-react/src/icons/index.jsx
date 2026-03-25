import React from 'react'
import { icon, filled } from './helpers.jsx'

export const BoldIcon = filled(
  <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
)

export const ItalicIcon = icon(
  <>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </>
)

export const UnderlineIcon = icon(
  <>
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </>
)

export const StrikethroughIcon = icon(
  <>
    <path d="M16 4H9a3 3 0 0 0-3 3c0 2 1.5 3 4 3.5" />
    <path d="M14 16.5c0 1.38-1.12 2.5-2.5 2.5H9" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </>
)

export const SubscriptIcon = filled(
  <>
    <text x="2" y="16" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none">x</text>
    <text x="14" y="20" fontSize="10" fill="currentColor" stroke="none">2</text>
  </>
)

export const SuperscriptIcon = filled(
  <>
    <text x="2" y="18" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none">x</text>
    <text x="14" y="10" fontSize="10" fill="currentColor" stroke="none">2</text>
  </>
)

export const HeadingIcon = filled(
  <>
    <path d="M6 4v16M18 4v16M6 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>
)

export const AlignLeftIcon = icon(
  <>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="18" y2="18" />
  </>
)

export const AlignCenterIcon = icon(
  <>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </>
)

export const AlignRightIcon = icon(
  <>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="6" y1="18" x2="21" y2="18" />
  </>
)

export const AlignJustifyIcon = icon(
  <>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </>
)

export const OrderedListIcon = icon(
  <>
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <text x="4" y="7.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">1.</text>
    <text x="4" y="13.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">2.</text>
    <text x="4" y="19.5" fontSize="6" fill="currentColor" stroke="none" fontWeight="bold">3.</text>
  </>
)

export const UnorderedListIcon = icon(
  <>
    <line x1="9" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="9" y1="18" x2="21" y2="18" />
    <circle cx="5" cy="6" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5" cy="18" r="1.5" fill="currentColor" stroke="none" />
  </>
)

export const TaskListIcon = icon(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <line x1="13" y1="6" x2="21" y2="6" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <line x1="13" y1="18" x2="21" y2="18" />
    <polyline points="5.5 5.5 6.5 7 8.5 4" strokeWidth="1.5" />
  </>
)

export const LinkIcon = icon(
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>
)

export const UnlinkIcon = icon(
  <>
    <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 .12 7.19" />
    <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0-.12-7.19" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </>
)

export const ImageIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </>
)

export const TableIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </>
)

export const BlockquoteIcon = filled(
  <>
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </>
)

export const CodeBlockIcon = icon(
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </>
)

export const HorizontalRuleIcon = icon(
  <line x1="3" y1="12" x2="21" y2="12" strokeWidth="3" />
)

export const UndoIcon = icon(
  <>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </>
)

export const RedoIcon = icon(
  <>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </>
)

export const ForeColorIcon = ({ size = 18, color = '#000000', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`rmx-icon ${className}`}>
    <text x="6" y="16" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none">A</text>
    <rect x="3" y="20" width="18" height="3" rx="1" fill={color} />
  </svg>
)

export const BackColorIcon = ({ size = 18, color = '#ffff00', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`rmx-icon ${className}`}>
    <rect x="2" y="2" width="20" height="16" rx="2" fill={color} opacity="0.3" />
    <text x="6" y="14" fontSize="14" fontWeight="bold" fill="currentColor" stroke="none">A</text>
    <rect x="3" y="20" width="18" height="3" rx="1" fill={color} />
  </svg>
)

export const FontFamilyIcon = filled(
  <text x="3" y="18" fontSize="18" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="serif">T</text>
)

export const FontSizeIcon = filled(
  <>
    <text x="1" y="20" fontSize="20" fontWeight="bold" fill="currentColor" stroke="none">A</text>
    <text x="14" y="20" fontSize="12" fill="currentColor" stroke="none">A</text>
  </>
)

export const EmbedMediaIcon = icon(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polygon points="10 9 15 12 10 15" fill="currentColor" stroke="none" />
  </>
)

export const FindReplaceIcon = icon(
  <>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </>
)

export const SourceModeIcon = icon(
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
    <line x1="14" y1="4" x2="10" y2="20" strokeWidth="1" />
  </>
)

export const FullscreenIcon = icon(
  <>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </>
)

export const ExitFullscreenIcon = icon(
  <>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </>
)

export const IndentIcon = icon(
  <>
    <line x1="21" y1="6" x2="11" y2="6" />
    <line x1="21" y1="12" x2="11" y2="12" />
    <line x1="21" y1="18" x2="11" y2="18" />
    <polyline points="3 8 7 12 3 16" />
  </>
)

export const OutdentIcon = icon(
  <>
    <line x1="21" y1="6" x2="11" y2="6" />
    <line x1="21" y1="12" x2="11" y2="12" />
    <line x1="21" y1="18" x2="11" y2="18" />
    <polyline points="7 8 3 12 7 16" />
  </>
)

export const ExportIcon = icon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
)

export const CommandPaletteIcon = icon(
  <>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </>
)

export const ToggleMarkdownIcon = filled(
  <>
    <path d="M3 5h18v14H3V5zm2 2v10h14V7H5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 15V9l2.5 3L12 9v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 15l-2-2.5V15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 12.5V9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </>
)

export const ImportDocumentIcon = icon(
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 12 15 15" />
  </>
)

export const AttachmentIcon = icon(
  <>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </>
)

export const RemoveFormatIcon = icon(
  <>
    <path d="M8 4h8l-2 8" />
    <path d="M5 12l-1 4h6" />
    <line x1="3" y1="20" x2="21" y2="20" strokeWidth="1.5" />
    <line x1="16" y1="4" x2="10" y2="16" strokeWidth="1.5" opacity="0.5" strokeDasharray="2 2" />
  </>
)

export const CloseIcon = icon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
)

export const ChevronDownIcon = icon(
  <polyline points="6 9 12 15 18 9" />
)

export const ChevronRightIcon = icon(
  <polyline points="9 6 15 12 9 18" />
)

export const CheckIcon = icon(
  <polyline points="20 6 9 17 4 12" />
)

export const TrashIcon = icon(
  <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </>
)

// Plugin feature icons
export const CalloutIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
    <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
  </>
)

export const MathIcon = filled(
  <>
    <text x="2" y="18" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none" fontStyle="italic" fontFamily="serif">f</text>
    <text x="10" y="14" fontSize="12" fill="currentColor" stroke="none">(x)</text>
  </>
)

export const TocIcon = icon(
  <>
    <line x1="3" y1="6" x2="5" y2="6" strokeWidth="2" />
    <line x1="8" y1="6" x2="18" y2="6" />
    <line x1="5" y1="12" x2="7" y2="12" strokeWidth="2" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <line x1="5" y1="18" x2="7" y2="18" strokeWidth="2" />
    <line x1="10" y1="18" x2="17" y2="18" />
  </>
)

export const BookmarkIcon = icon(
  <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4-7 4V3a1 1 0 0 1 1-1z" />
)

export const MergeTagIcon = icon(
  <>
    <path d="M7 8l-4 4 4 4" />
    <path d="M17 8l4 4-4 4" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </>
)

export const SpellcheckIcon = icon(
  <>
    <text x="2" y="15" fontSize="14" fontWeight="bold" fill="currentColor" stroke="none">ABC</text>
    <polyline points="16 18 18 20 22 14" strokeWidth="2.5" />
  </>
)

export const AnalyticsIcon = icon(
  <>
    <rect x="3" y="14" width="4" height="7" rx="1" />
    <rect x="10" y="9" width="4" height="12" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" />
  </>
)

export const CommentIcon = icon(
  <>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </>
)

export const RemoveFormatIcon2 = icon(
  <>
    <path d="M6 4h12l-4 16" />
    <line x1="2" y1="21" x2="22" y2="3" strokeWidth="2" />
  </>
)

export const CollaborationIcon = icon(
  <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
)

// UX feature icons
export const DistractionFreeIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </>
)

export const SplitViewIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </>
)

export const ICON_MAP = {
  bold: BoldIcon,
  italic: ItalicIcon,
  underline: UnderlineIcon,
  strikethrough: StrikethroughIcon,
  subscript: SubscriptIcon,
  superscript: SuperscriptIcon,
  heading: HeadingIcon,
  headings: HeadingIcon,
  alignLeft: AlignLeftIcon,
  alignCenter: AlignCenterIcon,
  alignRight: AlignRightIcon,
  alignJustify: AlignJustifyIcon,
  orderedList: OrderedListIcon,
  unorderedList: UnorderedListIcon,
  taskList: TaskListIcon,
  link: LinkIcon,
  insertLink: LinkIcon,
  unlink: UnlinkIcon,
  image: ImageIcon,
  insertImage: ImageIcon,
  table: TableIcon,
  insertTable: TableIcon,
  blockquote: BlockquoteIcon,
  codeBlock: CodeBlockIcon,
  horizontalRule: HorizontalRuleIcon,
  undo: UndoIcon,
  redo: RedoIcon,
  foreColor: ForeColorIcon,
  backColor: BackColorIcon,
  fontFamily: FontFamilyIcon,
  fontSize: FontSizeIcon,
  embedMedia: EmbedMediaIcon,
  findReplace: FindReplaceIcon,
  sourceMode: SourceModeIcon,
  fullscreen: FullscreenIcon,
  exitFullscreen: ExitFullscreenIcon,
  indent: IndentIcon,
  outdent: OutdentIcon,
  removeFormat: RemoveFormatIcon,
  close: CloseIcon,
  chevronDown: ChevronDownIcon,
  check: CheckIcon,
  trash: TrashIcon,
  attachment: AttachmentIcon,
  insertAttachment: AttachmentIcon,
  importDocument: ImportDocumentIcon,
  toggleMarkdown: ToggleMarkdownIcon,
  export: ExportIcon,
  commandPalette: CommandPaletteIcon,
  // Plugin feature icons
  insertCallout: CalloutIcon,
  callout: CalloutIcon,
  insertMath: MathIcon,
  math: MathIcon,
  insertToc: TocIcon,
  toc: TocIcon,
  insertBookmark: BookmarkIcon,
  bookmark: BookmarkIcon,
  insertMergeTag: MergeTagIcon,
  mergeTag: MergeTagIcon,
  analytics: AnalyticsIcon,
  getAnalytics: AnalyticsIcon,
  toggleAnalytics: AnalyticsIcon,
  // Spellcheck icons
  spellcheck: SpellcheckIcon,
  toggleSpellcheck: SpellcheckIcon,
  checkGrammar: SpellcheckIcon,
  // Comment & format icons
  addComment: CommentIcon,
  comment: CommentIcon,
  // Collaboration icons
  collaboration: CollaborationIcon,
  startCollaboration: CollaborationIcon,
  stopCollaboration: CollaborationIcon,
  // UX feature icons
  distractionFree: DistractionFreeIcon,
  splitView: SplitViewIcon,
  toggleSplitView: SplitViewIcon,
}
