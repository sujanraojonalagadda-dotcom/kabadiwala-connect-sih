# Kabadiwala Connect — Technology Stack Decisions

## Status

Phase 1 — Technology Selection

## Frontend

Next.js + TypeScript

## UI

Tailwind CSS + shadcn/ui

## Backend

Next.js server-side/API architecture
with modular backend organization

## Database

PostgreSQL

## ORM

Prisma

## Authentication

Supabase Auth

## File Storage

Supabase Storage

## AI

Replaceable AI adapter.
Specific provider/model: TBD.

## Location

Device/browser GPS with manual location fallback.

## Notifications

In-app notifications for prototype.
External provider: TBD.

## Deployment

Vercel + Supabase proposed for SIH prototype.

## Source Control

GitHub

## Important Principle

No implementation provider or service should be treated as
confirmed unless it is actually configured and tested.