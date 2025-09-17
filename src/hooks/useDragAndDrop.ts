import { useCallback, useRef, useState } from "react";
import type { Element } from "~/types";

interface DragState {
  isDragging: boolean;
  draggedElement: Element | null;
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
}

interface UseDragAndDropOptions {
  acceptedTypes?: Element['type'][];
  enableVisualFeedback?: boolean;
}

export const useDragAndDrop = (options: UseDragAndDropOptions = {}): UseDragAndDropReturn => {
  const {
    acceptedTypes,
    enableVisualFeedback = true,
  } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
  });

  const [dropZoneState, setDropZoneState] = useState<DropZoneState>({
    isOver: false,
    canDrop: false,
  });

  const dragCounterRef = useRef(0);

  const handleDragStart = useCallback((element: Element) => (e: React.DragEvent) => {
    try {
      // Set the transfer data
      e.dataTransfer.setData("application/json", JSON.stringify(element));
      e.dataTransfer.effectAllowed = "copy";

      // Update drag state
      setDragState({
        isDragging: true,
        draggedElement: element,
      });

      // Visual feedback
      if (enableVisualFeedback) {
        e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 0, 0);
      }
    } catch (error) {
      console.error("Error in handleDragStart:", error);
    }
  }, [enableVisualFeedback]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedElement: null,
    });

    // Reset drop zone state
    setDropZoneState({
      isOver: false,
      canDrop: false,
    });

    // Reset drag counter
    dragCounterRef.current = 0;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

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
    } catch (error) {
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
  };
};