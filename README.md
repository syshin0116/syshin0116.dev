# Blog-RAG Portfolio

An AI-powered portfolio website that allows visitors to chat with an intelligent agent about my projects, blog posts, and technical experience. This project demonstrates and compares different RAG (Retrieval-Augmented Generation) strategies, built with Next.js 15 and LangGraph.

![Portfolio Preview](/public/page-preview.png)

## Project Overview

This project is designed to showcase and compare **four different RAG strategies** for building intelligent chatbots. Users can select one or multiple RAG approaches to see how each strategy performs in retrieving and presenting information from my blog and portfolio content.

### The Four RAG Strategies

#### 1. **Naive RAG**
The simplest approach to Retrieval-Augmented Generation:
- Direct document retrieval based on similarity search
- Straightforward generation from retrieved context
- Minimal preprocessing or query optimization
- Best for: Simple Q&A scenarios with clear queries

#### 2. **Advanced RAG**
Enhanced retrieval with sophisticated techniques:
- Query rewriting and expansion
- Hybrid search (combining keyword and semantic search)
- Re-ranking retrieved documents for relevance
- Contextual compression to focus on key information
- Best for: Complex queries requiring refined search results

#### 3. **Modular RAG**
Flexible, component-based architecture:
- Pluggable retrieval modules
- Customizable pre-processing and post-processing steps
- Multiple retriever strategies (dense, sparse, hybrid)
- Configurable generation prompts
- Best for: Customizable workflows and experimentation

#### 4. **Agentic RAG**
Autonomous agent-based retrieval and reasoning:
- Dynamic tool selection and execution
- Multi-step reasoning and planning
- Self-correcting retrieval based on generation quality
- Adaptive query refinement
- Best for: Complex multi-hop questions and exploratory search

### Comparative Chatbot System

This project allows you to:
- **Select RAG strategies**: Choose one or combine multiple strategies
- **Compare performance**: See how different strategies handle the same query
- **Visualize tool calls**: Observe the agent's decision-making process
- **Analyze results**: Compare response quality, retrieval accuracy, and latency

## Features

- **AI-Powered Chat Interface** - Interactive chatbot using LangGraph SDK for intelligent conversations
- **RAG Strategy Selection** - Switch between different RAG approaches or combine them
- **Real-time Streaming** - Stream AI responses with tool call visualization
- **Tool Execution Visualization** - See AI agent's tool calls and results in real-time
- **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS and Radix UI components
- **Dark Mode Support** - Seamless theme switching
- **Fully Responsive** - Optimized for all device sizes
- **Performance Optimized** - Built with Next.js 15 and Turbopack

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.7 (App Router)
- **React**: 19.1.1
- **TypeScript**: Type-safe development
- **Styling**: Tailwind CSS 4.0.8
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion

### AI/Backend
- **LangGraph SDK**: For AI agent orchestration and agentic RAG
- **LangChain Core**: Foundation for LLM interactions and RAG pipelines
- **Streaming API**: Real-time message streaming
- **Vector Search**: Document embedding and retrieval

### Developer Experience
- **Package Manager**: Bun (fastest JavaScript runtime)
- **Turbopack**: Ultra-fast development builds
- **ESLint**: Code quality and consistency

## Getting Started

### Prerequisites

- Node.js 20+ or Bun
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd portfolio-web
```

2. **Install dependencies**
```bash
bun install
# or
npm install
```

3. **Configure the API endpoint**

The project connects to a LangGraph API at:
```
https://portfolio-ai-194616966170.asia-northeast3.run.app
```

To use your own backend, modify `lib/api-client.ts`:
```typescript
const API_URL = "your-api-endpoint-here"
```

4. **Run the development server**
```bash
bun dev
# or
npm run dev
```

5. **Open your browser**

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
portfolio-web/
├── app/                      # Next.js app directory
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page with chat section
├── components/              # React components
│   ├── chat-section.tsx     # Main chat interface
│   ├── navbar/              # Navigation components
│   ├── ui/                  # Reusable UI components
│   │   ├── chat-container.tsx
│   │   ├── message.tsx
│   │   ├── prompt-input.tsx
│   │   ├── tool.tsx
│   │   ├── blog-search-result.tsx
│   │   └── ...
│   └── ...
├── lib/                     # Utility functions
│   ├── api-client.ts        # LangGraph API integration
│   └── utils.ts             # Helper functions
├── data/                    # Static data
│   └── events.ts            # Timeline events
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
└── package.json            # Dependencies and scripts
```

