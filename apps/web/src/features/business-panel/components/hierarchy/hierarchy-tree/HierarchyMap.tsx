'use client';

import {
  Building2,
  ExternalLink,
  Focus,
  Grid2X2,
  Hash,
  Layers3,
  MapPin,
  Minus,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrganizationNode } from '../../../types/dynamicHierarchy.types';
import { getHierarchyTypeLabel } from '../hierarchy-labels';
import styles from '../HierarchyExperience.module.css';
import type { BusinessTranslator } from './types';
import {
  calculateHierarchyMapLayout,
  getHierarchyMapBounds,
  type HierarchyMapPositions,
} from './hierarchy-map-layout';

interface HierarchyMapProps {
  nodes: OrganizationNode[];
  structureId: string;
  orgSlug?: string | null;
  onAddChild: (node: OrganizationNode) => void;
  onEdit: (node: OrganizationNode) => void;
  onDelete: (node: OrganizationNode) => void;
  t: BusinessTranslator;
}

interface MapViewport {
  x: number;
  y: number;
  zoom: number;
}

type MapViewportStyle = CSSProperties & {
  '--map-grid-size': string;
  '--map-grid-x': string;
  '--map-grid-y': string;
};

type Gesture = {
  pointerId: number;
  type: 'node' | 'pan';
  nodeId?: string;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

const MIN_ZOOM = 0.42;
const MAX_ZOOM = 1.8;
const FIT_PADDING = 150;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function iconForNodeType(type: string) {
  if (type === 'root') return Building2;
  if (type === 'region') return MapPin;
  if (type === 'zone') return Hash;
  if (type === 'team') return Users;
  if (type === 'area' || type === 'department') return Layers3;
  return Network;
}

function storageKey(structureId: string) {
  return `soflia:hierarchy-map:${structureId}:positions`;
}

function readStoredPositions(structureId: string, nodes: OrganizationNode[]): HierarchyMapPositions {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(structureId)) || '{}') as HierarchyMapPositions;
    const validIds = new Set(nodes.map((node) => node.id));
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, { x: number; y: number }] => {
        const [id, point] = entry;
        return validIds.has(id) && Number.isFinite(point?.x) && Number.isFinite(point?.y);
      }),
    );
  } catch {
    return {};
  }
}

