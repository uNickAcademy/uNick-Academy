"use client"

import { useState } from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Entity } from "@/types/domain"

interface EntitySwitcherProps {
  entities: Entity[]
  activeEntityId: string | null
}

export function EntitySwitcher({ entities, activeEntityId }: EntitySwitcherProps) {
  const [open, setOpen] = useState(false)

  const active = entities.find((e) => e.id === activeEntityId) ?? entities[0]

  if (!active) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-brand-muted transition-colors"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: active.color }}
        />
        <span className="text-sm font-medium text-navy-500">{active.short_name}</span>
        <span className="text-xs text-brand-subtle hidden sm:inline truncate max-w-[200px]">
          {active.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-brand-subtle" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#E8EBF0] rounded-lg shadow-card-hover min-w-[260px] py-1">
            <div className="px-3 py-1.5">
              <p className="text-xs font-medium text-brand-subtle uppercase tracking-wide">
                Podmiot
              </p>
            </div>
            {entities.map((entity) => (
              <button
                key={entity.id}
                onClick={() => {
                  // TODO: Faza 0+ – implementacja przełączania podmiotu przez store
                  setOpen(false)
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-brand-muted transition-colors",
                  entity.id === active.id && "bg-brand-muted"
                )}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: entity.color + "20" }}
                >
                  <Building2
                    className="w-3.5 h-3.5"
                    style={{ color: entity.color }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-navy-500">{entity.short_name}</div>
                  <div className="text-xs text-brand-subtle truncate">{entity.name}</div>
                </div>
                {entity.id === active.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-navy-500" />
                )}
              </button>
            ))}
            <div className="border-t border-[#E8EBF0] mt-1 pt-1 px-3 py-2">
              <button className="w-full flex items-center gap-2 text-xs text-brand-subtle hover:text-navy-500 transition-colors">
                <Building2 className="w-3.5 h-3.5" />
                Zarządzaj podmiotami
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
