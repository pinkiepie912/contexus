import { useEffect, useMemo, useRef } from "react";

import { useElementStore } from "~/stores/elementStore";
import type { SearchElementsPayload } from "~/types";

export function useElements(filters?: SearchElementsPayload) {
  // Use a single stable selector to prevent subscription issues
  const storeState = useElementStore();
  const {
    elements,
    orderedIds,
    templates,
    loading,
    error,
    total,
    hasMore,
    // _lastQuery: lastQuery,
    initialize,
    search,
    refreshTemplates
  } = storeState;

  useEffect(() => {
    initialize().catch((err) => {
      console.error("Failed to initialize element store", err);
    });
  }, []); // 초기화는 컴포넌트 마운트 시 한 번만 실행

  const filtersKey = useMemo(() => (filters ? JSON.stringify(filters) : null), [filters]);
  const latestFiltersRef = useRef<SearchElementsPayload | undefined>(filters);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters, filtersKey]);

  useEffect(() => {
    if (!filtersKey || !latestFiltersRef.current) return;
    search(latestFiltersRef.current).catch((err) => {
      console.error("Failed to search elements", err);
    });
  }, [filtersKey]); // search는 의존성에서 제거

  const searchElements = async (filters: SearchElementsPayload) => {
    await search(filters);
    // Return the results from the store after search completes
    const state = storeState;
    return {
      results: state.orderedIds.map(id => state.elements[id]).filter(Boolean),
      total: state.total,
      hasMore: state.hasMore,
    };
  };

  return {
    elements,
    orderedIds,
    templates,
    loading: loading,
    isLoading: loading,
    error,
    total,
    hasMore,
    refreshTemplates,
    searchElements,
  };
}
