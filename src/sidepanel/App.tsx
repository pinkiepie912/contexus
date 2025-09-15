import React, { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Select } from '~/components/ui/select'
import { useToast } from '~/components/ui/toast'
import { useSnippets } from '~/hooks/useSnippets'
import type { Snippet, Role } from '~/types'

/**
 * Snippet Card Component
 * Displays individual snippet with role selection and copy functionality
 */
function SnippetCard({
  snippet,
  roles,
  onCopyPrompt
}: {
  snippet: Snippet
  roles: Role[]
  onCopyPrompt: (snippet: Snippet, role: Role | null) => void
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')

  const handleCopyPrompt = () => {
    const selectedRole = selectedRoleId ? roles.find(r => r.id === selectedRoleId) || null : null
    onCopyPrompt(snippet, selectedRole)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getPlatformBadgeColor = (platform: string | undefined) => {
    switch (platform) {
      case 'openai': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'gemini': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'claude': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {snippet.title || 'Untitled Snippet'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                getPlatformBadgeColor(snippet.platform)
              }`}>
                {(snippet.platform || 'unknown').toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(snippet.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="line-clamp-3 text-xs mb-3">
          {snippet.content}
        </CardDescription>

        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {snippet.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Role Selection and Copy */}
        <div className="space-y-2">
          <Select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="text-xs"
          >
            <option value="">Select a role (optional)</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name} - {role.category}
              </option>
            ))}
          </Select>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={handleCopyPrompt}
            >
              Copy Prompt
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => navigator.clipboard.writeText(snippet.content)}
            >
              Copy Text
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Main Side Panel Application
 * Implements Feature 5 from PRD: Side Panel UI development
 */
function App() {
  const { snippets, roles, loading, searchQuery, setSearchQuery } = useSnippets()
  const { showToast } = useToast()

  /**
   * Handle copying prompt with role application
   * Implements Task 5.3: Role application and prompt generation/copy
   */
  const handleCopyPrompt = async (snippet: Snippet, role: Role | null) => {
    try {
      let finalPrompt = snippet.content

      if (role) {
        // Apply role template to snippet content
        finalPrompt = `${role.promptTemplate}\n\nContext: ${snippet.content}`
      }

      await navigator.clipboard.writeText(finalPrompt)

      // Show success feedback (Task 5.4)
      const message = role
        ? `Prompt copied with "${role.name}" role applied!`
        : 'Snippet content copied to clipboard!'
      showToast(message, 'success')

    } catch (error) {
      console.error('Failed to copy prompt:', error)
      showToast('Failed to copy to clipboard', 'error')
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold tracking-tight">Contexus</h1>
            <div className="text-xs text-muted-foreground">
              {snippets.length} snippets
            </div>
          </div>

          {/* Search Input - Task 5.2: Real-time search */}
          <Input
            type="search"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Snippets List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading snippets...</div>
            </div>
          ) : snippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                {searchQuery ? 'No snippets found' : 'No snippets yet'}
              </div>
              <div className="text-xs text-muted-foreground">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start capturing snippets from your LLM conversations'
                }
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {snippets.map(snippet => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  roles={roles}
                  onCopyPrompt={handleCopyPrompt}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="text-xs text-muted-foreground text-center">
            {roles.length} roles available • Data stored locally
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
