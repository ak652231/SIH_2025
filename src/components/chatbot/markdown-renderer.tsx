"use client"

import type React from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  // Parse markdown content and convert to JSX
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      // Handle tables
      if (line.includes("|") && line.trim().startsWith("|")) {
        const tableRows: string[] = []
        let j = i

        // Collect all table rows
        while (j < lines.length && lines[j].includes("|") && lines[j].trim()) {
          if (!lines[j].includes("---")) {
            // Skip separator rows
            tableRows.push(lines[j])
          }
          j++
        }

        if (tableRows.length > 0) {
          elements.push(
            <div key={`table-${i}`} className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-emerald-200 bg-white/50 rounded-lg">
                <thead>
                  <tr className="bg-emerald-100/50">
                    {tableRows[0]
                      .split("|")
                      .slice(1, -1)
                      .map((header, idx) => (
                        <th
                          key={idx}
                          className="border border-emerald-200 px-3 py-2 text-left font-semibold text-emerald-800"
                        >
                          {parseInlineMarkdown(header.trim())}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.slice(1).map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-emerald-50/30">
                      {row
                        .split("|")
                        .slice(1, -1)
                        .map((cell, cellIdx) => (
                          <td key={cellIdx} className="border border-emerald-200 px-3 py-2 text-sm">
                            {parseInlineMarkdown(cell.trim())}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>,
          )
        }

        i = j
        continue
      }

      // Handle headers
      if (line.startsWith("**") && line.endsWith("**")) {
        elements.push(
          <h3 key={`header-${i}`} className="font-bold text-lg text-emerald-800 mt-4 mb-2">
            {line.slice(2, -2)}
          </h3>,
        )
      }
      // Handle regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={`para-${i}`} className="mb-2 leading-relaxed">
            {parseInlineMarkdown(line)}
          </p>,
        )
      }
      // Handle empty lines
      else {
        elements.push(<br key={`br-${i}`} />)
      }

      i++
    }

    return elements
  }

  // Parse inline markdown (bold, italic, etc.)
  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-emerald-900">
            {part.slice(2, -2)}
          </strong>
        )
      } else if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={index} className="italic">
            {part.slice(1, -1)}
          </em>
        )
      } else {
        return part
      }
    })
  }

  return <div className={`prose prose-sm max-w-none ${className}`}>{parseMarkdown(content)}</div>
}
