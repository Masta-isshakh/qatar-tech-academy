/**
 * A deliberately small Markdown subset for CMS-authored post bodies.
 *
 * Raw HTML in the source is escaped rather than passed through, so there is no
 * sanitiser to keep up to date and no way for an admin account to inject script
 * into a public page. Supported: headings (##, ###), paragraphs, unordered and
 * ordered lists, **bold**, _italic_, `code`, and [links](https://…).
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c)
}

/** Only http(s) and mailto links survive; everything else renders as plain text. */
function safeHref(href: string) {
  const trimmed = href.trim()
  return /^(https?:\/\/|mailto:|\/)/i.test(trimmed) ? trimmed : null
}

function inline(text: string) {
  let out = escapeHtml(text)

  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>')

  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, rawHref: string) => {
    // rawHref was escaped above, so decode the one entity that can appear in URLs.
    const href = safeHref(rawHref.replace(/&amp;/g, '&'))
    if (!href) return label
    const external = /^https?:\/\//i.test(href)
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${escapeHtml(href)}"${rel}>${label}</a>`
  })

  return out
}

export function markdownToHtml(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let listTag: 'ul' | 'ol' | null = null
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }

  const closeList = () => {
    if (listTag) {
      html.push(`</${listTag}>`)
      listTag = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      closeList()
      continue
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flushParagraph()
      closeList()
      const level = heading[1]!.length
      html.push(`<h${level}>${inline(heading[2]!)}</h${level}>`)
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed)

    if (bullet || numbered) {
      flushParagraph()
      const wanted = bullet ? 'ul' : 'ol'
      if (listTag !== wanted) {
        closeList()
        html.push(`<${wanted}>`)
        listTag = wanted
      }
      html.push(`<li>${inline((bullet ?? numbered)![1]!)}</li>`)
      continue
    }

    closeList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  closeList()

  return html.join('\n')
}
