import { Extension } from '@tiptap/core';

// ----------------------------------------------------------------------

/** The nodes the letter's stylesheet hangs classes off. */
const TARGET_TYPES = [
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'image',
  'table',
];

/**
 * Keeps the `class` attribute on letter markup.
 *
 * ProseMirror discards any attribute a node type has not declared, so without
 * this the classes the letter template styles — `letter-title`, `block-heading`,
 * `closing`, `enclosure` — would survive being loaded into the editor but vanish
 * the moment the author saved, quietly restyling a letter nobody had edited.
 */
const PreservedClass = Extension.create({
  name: 'preservedClass',

  addGlobalAttributes() {
    return [
      {
        types: TARGET_TYPES,
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

export default PreservedClass;
