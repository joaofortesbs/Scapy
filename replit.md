# Overview

Scapy is a mobile-optimized NoFap tracking application built with a React frontend and Express.js backend. The application helps users track their progress in abstaining from pornography through a clean, modern interface featuring a weekly tracker, real-time timer, and goal management system. The app uses a dark theme with cyan accents (#000515 and #00F6FF) and is designed specifically for mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for consistent theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile-First Design**: Optimized for mobile devices with responsive components

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints for user data and progress tracking
- **Database Layer**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Storage Strategy**: In-memory storage for development with interfaces for easy database integration
- **Session Management**: Express session handling with PostgreSQL session store support

## Database Schema
- **Users Table (usuarios)**: Consolidated table storing all user data including:
  - User credentials (email, password_hash)
  - Profile information (nomeCompleto, imagemAvatar)
  - Quiz context (genero, frequencia, motivacao, gatilhos, religiao, quiz_completed)
  - Timer data (timer_start_date, timer_is_active)
  - Account status (is_active, last_login, created_at, updated_at)
- **Schema Validation**: Zod schemas for runtime type checking and validation

## Component Structure
- **Dashboard**: Main application interface with timer, weekly tracker, and navigation
- **Weekly Tracker**: Interactive component for marking daily progress
- **Timer Component**: Real-time countdown display showing time since start date
- **Bottom Navigation**: Mobile-optimized navigation with inactive sections for future features
- **Header Component**: Logo display and profile/goals access

## Key Features
- **Real-time Timer**: Displays days, hours, minutes, and seconds since start date
- **Weekly Progress Tracking**: Visual circular indicators for each day of the week
- **Streak Tracking**: Current and best streak counters
- **Goal Management**: Framework for setting and tracking personal goals
- **Profile Image System**: 
  - Upload profile images to Replit Object Storage
  - Images stored with presigned URLs and ACL policies
  - Secure image management with JWT authentication
  - Profile images displayed in header, profile page, and ranking cards
  - Fallback to DiceBear avatars when no image is set
- **Mobile Optimization**: Touch-friendly interface designed for mobile devices

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing library for React
- **drizzle-orm**: Type-safe ORM for database operations
- **@neondatabase/serverless**: Serverless PostgreSQL driver

## UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variant management
- **clsx**: Utility for conditional className joining

## Form and Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation library
- **drizzle-zod**: Integration between Drizzle and Zod

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **esbuild**: Fast JavaScript bundler for production builds

## Database and Sessions
- **connect-pg-simple**: PostgreSQL session store for Express
- **drizzle-kit**: Database migrations and schema management

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **lucide-react**: Icon library
- **cmdk**: Command palette component