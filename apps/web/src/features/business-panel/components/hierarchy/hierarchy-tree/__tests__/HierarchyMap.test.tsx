import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OrganizationNode } from '../../../../types/dynamicHierarchy.types';
import { HierarchyMap } from '../HierarchyMap';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const rootNode: OrganizationNode = {
  id: 'root-node',
  structure_id: 'structure-wheel-test',
  organization_id: 'organization-1',
  parent_id: null,
  name: 'General',
  type: 'root',
  properties: {},
  path: 'root-node',
  depth: 0,
  position: 0,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

describe('HierarchyMap wheel interaction', () => {
  it('zooms without propagating the wheel event to the page', () => {
    render(
      <HierarchyMap
        nodes={[rootNode]}
        structureId="structure-wheel-test"
        orgSlug="sof_lia"
        onAddChild={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        t={(key, options) => String(options?.defaultValue || key)}
      />,
    );

    const viewport = screen.getByTestId('hierarchy-map-viewport');
    const pageWheelListener = vi.fn();
    document.addEventListener('wheel', pageWheelListener);
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      clientY: 160,
      deltaY: -120,
    });
    let dispatchResult = true;

    act(() => {
      dispatchResult = viewport.dispatchEvent(wheelEvent);
    });

    document.removeEventListener('wheel', pageWheelListener);
    expect(dispatchResult).toBe(false);
    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(pageWheelListener).not.toHaveBeenCalled();
  });
});
