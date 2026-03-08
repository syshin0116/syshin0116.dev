# syshin0116.dev

A personal tech blog and portfolio site with an AI-powered chatbot, built on [Nuartz](https://github.com/syshin0116/nuartz) and [blog-rag](https://github.com/syshin0116/blog-rag).

## Features

### AI Chat Assistant
- RAG-powered chatbot on the home page via LangGraph SDK
- Multiple search modes: Auto (single/multi agent) and Manual (metadata, filesystem, vector, graph)
- Real-time streaming with tool call visualization and source attribution

### Blog
- Obsidian-compatible markdown content powered by Nuartz
- Knowledge graph visualization (D3.js)
- Full-text search with command palette (Cmd+K)
- Backlinks, table of contents, link hover previews
- Mermaid diagrams, LaTeX math (KaTeX), syntax highlighting (Shiki)
- Reader mode, reading time estimates, copy code buttons

### Projects
- Timeline view of 12+ projects with detailed breakdowns
- Tech stack, achievements, architecture, and challenges for each project

### Other
- Google OAuth via Supabase
- Dark/light theme
- SEO: sitemap, robots.txt, Open Graph, JSON-LD
- Vercel Analytics & Speed Insights

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, shadcn/ui, Radix UI, Tailwind CSS 4 |
| Content | Nuartz (headless markdown processor) |
| Search | FlexSearch |
| AI/RAG | LangGraph SDK, LangChain Core |
| Visualization | D3.js, Mermaid, Framer Motion |
| Auth | Supabase (Google OAuth) |
| Deployment | Vercel |
| Package Manager | Bun |

## Getting Started

### Prerequisites

- **Bun 1.0+** (recommended) or Node.js 18+
- **API Keys** for LangGraph and Supabase

### Installation

```bash
git clone https://github.com/syshin0116/syshin0116.dev.git
cd syshin0116.dev
bun install
```

### Environment Variables

Create a `.env` file:

```env
# LangGraph (blog-rag backend)
LANGGRAPH_API_URL=your_langgraph_api_url
LANGGRAPH_API_KEY=your_api_key

# Supabase (auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
bun dev       # Start dev server (Turbopack)
bun build     # Production build
bun start     # Start production server
bun lint      # Run ESLint
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
syshin0116.dev/
├── app/
│   ├── page.tsx              # Home (hero + chat + recent posts/projects)
│   ├── blog/                 # Blog pages + API routes
│   ├── projects/             # Project timeline + detail pages
│   ├── about/                # About page
│   ├── login/                # Login page
│   └── auth/                 # OAuth callback
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── blog/                 # Blog components (sidebar, TOC, graph, search)
│   ├── navbar/               # Navigation
│   ├── auth/                 # Auth components
│   └── chat-section.tsx      # AI chat interface
├── content/                  # Blog content (Obsidian vault)
├── lib/                      # API client, utilities, Supabase
├── data/                     # Project & event data
└── public/                   # Static assets
```

## Related Repositories

- [nuartz](https://github.com/syshin0116/nuartz) - Headless data layer (Obsidian vault to Next.js)
- [blog-rag](https://github.com/syshin0116/blog-rag) - RAG backend (FastAPI + LangGraph)

---

Built by [syshin0116](https://github.com/syshin0116)
