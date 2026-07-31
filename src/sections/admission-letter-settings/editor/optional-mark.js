import { Mark, mergeAttributes } from '@tiptap/core';

// ----------------------------------------------------------------------

/**
 * Marks a run of text as optional — the WYSIWYG form of the `[[ ... ]]` syntax
 * the plain-text settings have always supported.
 *
 * At render time the server drops the whole run if any variable inside it is
 * empty, which is what stops "…acceptance fee of ₦25,000 on or before" from
 * trailing off when a session has no deadline configured.
 *
 * A mark rather than a node so it can wrap part of a sentence and still allow
 * bold/italic and variable chips inside it.
 */
const OptionalMark = Mark.create({
  name: 'letterOptional',

  parseHTML() {
    return [{ tag: 'span[data-optional]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-optional': 'true' }), 0];
  },

  addCommands() {
    return {
      setOptional:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      unsetOptional:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
      toggleOptional:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

export default OptionalMark;
