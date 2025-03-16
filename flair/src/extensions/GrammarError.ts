import { Mark, mergeAttributes } from '@tiptap/core';

export const GrammarError = Mark.create({
  name: 'grammarError',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'grammar-error',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.grammar-error',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});