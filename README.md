# Blog-RAG Portfolio

An AI-powered portfolio website that allows visitors to chat with an intelligent agent about my projects, blog posts, and technical experience. This project demonstrates and compares four different RAG (Retrieval-Augmented Generation) strategies.

![Portfolio Preview](/public/page-preview.png)

## What I Built

This is a portfolio website with an intelligent chatbot interface that can answer questions about my work, projects, and blog posts. The key innovation is the ability to compare different RAG strategies side-by-side to understand their strengths and trade-offs.

### Why I Built This

- Showcase my technical writing and projects in an interactive way
- Experiment with different RAG architectures and compare their performance
- Build a practical AI agent using LangGraph for complex retrieval tasks
- Create a reusable framework for comparing RAG strategies

## Getting Started

### Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js 18+** or **Bun 1.0+** (recommended)
- **Git** for version control
- **API Keys** for LangGraph/LangChain services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio-web
   ```

2. **Install dependencies**
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then fill in your actual values:
   ```env
   # LangGraph Configuration
   LANGGRAPH_API_URL=your_langgraph_api_url
   LANGGRAPH_API_KEY=your_api_key
   
   # Supabase Configuration (optional - for future features)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Optional: For different RAG strategies
   OPENAI_API_KEY=your_openai_key
   COHERE_API_KEY=your_cohere_key
   ```
   
   **Note**: See `docs/SUPABASE_ENV_VARIABLES.md` for detailed Supabase setup guide.

4. **Run the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Quick Commands

```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

## RAG Strategy Implementation

I implemented four distinct RAG strategies that can be selected individually or combined:

### 1. Naive RAG
The baseline implementation:
- Direct vector similarity search using embeddings
- Retrieves top-k most similar documents
- Passes retrieved context directly to LLM
- Simple but effective for straightforward queries

**Implementation approach:**
- Used LangChain's VectorStore for document retrieval
- Cosine similarity for ranking
- Fixed context window (top 3-5 documents)

### 2. Advanced RAG
Enhanced retrieval pipeline:
- Query preprocessing (expansion, rewriting)
- Hybrid search combining semantic and keyword matching
- Re-ranking retrieved documents using cross-encoders
- Contextual compression to remove irrelevant parts

**Implementation approach:**
- Query transformation before retrieval
- Multiple retrieval strategies combined
- Cohere/LangChain reranker for relevance scoring
- Dynamic context window based on query complexity

### 3. Modular RAG
Flexible, component-based system:
- Pluggable retrieval modules (dense, sparse, hybrid)
- Customizable pre-processing steps
- Post-retrieval filtering and augmentation
- Configurable prompt templates

**Implementation approach:**
- Designed modular architecture with clear interfaces
- Each component (retriever, reranker, prompt) is swappable
- Easy to experiment with different combinations
- Used LangChain's LCEL for pipeline composition

### 4. Agentic RAG
Autonomous agent with reasoning:
- LangGraph-based agent with tool calling
- Dynamic tool selection for retrieval
- Multi-step reasoning and query decomposition
- Self-correction based on retrieval quality
- Iterative refinement of search queries

**Implementation approach:**
- Built state graph with LangGraph
- Agent decides when to retrieve, rerank, or generate
- Tools: blog search, project search, web search
- Reflexion-style self-evaluation loop

## Technical Architecture

### Frontend
- **Next.js 15.5.7**: Latest App Router with React Server Components
- **React 19.1.1**: Using newest React features
- **TypeScript**: Full type safety across the codebase
- **Tailwind CSS 4.0**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations and transitions

### Backend Integration
- **LangGraph SDK**: Orchestrates the AI agent and RAG strategies
- **Streaming API**: Real-time response streaming with tool call visibility
- **Custom API Client**: Type-safe wrapper around LangGraph endpoints

### Key Technical Decisions

**Why LangGraph over LangChain?**
- Need for stateful agents with complex control flow
- Better support for tool calling and multi-step reasoning
- Easier to implement agentic RAG with graph-based state management

**Why Next.js 15?**
- Server Components for better performance
- Built-in streaming support
- Modern React patterns with App Router
- Vercel deployment integration

**Why Bun?**
- Significantly faster package installation
- Native TypeScript support
- Better performance for development builds

## Project Structure

