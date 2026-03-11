import { ReactNode, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LegalDocument, legalDocumentList } from '@/content/legalDocuments'

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'hr' }

const forcedBreakToken = '__KC_BR__'

function formatParagraphLines(lines: string[]) {
  return lines.reduce((result, line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return result
    if (index === 0) return trimmed.replace(/\s{2,}$/, forcedBreakToken)

    const previous = lines[index - 1] ?? ''
    const separator = /\s{2,}$/.test(previous) ? forcedBreakToken : ' '
    return `${result}${separator}${trimmed.replace(/\s{2,}$/, forcedBreakToken)}`
  }, '')
}

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let paragraphLines: string[] = []
  let listItems: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    blocks.push({ type: 'paragraph', content: formatParagraphLines(paragraphLines) })
    paragraphLines = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push({ type: 'list', items: listItems })
    listItems = []
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      return
    }

    if (trimmed === '---') {
      flushParagraph()
      flushList()
      blocks.push({ type: 'hr' })
      return
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3,
        content: headingMatch[2].trim(),
      })
      return
    }

    const listMatch = trimmed.match(/^-\s+(.+)$/)
    if (listMatch) {
      flushParagraph()
      listItems.push(listMatch[1].trim())
      return
    }

    flushList()
    paragraphLines.push(line)
  })

  flushParagraph()
  flushList()

  return blocks
}

function autoLinkToken(token: string, index: number) {
  if (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(token)) {
    return (
      <a key={index} href={`mailto:${token}`} className="text-[#86FF72] underline decoration-white/15 underline-offset-4 hover:text-white">
        {token}
      </a>
    )
  }

  if (/^(https?:\/\/|www\.)\S+$/i.test(token)) {
    const href = token.startsWith('www.') ? `https://${token}` : token
    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-[#86FF72] underline decoration-white/15 underline-offset-4 hover:text-white"
      >
        {token}
      </a>
    )
  }

  return token
}

function renderInline(content: string): ReactNode[] {
  const parts = content.split(forcedBreakToken)

  return parts.flatMap((part, partIndex) => {
    const nodes: ReactNode[] = []
    const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/\S+|www\.\S+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(part)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(part.slice(lastIndex, match.index))
      }

      const token = match[0]
      const key = `${partIndex}-${match.index}`

      if (token.startsWith('**') && token.endsWith('**')) {
        nodes.push(
          <strong key={key} className="font-semibold text-white">
            {token.slice(2, -2)}
          </strong>
        )
      } else if (token.startsWith('[')) {
        const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (linkMatch) {
          nodes.push(
            <a
              key={key}
              href={linkMatch[2]}
              target="_blank"
              rel="noreferrer"
              className="text-[#86FF72] underline decoration-white/15 underline-offset-4 hover:text-white"
            >
              {linkMatch[1]}
            </a>
          )
        } else {
          nodes.push(token)
        }
      } else {
        nodes.push(autoLinkToken(token, partIndex * 1000 + match.index))
      }

      lastIndex = match.index + token.length
    }

    if (lastIndex < part.length) {
      nodes.push(part.slice(lastIndex))
    }

    if (partIndex < parts.length - 1) {
      nodes.push(<br key={`br-${partIndex}`} />)
    }

    return nodes
  })
}

export default function LegalDocumentPage({ document: legalDocument }: { document: LegalDocument }) {
  const blocks = parseMarkdown(legalDocument.markdown)

  useEffect(() => {
    document.title = `${legalDocument.title} | KickChasers`
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [legalDocument])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02091A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1100px_640px_at_8%_-10%,rgba(20,92,255,0.2),transparent_58%),radial-gradient(760px_480px_at_92%_6%,rgba(57,255,20,0.07),transparent_52%),linear-gradient(180deg,#02091A_0%,#040B1C_52%,#030A1A_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[14vw] bg-[linear-gradient(90deg,rgba(0,0,0,0.22),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[14vw] bg-[linear-gradient(270deg,rgba(0,0,0,0.22),transparent)]" />

      <header className="relative border-b border-white/10 bg-[#030A1A]/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5 lg:px-10">
          <Link to="/" className="flex items-center gap-3 text-sm text-slate-200 transition hover:text-white">
            <img src="/kickchasers_logo.png" alt="KickChasers" className="h-10 w-auto" />
            <span>KickChasers</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-slate-200 transition hover:border-white/30 hover:text-white">
              Back to Home
            </Link>
            <Link to="/sign-in" className="rounded-xl border border-[#7CFF64]/45 bg-[#39FF14]/90 px-4 py-2 font-semibold text-[#07111F] transition hover:brightness-110">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-12 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Legal & Support</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{legalDocument.title}</h1>
          <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-slate-300 sm:text-lg">{legalDocument.description}</p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <article className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur sm:px-8 sm:py-8">
            <div className="space-y-6 text-[15px] leading-7 text-slate-200 sm:text-base">
              {blocks.map((block, index) => {
                if (block.type === 'hr') {
                  return <hr key={index} className="border-white/10" />
                }

                if (block.type === 'heading') {
                  if (block.level === 1) {
                    return (
                      <h2 key={index} className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {renderInline(block.content)}
                      </h2>
                    )
                  }

                  if (block.level === 2) {
                    return (
                      <h3 key={index} className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        {renderInline(block.content)}
                      </h3>
                    )
                  }

                  return (
                    <h4 key={index} className="text-lg font-semibold tracking-tight text-white">
                      {renderInline(block.content)}
                    </h4>
                  )
                }

                if (block.type === 'list') {
                  return (
                    <ul key={index} className="space-y-2 pl-5 text-slate-300 marker:text-[#39FF14]">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{renderInline(item)}</li>
                      ))}
                    </ul>
                  )
                }

                return (
                  <p key={index} className="text-slate-300">
                    {renderInline(block.content)}
                  </p>
                )
              })}
            </div>
          </article>

          <aside className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Documents</p>
            <nav className="mt-4 space-y-2">
              {legalDocumentList.map((item) => {
                const isActive = item.key === legalDocument.key
                return (
                  <Link
                    key={item.key}
                    to={item.route}
                    className={`block rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? 'border-[#39FF14]/45 bg-[#39FF14]/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="block font-medium">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      </section>
    </main>
  )
}
