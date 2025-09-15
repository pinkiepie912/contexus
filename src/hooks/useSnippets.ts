import { useState, useEffect, useCallback } from 'react'

import { searchSnippets, getAllRoles } from '~/lib/messaging'
import type { Snippet, Role } from '~/types'

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load all roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const allRoles = await getAllRoles()
        setRoles(allRoles)
      } catch (error) {
        console.error('Failed to load roles:', error)
      }
    }
    loadRoles()
  }, [])

  // Search snippets with debouncing
  const searchSnippetsWithQuery = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const results = await searchSnippets(query, { limit: 50 })
      setSnippets(results.results)
    } catch (error) {
      console.error('Failed to search snippets:', error)
      setSnippets([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSnippetsWithQuery(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchSnippetsWithQuery])

  // Initial load of all snippets
  useEffect(() => {
    searchSnippetsWithQuery('')
  }, [searchSnippetsWithQuery])

  return {
    snippets,
    roles,
    loading,
    searchQuery,
    setSearchQuery,
    refreshSnippets: () => searchSnippetsWithQuery(searchQuery)
  }
}