## Key Components

### Chat Interface
The main chat interface (`components/chat-section.tsx`) provides:
- Real-time message streaming
- Tool call visualization
- Message history management
- Loading states and error handling

### API Client
The LangGraph integration (`lib/api-client.ts`) handles:
- Streaming chat responses
- Tool call tracking with JSON parsing
- Error management
- Type-safe API interactions

### UI Components
Beautiful, accessible components built with:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Framer Motion for animations
- Custom variants with class-variance-authority

## Available Scripts

```bash
# Development
bun dev          # Start dev server with Turbopack

# Production
bun build        # Build for production
bun start        # Start production server

# Code Quality
bun lint         # Run ESLint
```

## AI Chat Features

The AI chatbot can:
- Answer questions about my projects and experience
- Search through my blog posts using selected RAG strategies
- Execute tools and show the retrieval process
- Provide detailed technical information
- Stream responses in real-time
- Compare different RAG approaches

### Tool Visualization
When the AI agent uses tools, users can see:
- Tool name and input parameters
- Execution status
- Output results (retrieved documents, search queries, etc.)
- Collapsible tool details

## RAG Strategy Comparison

### Performance Metrics
Each RAG strategy can be evaluated on:
- **Retrieval Accuracy**: How relevant are the retrieved documents?
- **Response Quality**: How accurate and helpful is the generated answer?
- **Latency**: How fast is the end-to-end response?
- **Context Utilization**: How well does the model use retrieved information?

### Use Cases by Strategy

| Strategy | Best For | Latency | Complexity |
|----------|----------|---------|------------|
| Naive RAG | Simple factual queries | Low | Low |
| Advanced RAG | Complex queries needing refined search | Medium | Medium |
| Modular RAG | Customizable workflows | Medium | High |
| Agentic RAG | Multi-hop reasoning, exploratory search | High | High |

## Customization

### Styling
- Modify `app/globals.css` for global styles
- Update Tailwind configuration in `tailwind.config.js`
- Customize color themes in CSS variables

### Content
- Update events in `data/events.ts`
- Modify chat prompts in `components/chat-section.tsx`
- Customize metadata in `app/layout.tsx`

### API Integration
- Configure API endpoint in `lib/api-client.ts`
- Adjust streaming options in `streamChatResponse`
- Add custom tool handlers for different RAG strategies

## Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Best Practices

- Type-safe with TypeScript
- Accessible UI with Radix primitives
- Performance optimized with Next.js 15
- Modern React patterns (hooks, context)
- Clean component architecture
- Error boundaries and loading states

## Environment Variables

For production deployments, use environment variables:

```bash
NEXT_PUBLIC_API_URL=your-api-endpoint
```

Then update `lib/api-client.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "fallback-url"
```

## Deployment

### Vercel (Recommended)
The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository to Vercel
3. Configure environment variables if needed
4. Deploy!

### Other Platforms
This Next.js application can be deployed to:
- AWS Amplify
- Google Cloud Run
- Azure Static Web Apps
- Netlify
- Docker containers

## Security

This project uses:
- **Next.js 15.5.7+**: Patched for critical RCE vulnerability (GHSA-9qr9-h5gf-34mp)
- **React 19.1.1**: Safe from Server Components vulnerability (CVE-2025-66478)

Run `npm audit` regularly to check for vulnerabilities.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Links

- [Next.js Documentation](https://nextjs.org/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [LangGraph](https://langchain-ai.github.io/langgraph/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This is a portfolio project showcasing modern web development and AI integration techniques. The chatbot demonstrates different RAG strategies and connects to a custom LangGraph backend for intelligent responses about my work and blog content.