export function HierarchyMap({
  nodes,
  structureId,
  orgSlug,
  onAddChild,
  onEdit,
  onDelete,
  t,
}: HierarchyMapProps) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const positionsRef = useRef<HierarchyMapPositions>({});
  const [positions, setPositions] = useState<HierarchyMapPositions>({});
  const [viewport, setViewport] = useState<MapViewport>({ x: 40, y: 40, zoom: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.id ?? null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) ?? null : null;
  const edges = useMemo(
    () => nodes.filter((node) => node.parent_id && nodeById.has(node.parent_id)),
    [nodeById, nodes],
  );

  const fitToPositions = useCallback((nextPositions: HierarchyMapPositions) => {
    const element = viewportRef.current;
    if (!element || Object.keys(nextPositions).length === 0) return;

    const rect = element.getBoundingClientRect();
    const bounds = getHierarchyMapBounds(nextPositions);
    const contentWidth = Math.max(180, bounds.maxX - bounds.minX + FIT_PADDING);
    const contentHeight = Math.max(180, bounds.maxY - bounds.minY + FIT_PADDING);
    const zoom = clampZoom(Math.min(rect.width / contentWidth, rect.height / contentHeight, 1.08));
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setViewport({
      zoom,
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
    });
  }, []);

  useEffect(() => {
    const automatic = calculateHierarchyMapLayout(nodes);
    const restored = readStoredPositions(structureId, nodes);
    const nextPositions = { ...automatic, ...restored };
    positionsRef.current = nextPositions;
    setPositions(nextPositions);
    setSelectedNodeId((current) => current && nodeById.has(current) ? current : nodes[0]?.id ?? null);

    const animationFrame = window.requestAnimationFrame(() => fitToPositions(nextPositions));
    return () => window.cancelAnimationFrame(animationFrame);
  }, [fitToPositions, nodeById, nodes, structureId]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    let animationFrame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => fitToPositions(positionsRef.current));
    });
    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [fitToPositions, structureId]);

  const persistPositions = useCallback((nextPositions: HierarchyMapPositions) => {
    try {
      window.localStorage.setItem(storageKey(structureId), JSON.stringify(nextPositions));
    } catch {
      // The map remains fully usable when storage is blocked by the browser.
    }
  }, [structureId]);

  const zoomAt = useCallback((nextZoom: number, anchorX?: number, anchorY?: number) => {
    const element = viewportRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const localX = anchorX ?? rect.width / 2;
    const localY = anchorY ?? rect.height / 2;

    setViewport((current) => {
      const zoom = clampZoom(nextZoom);
      const worldX = (localX - current.x) / current.zoom;
      const worldY = (localY - current.y) / current.zoom;
      return {
        zoom,
        x: localX - worldX * zoom,
        y: localY - worldY * zoom,
      };
    });
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    // React delegates wheel events to a passive root listener in modern
    // browsers. A native non-passive listener is required so preventDefault()
    // actually blocks the page from scrolling while the pointer is on the map.
    const handleWheelZoom = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = element.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const factor = event.deltaY < 0 ? 1.1 : 0.9;

      setViewport((current) => {
        const zoom = clampZoom(current.zoom * factor);
        const worldX = (localX - current.x) / current.zoom;
        const worldY = (localY - current.y) / current.zoom;
        return {
          zoom,
          x: localX - worldX * zoom,
          y: localY - worldY * zoom,
        };
      });
    };

    element.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => element.removeEventListener('wheel', handleWheelZoom);
  }, []);

  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a, [data-map-node]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      pointerId: event.pointerId,
      type: 'pan',
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
      moved: false,
    };
    setIsPanning(true);
  };

  const startNodeDrag = (event: ReactPointerEvent<HTMLDivElement>, nodeId: string) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    const point = positions[nodeId];
    if (!point) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedNodeId(nodeId);
    gestureRef.current = {
      pointerId: event.pointerId,
      type: 'node',
      nodeId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: point.x,
      originY: point.y,
      moved: false,
    };
    setDraggedNodeId(nodeId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startClientX;
    const deltaY = event.clientY - gesture.startClientY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) gesture.moved = true;

    if (gesture.type === 'pan') {
      setViewport((current) => ({
        ...current,
        x: gesture.originX + deltaX,
        y: gesture.originY + deltaY,
      }));
      return;
    }

    if (gesture.nodeId) {
      setSelectedNodeId(gesture.nodeId);
      setPositions((current) => {
        const nextPositions = {
          ...current,
          [gesture.nodeId as string]: {
            x: gesture.originX + deltaX / viewport.zoom,
            y: gesture.originY + deltaY / viewport.zoom,
          },
        };
        positionsRef.current = nextPositions;
        return nextPositions;
      });
    }
  };

  const finishGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (!gesture.moved) {
      setSelectedNodeId(gesture.type === 'node' ? gesture.nodeId ?? null : null);
    } else if (gesture.type === 'node') {
      persistPositions(positionsRef.current);
    }

    gestureRef.current = null;
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const resetLayout = () => {
    const automatic = calculateHierarchyMapLayout(nodes);
    positionsRef.current = automatic;
    setPositions(automatic);
    try {
      window.localStorage.removeItem(storageKey(structureId));
    } catch {
      // Ignore storage restrictions; the in-memory reset already succeeded.
    }
    fitToPositions(automatic);
  };

  const openSelectedNode = (node: OrganizationNode) => {
    router.push(orgSlug
      ? `/${orgSlug}/business-panel/hierarchy/node/${node.id}`
      : `/business-panel/hierarchy/node/${node.id}`);
  };

  const viewportStyle: MapViewportStyle = {
    '--map-grid-size': `${32 * viewport.zoom}px`,
    '--map-grid-x': `${viewport.x}px`,
    '--map-grid-y': `${viewport.y}px`,
  };

  return (
    <section className={styles.orgMapShell} aria-label={t('hierarchy.workspace.mapTitle', { defaultValue: 'Mapa interactivo de la organización' })}>
      <div className={styles.orgMapTopbar}>
        <div className={styles.orgMapHint}>
          <Grid2X2 aria-hidden="true" />
          <span>{t('hierarchy.workspace.mapHint', { defaultValue: 'Arrastra nodos para organizarlos · rueda para acercar' })}</span>
        </div>
        <div className={styles.orgMapZoomValue} aria-live="polite">
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>

      <div
        ref={viewportRef}
        data-testid="hierarchy-map-viewport"
        className={styles.orgMapViewport}
        data-panning={isPanning}
        style={viewportStyle}
        onPointerDown={startPan}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
      >
        <div
          className={styles.orgMapWorld}
          style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}
        >
          <svg className={styles.orgMapConnections} aria-hidden="true">
            {edges.map((node) => {
              const from = positions[node.parent_id as string];
              const to = positions[node.id];
              if (!from || !to) return null;
              const startX = from.x + 45;
              const endX = to.x - 45;
              const midpoint = startX + (endX - startX) / 2;
              return (
                <path
                  key={`${node.parent_id}-${node.id}`}
                  d={`M ${startX} ${from.y} C ${midpoint} ${from.y}, ${midpoint} ${to.y}, ${endX} ${to.y}`}
                  data-highlighted={selectedNodeId === node.id || selectedNodeId === node.parent_id}
                />
              );
            })}
          </svg>

          {nodes.map((node) => {
            const position = positions[node.id];
            if (!position) return null;
            const Icon = iconForNodeType(node.type);
            const selected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                data-map-node
                data-node-type={node.type}
                data-selected={selected}
                data-dragging={draggedNodeId === node.id}
                className={styles.orgMapNode}
                style={{ left: position.x, top: position.y }}
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${node.name}, ${getHierarchyTypeLabel(node.type, t)}`}
                onPointerDown={(event) => startNodeDrag(event, node.id)}
                onDoubleClick={() => openSelectedNode(node)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedNodeId(node.id);
                  }
                }}
              >
                <span className={styles.orgMapNodeHalo} aria-hidden="true" />
                <span className={styles.orgMapNodeCircle}>
                  <Icon aria-hidden="true" />
                  <span className={styles.orgMapNodeCount} aria-label={t('hierarchy.membersCount', { count: node.members_count || 0 })}>
                    {node.members_count || 0}
                  </span>
                </span>
                <span className={styles.orgMapNodeLabel}>
                  <strong>{node.name}</strong>
                  <small>{getHierarchyTypeLabel(node.type, t)}</small>
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.orgMapControls} aria-label={t('hierarchy.workspace.mapControls', { defaultValue: 'Controles del mapa' })}>
          <button type="button" onClick={() => zoomAt(viewport.zoom * 1.16)} aria-label={t('hierarchy.workspace.zoomIn', { defaultValue: 'Acercar' })}>
            <Plus aria-hidden="true" />
          </button>
          <button type="button" onClick={() => zoomAt(viewport.zoom / 1.16)} aria-label={t('hierarchy.workspace.zoomOut', { defaultValue: 'Alejar' })}>
            <Minus aria-hidden="true" />
          </button>
          <button type="button" onClick={() => fitToPositions(positions)} aria-label={t('hierarchy.workspace.fitMap', { defaultValue: 'Ver mapa completo' })}>
            <Focus aria-hidden="true" />
          </button>
          <button type="button" onClick={resetLayout} aria-label={t('hierarchy.workspace.resetMap', { defaultValue: 'Restablecer posiciones' })}>
            <RotateCcw aria-hidden="true" />
          </button>
        </div>

        {selectedNode ? (
          <aside className={styles.mapSelectionPanel} aria-label={t('hierarchy.workspace.selectedNode', { defaultValue: 'Nodo seleccionado' })}>
            <button
              type="button"
              className={styles.mapSelectionClose}
              onClick={() => setSelectedNodeId(null)}
              aria-label={t('hierarchy.workspace.closeNodePanel', { defaultValue: 'Cerrar detalle' })}
            >
              <X aria-hidden="true" />
            </button>
            <span className={styles.mapSelectionType}>{getHierarchyTypeLabel(selectedNode.type, t)}</span>
            <h3>{selectedNode.name}</h3>
            <div className={styles.mapSelectionMeta}>
              <span><Users aria-hidden="true" />{t('hierarchy.membersCount', { count: selectedNode.members_count || 0 })}</span>
              <span><User aria-hidden="true" />{selectedNode.manager?.first_name || t('hierarchy.workspace.noManager', { defaultValue: 'Sin responsable' })}</span>
            </div>
            <div className={styles.mapSelectionActions}>
              <button type="button" onClick={() => openSelectedNode(selectedNode)}>
                <ExternalLink aria-hidden="true" />
                <span>{t('hierarchy.workspace.openNode', { defaultValue: 'Abrir' })}</span>
              </button>
              <button type="button" onClick={() => onAddChild(selectedNode)}>
                <Plus aria-hidden="true" />
                <span>{t('hierarchy.addSubLevel')}</span>
              </button>
              <button type="button" onClick={() => onEdit(selectedNode)} aria-label={t('hierarchy.workspace.editNode', { defaultValue: 'Editar nodo' })}>
                <Pencil aria-hidden="true" />
              </button>
              <button
                type="button"
                data-danger="true"
                onClick={() => {
                  setSelectedNodeId(null);
                  onDelete(selectedNode);
                }}
                aria-label={t('hierarchy.workspace.deleteNode', { defaultValue: 'Eliminar nodo' })}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
