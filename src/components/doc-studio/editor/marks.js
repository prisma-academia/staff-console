import { Mark, Extension, mergeAttributes } from '@tiptap/core';

// ----------------------------------------------------------------------

/**
 * Marks a run of text as optional: at render time the whole run is dropped if
 * any variable inside it is empty — so "…fee of ₦25,000 on or before" never
 * trails off when a session has no deadline. The WYSIWYG form of `[[ … ]]`.
 *
 * A mark (not a node) so it can wrap part of a sentence and still hold bold
 * text and variable chips.
 */
export const OptionalMark = Mark.create({
  name: 'docOptional',

  parseHTML() {
    return [{ tag: 'span[data-optional]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-optional': 'true' }), 0];
  },

  addCommands() {
    return {
      toggleOptional:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

// ----------------------------------------------------------------------

/** The nodes the document stylesheet hangs classes off. */
const CLASS_TARGETS = ['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'image', 'table'];

/**
 * Keeps `class` on document markup. ProseMirror drops any attribute a node
 * type has not declared, so without this a migrated letter's `letter-title` or
 * `closing` paragraph would load fine and then lose its styling on first save.
 */
export const PreservedClass = Extension.create({
  name: 'preservedClass',

  addGlobalAttributes() {
    return [
      {
        types: CLASS_TARGETS,
        attributes: {
          class: {
            default: null,
            parseHTML: (element) => element.getAttribute('class') || null,
            renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
          },
        },
      },
    ];
  },
});

/**
 * Single-line fields (email subject, preheader) and SMS: Enter must not split
 * the paragraph in a subject line.
 */
export const SingleLine = Extension.create({
  name: 'singleLine',
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
      'Shift-Enter': () => true,
    };
  },
});
