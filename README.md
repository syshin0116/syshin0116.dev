# Blog-RAG Portfolio

A modern, AI-powered portfolio website that allows visitors to chat with an intelligent agent about your projects, blog posts, and technical experience. Built with Next.js 15, LangGraph, and a beautiful component library.

![Portfolio Preview](/public/page-preview.png)

## ✨ Features

- 🤖 **AI-Powered Chat Interface** - Interactive chatbot using LangGraph SDK for intelligent conversations
- 🎨 **Modern UI/UX** - Beautiful, responsive design with Tailwind CSS and Radix UI components
- 🌓 **Dark Mode Support** - Seamless theme switching with next-themes
- ⚡ **Real-time Streaming** - Stream AI responses with tool call visualization
- 📱 **Fully Responsive** - Optimized for all device sizes
- 🎯 **Tool Execution Visualization** - See AI agent's tool calls and results in real-time
- 🚀 **Performance Optimized** - Built with Next.js 15 and Turbopack for fast development

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.1.1
- **TypeScript**: Type-safe development
- **Styling**: Tailwind CSS 4.0.8
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion

### AI/Backend
- **LangGraph SDK**: For AI agent orchestration
- **LangChain Core**: Foundation for LLM interactions
- **Streaming API**: Real-time message streaming

### Developer Experience
- **Package Manager**: Bun (fastest JavaScript runtime)
- **Turbopack**: Ultra-fast development builds
- **ESLint**: Code quality and consistency

## 📦 Getting Started

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
# or
yarn install
# or
pnpm install
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
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser**

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

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

## 🎨 Key Components

### Chat Interface
The main chat interface (`components/chat-section.tsx`) provides:
- Real-time message streaming
- Tool call visualization
- Message history management
- Loading states and error handling

### API Client
The LangGraph integration (`lib/api-client.ts`) handles:
- Streaming chat responses
- Tool call tracking
- Error management
- Type-safe API interactions

### UI Components
Beautiful, accessible components built with:
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Framer Motion for animations
- Custom variants with class-variance-authority

## 🚀 Available Scripts

```bash
# Development
bun dev          # Start dev server with Turbopack

# Production
bun build        # Build for production
bun start        # Start production server

# Code Quality
bun lint         # Run ESLint
```

## 🤖 AI Chat Features

The AI chatbot can:
- Answer questions about your projects and experience
- Search through your blog posts
- Execute tools and show the process
- Provide detailed technical information
- Stream responses in real-time

### Tool Visualization
When the AI agent uses tools, users can see:
- Tool name and input parameters
- Execution status
- Output results
- Collapsible tool details

## 🎯 Customization

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
- Add custom tool handlers

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🌟 Best Practices

- ✅ Type-safe with TypeScript
- ✅ Accessible UI with Radix primitives
- ✅ Performance optimized with Next.js 15
- ✅ Modern React patterns (hooks, context)
- ✅ Clean component architecture
- ✅ Error boundaries and loading states

## 📝 Environment Variables

Currently, the API URL is hardcoded. For production deployments, consider using environment variables:

```bash
NEXT_PUBLIC_API_URL=your-api-endpoint
```

Then update `lib/api-client.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "fallback-url"
```

## 🚢 Deployment

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 💡 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [LangGraph](https://langchain-ai.github.io/langgraph/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Note**: This is a portfolio project showcasing modern web development and AI integration techniques. The chatbot connects to a custom LangGraph backend for intelligent responses.