```
portfolio-web/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main chat interface page
│   └── globals.css          # Global styles and theme
├── components/
│   ├── chat-section.tsx     # Main chat UI with streaming
│   ├── navbar/              # Navigation components
│   └── ui/                  # Reusable UI components
│       ├── chat-container.tsx
│       ├── message.tsx      # Message display with markdown
│       ├── tool.tsx         # Tool call visualization
│       └── blog-search-result.tsx
├── lib/
│   ├── api-client.ts        # LangGraph API integration
│   └── utils.ts             # Utility functions
├── data/
│   └── events.ts            # Timeline data
└── types/
    └── events.ts            # TypeScript types
```

## How the Chat Interface Works

### Message Streaming
Implemented real-time streaming to show AI responses as they're generated:
- Used Server-Sent Events (SSE) pattern
- LangGraph's `streamMode: "messages"` for granular updates
- React state updates for each chunk
- Accumulates full response while showing progress

### Tool Call Visualization
Shows what the agent is doing behind the scenes:
- Displays tool name, input parameters, and execution status
- Collapsible UI to avoid cluttering the interface
- JSON parsing for streaming tool call arguments
- Color-coded states: pending → executing → completed

### Type Safety
Ensured type safety throughout:
```typescript
interface StreamMessage {
  content?: string | unknown
  type?: string
  tool_calls?: Array<{
    name: string
    args: Record<string, unknown>
    id: string
    type?: string
  }>
  name?: string
  tool_call_id?: string
}
```

## RAG Strategy Comparison

### Performance Characteristics

| Strategy | Retrieval Time | Generation Time | Accuracy | Use Case |
|----------|---------------|----------------|----------|----------|
| Naive RAG | ~100ms | ~2s | Good | Simple factual queries |
| Advanced RAG | ~300ms | ~2s | Better | Complex queries |
| Modular RAG | ~200ms (varies) | ~2s | Good-Better | Experimental |
| Agentic RAG | ~500ms-2s | ~3s | Best | Multi-hop reasoning |

### What I Learned

**Naive RAG limitations:**
- Struggles with queries requiring multiple pieces of information
- No query understanding or refinement
- Can retrieve irrelevant context

**Advanced RAG benefits:**
- Query rewriting dramatically improves retrieval
- Reranking helps prioritize most relevant chunks
- Compression reduces noise in context

**Modular RAG flexibility:**
- Easy to A/B test different components
- Can optimize each piece independently
- Good for experimentation and iteration

**Agentic RAG power:**
- Handles complex queries naturally
- Can recover from bad retrievals
- More expensive but more capable
- Best for conversational use cases

## Development Process

### Build Scripts
```bash
bun dev          # Development server with hot reload
bun build        # Production build
bun lint         # ESLint checking
```

### Key Challenges Solved

**1. Streaming with Tool Calls**
Challenge: Show both generated text and tool executions in real-time
Solution: Used separate state management for messages and tool calls, merged in UI

**2. Type Safety with Streaming**
Challenge: LangGraph streaming chunks don't have strict types
Solution: Created `StreamMessage` interface and type guards

**3. Tool Call Argument Parsing**
Challenge: Tool arguments arrive as strings during streaming
Solution: Added JSON parsing with fallback to handle partial chunks

**4. Image Optimization**
Challenge: Next.js warnings about using `<img>` tags
Solution: Migrated all images to Next.js `<Image>` component with proper dimensions

## Security Updates

Recently updated to address critical vulnerabilities:
- **Next.js 15.5.7**: Fixed RCE vulnerability (GHSA-9qr9-h5gf-34mp)
- **React 19.1.1**: Not affected by Server Components CVE (CVE-2025-66478)

## Future Improvements

Things I want to add:
- [ ] RAG strategy selector in UI
- [ ] Side-by-side comparison mode
- [ ] Performance metrics dashboard
- [ ] Query refinement suggestions
- [ ] Document source citations
- [ ] Feedback mechanism to improve retrieval
- [ ] Caching layer for repeated queries
- [ ] More sophisticated reranking

## Tech Stack Summary

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion  
**AI/Backend:** LangGraph, LangChain, LLM (GPT-4/Claude)  
**Deployment:** Vercel (frontend), Google Cloud Run (backend)  
**Tools:** Bun, ESLint, Turbopack

## References & Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Advanced RAG Techniques](https://arxiv.org/abs/2312.10997)
- [Agentic RAG Patterns](https://langchain-ai.github.io/langgraph/tutorials/)

---

**Built by:** Syshin0116  
**Stack:** Next.js 15 + LangGraph + TypeScript  
**Focus:** Comparing RAG strategies for intelligent portfolio chatbot
