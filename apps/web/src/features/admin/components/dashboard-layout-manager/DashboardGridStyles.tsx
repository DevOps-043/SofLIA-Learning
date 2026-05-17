const GRID_LAYOUT_CSS = `
.react-grid-layout {
  position: relative;
}
.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
}
.react-grid-item.cssTransforms {
  transition-property: transform, width, height;
}
.react-grid-item.resizing {
  transition: none;
  z-index: 1;
  will-change: width, height;
}
.react-grid-item.react-draggable-dragging {
  transition: none;
  z-index: 3;
  will-change: transform;
}
.react-grid-item.dropping {
  visibility: hidden;
}
.react-grid-item.react-grid-placeholder {
  background: var(--color-accent);
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  user-select: none;
  border-radius: 0.5rem;
}
.react-grid-item > .react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  cursor: se-resize;
}
.react-grid-item > .react-resizable-handle::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-right: 2px solid var(--color-gray-500);
  border-bottom: 2px solid var(--color-gray-500);
}
`;

export function DashboardGridStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GRID_LAYOUT_CSS }} />;
}
