"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type ComboboxOption = {
  value: string
  label: string
}

type ComboboxProps = {
  options: ComboboxOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  createText?: (value: string) => string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  createText = (value) => `Add "${value}"`,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState(value || "")

  React.useEffect(() => {
    // When the popover closes, if the search input doesn't match an existing option,
    // treat it as a new value.
    if (!open) {
      const bestMatch = options.find(o => o.label.toLowerCase() === search.toLowerCase())
      if (search) {
        onChange(bestMatch?.value || search)
      }
    }
    // Only run on popover close
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    // Sync search input with external value changes
    if (value) {
      const matchingOption = options.find((option) => option.value === value)
      setSearch(matchingOption?.label || value)
    } else {
        setSearch("")
    }
  }, [value, options]);


  const filteredOptions = search
    ? options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    const label = options.find(o => o.value === selectedValue)?.label || selectedValue;
    setSearch(label)
    setOpen(false)
  }
  
  const showCreateOption = search && !options.some(o => o.label.toLowerCase() === search.toLowerCase());
  const displayValue = options.find((option) => option.value === value)?.label || value

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value ? displayValue : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
         <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
              aria-label="Search labels"
            />
        </div>
        <div className="max-h-[200px] overflow-auto p-1">
          {filteredOptions.length > 0 && (
            filteredOptions.map((option) => (
              <Button
                variant="ghost"
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="w-full justify-start font-normal h-9"
              >
                 <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                {option.label}
              </Button>
            ))
          )}

          {showCreateOption ? (
            <Button
              variant="ghost"
              onClick={() => handleSelect(search)}
              className="w-full justify-start font-normal h-9 text-left"
            >
              {createText(search)}
            </Button>
          ) : filteredOptions.length === 0 && !showCreateOption ? (
             <p className="p-4 text-center text-sm text-muted-foreground">{emptyText}</p>
          ) : null }
        </div>
      </PopoverContent>
    </Popover>
  )
}