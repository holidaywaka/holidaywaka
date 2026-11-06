import React from 'react'
import parse from 'html-react-parser'

// Blog posts are typed into a plain textarea, usually as Markdown. Older posts may hold HTML.
// Everything is built as React elements (no innerHTML), so typed content can't inject markup.

/** Quill 2's semantic HTML turns every space into &nbsp;, which stops text from wrapping */
export const normalizeEditorHtml = (html: string) => html.replace(/&nbsp;/g, ' ')

export const looksLikeHtml = (text: string) => /^\s*<([a-z][a-z0-9]*)\b[^>]*>/i.test(text)

const safeHref = (href: string) => /^(https?:\/\/|mailto:|\/|#)/i.test(href.trim()) ? href.trim() : undefined

const INLINE = /(\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*\s][^*]*?)\*|_([^_\s][^_]*?)_|`([^`]+?)`|\[([^\]]+?)\]\(([^)\s]+?)\))/

function renderInline(text: string, keyPrefix = 'i'): React.ReactNode[] {
    const nodes: React.ReactNode[] = []
    let rest = text
    let index = 0
    while (rest.length) {
        const match = INLINE.exec(rest)
        if (!match) { nodes.push(rest); break }
        if (match.index > 0) nodes.push(rest.slice(0, match.index))
        const key = `${keyPrefix}-${index++}`
        const [, , bold1, bold2, em1, em2, code, linkText, linkHref] = match
        if (bold1 ?? bold2) nodes.push(<strong key={key} className="font-bold text-primary">{renderInline(bold1 ?? bold2, key)}</strong>)
        else if (em1 ?? em2) nodes.push(<em key={key}>{renderInline(em1 ?? em2, key)}</em>)
        else if (code) nodes.push(<code key={key} className="px-1.5 py-0.5 rounded bg-slate-100 text-[0.9em]">{code}</code>)
        else if (linkText) {
            const href = safeHref(linkHref)
            nodes.push(href
                ? <a key={key} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-primary font-semibold underline decoration-secondary decoration-2 underline-offset-2 hover:text-secondary">{renderInline(linkText, key)}</a>
                : <React.Fragment key={key}>{linkText}</React.Fragment>)
        }
        rest = rest.slice(match.index + match[0].length)
    }
    return nodes
}

type Block =
    | { type: 'heading', level: number, text: string }
    | { type: 'paragraph', lines: string[] }
    | { type: 'list', ordered: boolean, items: string[] }
    | { type: 'quote', lines: string[] }
    | { type: 'rule' }

function toBlocks(source: string): Block[] {
    const blocks: Block[] = []
    for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
        const line = raw.trim()
        const last = blocks[blocks.length - 1]
        if (!line) { blocks.push({ type: 'paragraph', lines: [] }); continue }

        const heading = /^(#{1,6})\s+(.*)$/.exec(line)
        if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].replace(/\s+#+$/, '') }); continue }
        if (/^([-*_])(\s*\1){2,}$/.test(line)) { blocks.push({ type: 'rule' }); continue }

        const bullet = /^[-*+]\s+(.*)$/.exec(line)
        const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
        if (bullet || numbered) {
            const ordered = Boolean(numbered)
            const item = (bullet ?? numbered)![1]
            if (last?.type === 'list' && last.ordered === ordered) last.items.push(item)
            else blocks.push({ type: 'list', ordered, items: [item] })
            continue
        }

        const quote = /^>\s?(.*)$/.exec(line)
        if (quote) {
            if (last?.type === 'quote') last.lines.push(quote[1])
            else blocks.push({ type: 'quote', lines: [quote[1]] })
            continue
        }

        if (last?.type === 'paragraph' && last.lines.length) last.lines.push(line)
        else blocks.push({ type: 'paragraph', lines: [line] })
    }
    return blocks.filter(block => block.type !== 'paragraph' || block.lines.length)
}

const headingStyles: Record<number, string> = {
    1: 'text-3xl md:text-4xl mt-12 mb-4',
    2: 'text-2xl md:text-3xl mt-12 mb-4',
    3: 'text-xl md:text-2xl mt-10 mb-3',
    4: 'text-lg mt-8 mb-2',
}

const withBreaks = (lines: string[], key: string) => lines.flatMap((line, index) => index ? [<br key={`${key}-br-${index}`} />, ...renderInline(line, `${key}-${index}`)] : renderInline(line, `${key}-${index}`))

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inlineHtml(text: string): string {
    let html = ''
    let rest = text
    while (rest.length) {
        const match = INLINE.exec(rest)
        if (!match) { html += escapeHtml(rest); break }
        html += escapeHtml(rest.slice(0, match.index))
        const [, , bold1, bold2, em1, em2, code, linkText, linkHref] = match
        if (bold1 ?? bold2) html += `<strong>${inlineHtml(bold1 ?? bold2)}</strong>`
        else if (em1 ?? em2) html += `<em>${inlineHtml(em1 ?? em2)}</em>`
        else if (code) html += `<code>${escapeHtml(code)}</code>`
        else if (linkText) {
            const href = safeHref(linkHref)
            html += href ? `<a href="${escapeHtml(href)}">${inlineHtml(linkText)}</a>` : escapeHtml(linkText)
        }
        rest = rest.slice(match.index + match[0].length)
    }
    return html
}

/** Converts a Markdown/plain-text post into HTML the rich-text editor can load. HTML passes through. */
export function markdownToHtml(source: string) {
    if (!source || looksLikeHtml(source)) return source
    return toBlocks(source).map(block => {
        switch (block.type) {
            case 'heading': {
                const tag = block.level <= 2 ? 'h2' : 'h3'
                return `<${tag}>${inlineHtml(block.text)}</${tag}>`
            }
            case 'rule': return '<p><br></p>'
            case 'quote': return `<blockquote>${block.lines.map(inlineHtml).join('<br>')}</blockquote>`
            case 'list': {
                const tag = block.ordered ? 'ol' : 'ul'
                return `<${tag}>${block.items.map(item => `<li>${inlineHtml(item)}</li>`).join('')}</${tag}>`
            }
            default: return `<p>${block.lines.map(inlineHtml).join('<br>')}</p>`
        }
    }).join('')
}

export default function Markdown({ content, className = '' }: { content: string, className?: string }) {
    if (looksLikeHtml(content)) return <div className={`rich-content ${className}`}>{parse(normalizeEditorHtml(content))}</div>

    return (
        <div className={`text-zinc-700 text-base md:text-lg leading-relaxed ${className}`}>
            {toBlocks(content).map((block, index) => {
                const key = `b${index}`
                switch (block.type) {
                    case 'heading': {
                        const Tag = `h${Math.min(block.level + 1, 6)}` as 'h2'
                        return <Tag key={key} className={`font-extrabold text-primary leading-tight first:mt-0 ${headingStyles[block.level] ?? headingStyles[4]}`}>{renderInline(block.text, key)}</Tag>
                    }
                    case 'rule':
                        return <hr key={key} className="my-10 border-slate-200" />
                    case 'quote':
                        return <blockquote key={key} className="my-6 border-l-4 border-secondary bg-secondary/10 rounded-r-xl px-5 py-4 italic text-primary">{withBreaks(block.lines, key)}</blockquote>
                    case 'list': {
                        const List = block.ordered ? 'ol' : 'ul'
                        return (
                            <List key={key} className={`my-5 space-y-2 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'} marker:text-secondary`}>
                                {block.items.map((item, itemIndex) => <li key={itemIndex} className="pl-1">{renderInline(item, `${key}-${itemIndex}`)}</li>)}
                            </List>
                        )
                    }
                    default:
                        return <p key={key} className="my-5">{withBreaks(block.lines, key)}</p>
                }
            })}
        </div>
    )
}

/** Plain-text preview for cards and meta descriptions */
export function markdownExcerpt(content = '', length = 140) {
    const text = content
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/(\*\*|__|\*|_|`)/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, '')}…` : text
}
