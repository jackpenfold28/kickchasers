# Overview

AFL Stats is a modern web application for tracking and analyzing Australian Football League (AFL) statistics in real-time. The application enables coaches and team managers to log player statistics during games, generate comprehensive reports, and share live game data with fans through a public viewer interface. Built with React and TypeScript, it features a dark-themed interface with glassmorphism design elements and supports both single-team and dual-team tracking modes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: React Router DOM for client-side navigation with nested routes
- **Styling**: Tailwind CSS with custom dark theme and glassmorphism design system
- **State Management**: React hooks (useState, useEffect) for local component state
- **Real-time Updates**: Supabase real-time subscriptions for live game data

## Data Management
- **Primary Database**: Supabase (PostgreSQL) for user profiles, teams, games, events, and squad data
- **Local Storage**: Browser localStorage for theme preferences, team colors, and UI state persistence
- **File Storage**: Supabase Storage for team logos with public URL generation
- **Offline Support**: Dexie.js (IndexedDB wrapper) for local data caching and offline functionality

## Authentication System
- **Provider**: Supabase Auth with email/password authentication
- **Session Management**: Automatic session handling with auth state persistence
- **Protected Routes**: Auth guards for secure areas of the application
- **Email Verification**: Required email confirmation for new user registration

## Core Features
- **Real-time Statistics Tracking**: Live game event logging with immediate UI updates
- **Multi-team Support**: Option to track statistics for both home and away teams
- **Squad Management**: Create and manage multiple squad configurations
- **Game Management**: Full game lifecycle from creation to summary reporting
- **Live Viewer**: Public interface for real-time game viewing without authentication
- **Export Functionality**: PDF and Excel export capabilities for game reports

## Design System
- **Theme**: Dark mode with custom CSS variables for team colors
- **Components**: Reusable UI components with consistent styling patterns
- **Responsive Design**: Mobile-first approach with grid layouts and flexible components
- **Progressive Web App**: Service worker registration and web app manifest

# External Dependencies

## Backend Services
- **Supabase**: Primary backend-as-a-service providing PostgreSQL database, real-time subscriptions, authentication, and file storage
- **Vercel**: Deployment platform with automatic deployments and edge network distribution

## Key Libraries
- **@supabase/supabase-js**: Official Supabase client for database operations and auth
- **react-router-dom**: Client-side routing and navigation
- **tailwindcss**: Utility-first CSS framework for styling
- **lucide-react**: Icon library for consistent iconography
- **date-fns**: Date manipulation and formatting utilities
- **dexie**: IndexedDB wrapper for local data storage

## Export and Reporting
- **jspdf & jspdf-autotable**: PDF generation for game reports and statistics
- **xlsx**: Excel file generation for data export
- **html2canvas**: Screenshot capture for visual reports
- **sonner**: Toast notifications for user feedback

## Development Tools
- **TypeScript**: Static type checking and improved developer experience
- **Vite**: Fast build tool with hot module replacement
- **PostCSS & Autoprefixer**: CSS processing and browser compatibility