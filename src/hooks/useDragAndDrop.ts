import { useCallback, useRef, useState } from "react";

import type { Element } from "~/types";

interface DragState {
  isDragging: boolean;
  draggedElement: Element | null;
  dragImageCreated: boolean;
}

interface DropZoneState {
  isOver: boolean;
  canDrop: boolean;
}

export interface UseDragAndDropReturn {
  // Drag handlers
  handleDragStart: (element: Element) => (e: React.DragEvent) => void;
  handleDragEnd: (e: React.DragEvent) => void;

  // Drop zone handlers
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (onDrop: (element: Element) => void) => (e: React.DragEvent) => void;

  // State
  dragState: DragState;
  dropZoneState: DropZoneState;

  // Utilities
  canAcceptDrop: (elementType?: Element['type']) => boolean;
  getDragOverClass: () => string;
  getDropZoneClass: () => string;
}

interface UseDragAndDropOptions {
  acceptedTypes?: Element['type'][];
  enableVisualFeedback?: boolean;
  onDragStart?: (element: Element) => void;
  onDragEnd?: () => void;
}

export const useDragAndDrop = (options: UseDragAndDropOptions = {}): UseDragAndDropReturn => {
  const {
    acceptedTypes,
    enableVisualFeedback = true,
    onDragStart,
    onDragEnd,
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    dragImageCreated: false,
  });

  const [dropZoneState, setDropZoneState] = useState<DropZoneState>({
    isOver: false,
    canDrop: false,
  });

  const dragCounterRef = useRef(0);

  const createDragImage = useCallback((element: Element, _originalTarget: HTMLElement) => {
    const dragImage = document.createElement('div');
    dragImage.className = 'drag-preview';
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      width: 280px;
      padding: 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
    `;

    const typeColors = {
      template: '#3b82f6',
      context: '#6b7280',
      example: '#059669',
      role: '#dc2626'
    };

    dragImage.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="
          background: ${typeColors[element.type]};
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        ">${element.type}</span>
        <span style="
          background: #f1f5f9;
          color: #475569;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
        ">/${element.trigger}</span>
      </div>
      <div style="font-weight: 600; margin-bottom: 4px; color: #1e293b;">${element.title}</div>
      <div style="color: #64748b; font-size: 12px; line-height: 1.4; max-height: 40px; overflow: hidden;">
        ${element.content.slice(0, 120)}${element.content.length > 120 ? '...' : ''}
      </div>
    `;

    document.body.appendChild(dragImage);
    return dragImage;
  }, []);

  const handleDragStart = useCallback((element: Element) => (e: React.DragEvent) => {
    try {
      // Set the transfer data
      e.dataTransfer.setData("application/json", JSON.stringify(element));
      e.dataTransfer.effectAllowed = "copy";

      // Create custom drag image
      if (enableVisualFeedback) {
        const dragImage = createDragImage(element, e.currentTarget as HTMLElement);
        e.dataTransfer.setDragImage(dragImage, 140, 40);

        // Clean up drag image after a delay
        setTimeout(() => {
          if (dragImage.parentNode) {
            dragImage.parentNode.removeChild(dragImage);
          }
        }, 100);
      }

      // Update drag state
      setDragState({
        isDragging: true,
        draggedElement: element,
        dragImageCreated: true,
      });

      // Add global drag style
      document.body.classList.add('dragging-element');

      // Call optional callback
      onDragStart?.(element);
    } catch (error) {
      console.error("Error in handleDragStart:", error);
    }
  }, [enableVisualFeedback, createDragImage]);

  const handleDragEnd = useCallback((_e: React.DragEvent) => {
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedElement: null,
      dragImageCreated: false,
    });

    // Reset drop zone state
    setDropZoneState({
      isOver: false,
      canDrop: false,
    });

    // Reset drag counter
    dragCounterRef.current = 0;

    // Cleanup any remaining drag images
    const existingPreviews = document.querySelectorAll('.drag-preview');
    existingPreviews.forEach(preview => {
      if (preview.parentNode) {
        preview.parentNode.removeChild(preview);
      }
    });

    // Remove global drag style
    document.body.classList.remove('dragging-element');

    // Call optional callback
    onDragEnd?.();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    // Set appropriate drop effect based on whether drop is allowed
    if (dropZoneState.canDrop) {
      e.dataTransfer.dropEffect = "copy";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }, [dropZoneState.canDrop]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;

    try {
      const data = e.dataTransfer.getData("application/json");
      let element: Element | null = null;

      if (data) {
        element = JSON.parse(data);
      }

      const canDrop = !acceptedTypes || !element || acceptedTypes.includes(element.type);

      setDropZoneState({
        isOver: true,
        canDrop,
      });
    } catch {
      // If we can't parse the data, assume it's not valid
      setDropZoneState({
        isOver: true,
        canDrop: false,
      });
    }
  }, [acceptedTypes]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;

    // Only reset state when all drag events have left
    if (dragCounterRef.current === 0) {
      setDropZoneState({
        isOver: false,
        canDrop: false,
      });
    }
  }, []);

  const handleDrop = useCallback((onDrop: (element: Element) => void) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) {
        console.warn("No data found in drop event");
        return;
      }

      const element: Element = JSON.parse(data);

      // Check if we accept this element type
      if (acceptedTypes && !acceptedTypes.includes(element.type)) {
        console.warn(`Element type ${element.type} not accepted`);
        return;
      }

      // Call the drop handler
      onDrop(element);
    } catch (error) {
      console.error("Error in handleDrop:", error);
    } finally {
      // Reset states
      dragCounterRef.current = 0;
      setDropZoneState({
        isOver: false,
        canDrop: false,
      });
    }
  }, [acceptedTypes]);

  const canAcceptDrop = useCallback((elementType?: Element['type']) => {
    if (!acceptedTypes) return true;
    if (!elementType) return true;
    return acceptedTypes.includes(elementType);
  }, [acceptedTypes]);

  const getDragOverClass = useCallback(() => {
    if (!dropZoneState.isOver) return '';
    return dropZoneState.canDrop
      ? 'drag-over-valid'
      : 'drag-over-invalid';
  }, [dropZoneState]);

  const getDropZoneClass = useCallback(() => {
    const baseClass = 'drop-zone';
    if (dragState.isDragging) {
      return `${baseClass} drag-active`;
    }
    return baseClass;
  }, [dragState.isDragging]);

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    dragState,
    dropZoneState,
    canAcceptDrop,
    getDragOverClass,
    getDropZoneClass,
  };
};