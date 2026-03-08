
---
title: Hostit 개요
date: 2025-05-04
tags:
  - project
  - HostIt
  - MCP
  - LangChain
  - AI
draft: false
enableToc: true
description: "MCP(Model Context Protocol)를 활용한 AI 도구 관리 플랫폼 Hostit의 아키텍처와 핵심 기능 소개"
summary: "LangChain의 Model Context Protocol(MCP)을 활용하여 여러 AI 모델 서버와 통합하는 웹 애플리케이션 HostIt. 서버 관리, 도구 접근, 프로필 관리 등의 핵심 아키텍처를 설명한다."
published: 2025-05-04
modified: 2025-05-04
---
## Introduction
HostIt is a web application that leverages LangChain's Model Context Protocol (MCP) to connect with and manage multiple AI model servers. The application serves as a central hub for registering, organizing, and accessing tools from various MCP-compliant servers.

## Core Architecture

### MCP Integratio
The application implements a server-centric approach to MCP integration, where:
- Servers are registered as endpoints with the system
- Tools are accessed through these registered servers
- LangChain's MultiServerMCPClient is utilized to connect to multiple servers simultaneously

### Key Components

#### Server Management
- **Server Registration**: Users can register MCP-compliant servers
- **Server Groups**: Servers can be organized into logical groups
- **User-Specific Servers**: Each user has access to their own server configurations
- **Enable/Disable Functionality**: Servers can be toggled on/off as needed

#### MCP Server Profiles
- **Multiple Profiles**: Users can create multiple named profiles/groups of MCP server combinations
- **Optimal Combinations**: Ability to save effective combinations of servers that work well together
- **Bulk Enable/Disable**: Toggle entire groups of servers on/off with a single action
- **Quick Switching**: Easily switch between different server group configurations
- **Profile Management**: Create, edit, delete, and share server profiles

#### Persistence Layer
- **Supabase Integration**: Server configurations and groups are stored in Supabase
- **In-Memory Fallback**: Local storage options available when Supabase is not connected
- **Profile Storage**: Saved profiles persist across sessions for each user

#### API Endpoints
- `/api/servers`: Endpoints for server registration and management
- `/api/tools`: Endpoints for accessing tools from registered servers
- `/api/chat`: Chat-related functionality that leverages MCP tools
- `/api/profiles`: Endpoints for managing MCP server profiles and combinations

## Implementation Details

### Server Service
The server service is responsible for:
- Managing server connections
- Registering new servers
- Providing access to server tools
- Maintaining server status

### Client Wrapper
A client wrapper encapsulates LangChain's MultiServerMCPClient to:
- Simplify connections to multiple servers
- Provide a unified interface for tool access
- Handle connection errors and retries

### Server Storage
The storage mechanism:
- Persists server configurations in Supabase
- Handles server group organization
- Provides CRUD operations for server management
- Supports user-specific data isolation

### Profile Manager
The profile manager handles:
- Creating and storing combinations of MCP servers
- Enabling/disabling server groups as units
- Tracking effective combinations discovered by users
- Providing a system for naming and describing different configurations

## Future Enhancements
- Enhanced server authentication methods
- Tool discovery and categorization
- Performance monitoring for server connections
- More sophisticated server grouping mechanisms
- Advanced error handling and recovery strategies
- Profile sharing and collaboration features
- Automatic profile optimization based on usage patterns
- Profile performance metrics and analytics 