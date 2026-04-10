"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, XIcon } from "lucide-react"
import { useCallback, useTransition } from "react"

import {
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUSES,
  ISSUE_TYPE_LABELS,
  ISSUE_TYPES,
} from "@/config/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function IssueFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentStatus = searchParams.get("status") ?? ""
  const currentPriority = searchParams.get("priority") ?? ""
  const currentType = searchParams.get("type") ?? ""
  const currentSearch = searchParams.get("q") ?? ""

  const hasFilters =
    currentStatus || currentPriority || currentType || currentSearch

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete("page")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname)
    })
  }, [router, pathname])

  const selectClass =
    "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          defaultValue={currentSearch}
          className="h-8 w-48 pl-7 text-sm"
          onChange={(e) => {
            const value = e.target.value
            // Debounce search
            const timeout = setTimeout(() => setParam("q", value), 300)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      <select
        value={currentStatus}
        onChange={(e) => setParam("status", e.target.value)}
        className={selectClass}
      >
        <option value="">All statuses</option>
        {Object.entries(ISSUE_STATUSES).map(([key, value]) => (
          <option key={key} value={value}>
            {ISSUE_STATUS_LABELS[value]}
          </option>
        ))}
      </select>

      <select
        value={currentPriority}
        onChange={(e) => setParam("priority", e.target.value)}
        className={selectClass}
      >
        <option value="">All priorities</option>
        {Object.entries(ISSUE_PRIORITIES).map(([key, value]) => (
          <option key={key} value={value}>
            {ISSUE_PRIORITY_LABELS[value]}
          </option>
        ))}
      </select>

      <select
        value={currentType}
        onChange={(e) => setParam("type", e.target.value)}
        className={selectClass}
      >
        <option value="">All types</option>
        {Object.entries(ISSUE_TYPES).map(([key, value]) => (
          <option key={key} value={value}>
            {ISSUE_TYPE_LABELS[value]}
          </option>
        ))}
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <XIcon className="size-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
