export const NOTES_EDITOR_STYLE_ID = 'notes-editor-styles'

export const NOTES_EDITOR_STYLE_CONTENT = `
  .notes-editor h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.5rem 0;
    color: inherit;
  }
  .notes-editor h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem 0;
    color: inherit;
  }
  .notes-editor h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.75rem 0 0.5rem 0;
    color: inherit;
  }
  .notes-editor p {
    margin: 0.5rem 0;
  }
  .notes-editor ul,
  .notes-editor ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  .notes-editor strong {
    font-weight: 700;
  }
  .notes-editor em {
    font-style: italic;
  }
  .notes-editor u {
    text-decoration: underline;
  }
  .notes-editor a {
    color: var(--color-primary);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .dark .notes-editor a {
    color: var(--color-accent);
  }
  .notes-editor a:hover {
    opacity: 0.85;
  }
`
