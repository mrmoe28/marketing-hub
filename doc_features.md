# Clientbase - Marketing Hub Documentation

## Overview
Production-ready Next.js 15 application for customer relationship management, email marketing campaigns, and AI-powered communication at scale.

## Core Features

### 1. Client Management
- **CSV Import**: Upload customer lists with intelligent column mapping
- **Client Database**: Store comprehensive client information (contact details, address, company)
- **Custom Fields**: Flexible JSON storage for additional CSV columns
- **Tagging System**: Organize clients with tags for segmentation
- **Client Folders**: Per-client file storage with Vercel Blob integration
- **Search & Filter**: Query clients by name, email, company, location, or tags

### 2. Email Campaign Management
- **Campaign Builder**: Create, draft, and schedule email campaigns
- **AI Email Writing**: Claude-powered humanized email copy generation
- **Email Templates**: Reusable templates with category organization
- **Merge Tags**: Personalization with [First Name], [Company], etc.
- **Rich Text Editor**: TipTap-powered email composition
- **Test Emails**: Preview campaigns with sample data

### 3. Email Tracking & Analytics
- **Open Tracking**: Pixel-based email open detection
- **Click Tracking**: Link click monitoring
- **Campaign Statistics**: Open rates, click rates, and performance metrics
- **Unsubscribe Management**: Automated unsubscribe handling
- **Event Logging**: Comprehensive activity tracking

### 4. AI Agent Capabilities
The app includes an autonomous AI agent with 14 comprehensive tools:

#### Campaign Tools
- `createCampaign`: Create email campaigns with recipients
- `sendCampaign`: Start sending campaigns immediately
- `getCampaignStats`: Get performance analytics

#### Template Tools
- `createEmailTemplate`: Build reusable email templates
- `updateEmailTemplate`: Modify existing templates
- `sendTestEmail`: Preview templates with sample data
- `listTemplates`: Browse templates by category

#### Client Tools
- `searchClients`: Query by location, tags, or text
- `addClient`: Add new clients to database
- `tagClients`: Bulk tag management
- `getClientStats`: Client distribution analytics

#### Booking Tools
- `createBooking`: Schedule appointments
- `updateBookingStatus`: Manage booking lifecycle
- `listBookings`: Filter by date/status

### 5. Booking System
- **Appointment Scheduling**: Book services with date/time selection
- **Client Association**: Link bookings to existing clients
- **Status Management**: PENDING → CONFIRMED → COMPLETED workflow
- **Duration Tracking**: Configurable appointment lengths
- **Notes System**: Client requests and internal staff notes
- **Google Calendar Integration**: Ready for event sync
- **Timezone Support**: Multi-timezone booking handling

### 6. Conversation History
- **Chat Interface**: Interactive AI agent conversations
- **Message Persistence**: Store conversation history in database
- **Topic Tracking**: Automatic topic categorization
- **AI Summaries**: Generate conversation summaries
- **Activity Logging**: Track all agent tool executions with status, duration, and results

### 7. Company Profile Management
- **Branding**: Store logo, colors, and brand voice
- **Contact Details**: Company information for email signatures
- **Email Defaults**: Default sender name and email
- **Industry Settings**: Business context for AI personalization

## Tech Stack

### Frontend
- **Next.js 15**: App Router with Server Components
- **React 19**: Latest React features
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **Radix UI**: Accessible primitives
- **Lucide Icons**: Icon system
- **TipTap**: Rich text editor

### Backend
- **Prisma**: Type-safe ORM
- **PostgreSQL**: Primary database (Neon/Supabase compatible)
- **Next.js API Routes**: RESTful endpoints

### AI & Email
- **Anthropic Claude**: AI writing and agent capabilities
- **Resend**: Email delivery service
- **OpenAI**: Alternative AI provider support

### Storage
- **Vercel Blob**: File storage (default)
- **S3/Supabase**: Alternative storage options

### Development
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Playwright**: E2E testing

## Database Schema

### Client Model
- Contact information (email, name, phone)
- Address fields (street, city, state, postal code)
- Custom fields (flexible JSON storage)
- Relationships: Tags, Email Jobs, Events, Subscriptions, Bookings

### Campaign Model
- Campaign details (name, subject, body)
- Sender information (from email/name)
- Status workflow (DRAFT → SCHEDULED → SENDING → SENT → CANCELLED)
- Scheduling support

### Email Job Model
- Individual email tracking per recipient
- Status per email (PENDING, SENDING, SENT, FAILED, SUPPRESSED)
- Tracking tokens (open, click, unsubscribe)
- Timestamp tracking (sent, opened, clicked, unsubscribed)

### Tag System
- Tag model with unique names
- Many-to-many relationship with clients
- Assignment timestamp tracking

### Segment Model
- Saved audience queries
- JSON-based query storage

### Email Template Model
- Reusable templates with categorization
- AI-created flag for agent-generated templates
- HTML and text versions

### Booking Model
- Appointment scheduling
- Client association (optional)
- Service type and duration
- Status workflow (PENDING → CONFIRMED → COMPLETED → CANCELLED/NO_SHOW)
- Google Calendar integration fields

### AI Models
- **CompanyProfile**: Business branding and defaults
- **AgentMemory**: Persistent agent knowledge
- **ConversationHistory**: Chat history with summaries
- **AgentActivity**: Tool execution logs with performance metrics

## API Routes

### Campaign Management
- `POST /api/campaigns/create`: Create new campaign
- `POST /api/campaigns/send`: Send campaign to recipients

### Client Management
- `POST /api/import`: CSV import with column mapping

### Email Templates
- `GET /api/templates`: List all templates
- `POST /api/templates`: Create new template
- `PATCH /api/templates/[id]`: Update template
- `DELETE /api/templates/[id]`: Delete template
- `POST /api/templates/[id]/test-email`: Send test email

### Tracking
- `GET /api/tracking/o/[token]`: Track email opens
- `GET /api/tracking/c/[token]`: Track link clicks
- `GET /api/unsubscribe/[token]`: Handle unsubscribes

### AI Agent
- `POST /api/chat`: Interact with AI agent
- `POST /api/ai/write`: Generate email copy

### Bookings
- `GET /api/bookings`: List bookings
- `POST /api/bookings`: Create booking
- `PATCH /api/bookings/[id]`: Update booking
- `GET /api/bookings/availability`: Check available slots

### Conversations
- `GET /api/conversations`: List conversations
- `POST /api/conversations`: Create conversation
- `GET /api/conversations/[id]`: Get conversation details

### Profile
- `GET /api/profile`: Get company profile
- `PATCH /api/profile`: Update company profile

### Storage
- `POST /api/storage/upload`: Upload files to Vercel Blob

## Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `RESEND_API_KEY`: Resend API key for email sending
- `ANTHROPIC_API_KEY`: Claude API key for AI features
- `APP_URL`: Application URL for tracking links
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token

### Optional
- `OPENAI_API_KEY`: Alternative AI provider
- `EMAIL_FROM`: Default sender email
- `EMAIL_FROM_NAME`: Default sender name
- `NEXTAUTH_SECRET`: NextAuth secret for authentication
- `NEXTAUTH_URL`: NextAuth URL

## Scripts

```bash
npm run dev          # Start development server (Turbopack disabled)
npm run build        # Build for production (includes Prisma generation)
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

## Key Features Implementation

### AI Email Humanizer
- Located in `/src/lib/humanizer.ts`
- Uses Claude to generate natural, conversational email copy
- Avoids marketing clichés and corporate jargon

### Email Tracking
- Located in `/src/lib/tracking.ts`
- Generates unique tokens per email job
- Tracks opens via 1x1 pixel
- Tracks clicks via redirect URLs
- Records timestamps in database

### CSV Import
- Located in `/src/lib/csv.ts`
- Uses PapaParse for CSV parsing
- Smart column mapping
- Duplicate detection by email
- Custom field preservation

### Storage System
- Located in `/src/lib/storage.ts`
- Vercel Blob integration
- Swappable storage providers
- Per-client folder organization

### Email Provider
- Located in `/src/lib/email.ts`
- Resend integration
- HTML and text email support
- Template wrapping utilities

### AI Agent Tools
- Located in `/src/lib/agent-tools.ts`
- 14 comprehensive tools for autonomous operations
- Activity logging with status and performance tracking
- Tool execution routing with error handling
- Comprehensive input validation

## Pages & Routes

### Dashboard Routes (Protected)
- `/dashboard`: Main dashboard with stats
- `/clients`: Client list and management
- `/clients/[id]`: Individual client details
- `/campaigns`: Campaign list
- `/campaigns/new`: Create new campaign
- `/templates`: Email template library
- `/templates/[id]/edit`: Template editor
- `/bookings`: Booking calendar and list
- `/import`: CSV import interface
- `/settings`: Company profile and settings

### Public Routes
- `/`: Landing page
- `/book`: Public booking form
- `/api/*`: API endpoints

## UI Components

### Custom Components
- `AgentChat`: AI agent conversation interface with visual tool execution feedback
- `BookingCalendar`: Appointment scheduling calendar
- `BookingRequestForm`: Public booking form
- `ChatHistory`: Conversation history display
- `ClientTable`: Searchable client list
- `CSVImport`: CSV upload and mapping interface
- `EmailEditor`: Campaign email composition
- `EmailPreview`: Template preview with sample data
- `RichTextEditor`: TipTap-powered editor
- `SegmentBuilder`: Audience segmentation tool
- `SettingsForm`: Company profile editor
- `Sidebar`: Navigation sidebar
- `TemplateEditForm`: Template editing interface
- `TemplateList`: Template library grid

### UI Library (shadcn/ui)
- Accordion, Alert Dialog, Avatar, Badge, Button, Card
- Checkbox, Dialog, Dropdown Menu, Input, Label
- Select, Separator, Switch, Table, Tabs, Textarea
- Toast, Theme Toggle, Theme Provider

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Database Setup
1. Create PostgreSQL database (Neon/Supabase)
2. Add `DATABASE_URL` to environment
3. Run migrations: `npm run db:migrate`
4. Seed database: `npm run db:seed`

### Email Configuration
1. Create Resend account
2. Add verified domain
3. Add `RESEND_API_KEY` to environment

### AI Configuration
1. Get Anthropic API key
2. Add `ANTHROPIC_API_KEY` to environment

## Development Workflow

### Local Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Setup database
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run dev
```

### Adding New Features
1. Update Prisma schema if needed
2. Run migrations: `npm run db:migrate`
3. Update TypeScript types
4. Build UI components
5. Add API routes
6. Test locally
7. Deploy to Vercel

## Best Practices

### Database
- Use Prisma for all database operations
- Always include proper indexes for frequently queried fields
- Use cascading deletes for related records
- Store flexible data in JSON fields when appropriate

### Email
- Always provide both HTML and text versions
- Use merge tags for personalization
- Include unsubscribe links in all marketing emails
- Track email performance metrics

### AI Agent
- All tool executions are logged with status and performance metrics
- Tools handle errors gracefully and return structured results
- Activity logs are stored in the database for debugging and analytics
- Conversation history maintains context across sessions

### Security
- Validate all user inputs
- Use environment variables for secrets
- Implement proper authentication/authorization
- Sanitize email content to prevent XSS

### Performance
- Use Server Components where possible
- Implement proper caching strategies
- Optimize database queries with proper indexes
- Use pagination for large lists

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check `DATABASE_URL` format
2. **Email sending fails**: Verify Resend API key and domain
3. **AI features not working**: Check Anthropic API key
4. **File upload errors**: Verify Blob token configuration
5. **Build errors**: Run `npx prisma generate` before building

### Debugging
- Check browser console for client-side errors
- Check server logs in Vercel dashboard
- Use Prisma Studio to inspect database
- Test API routes with tools like Postman

## Future Enhancements

### Planned Features
- SMS campaign support
- Advanced segmentation builder
- A/B testing for campaigns
- Email sequence automation
- Enhanced analytics dashboard
- Calendar integrations (Google, Outlook)
- Webhook support for real-time events
- Multi-user support with roles/permissions
- Custom domain for tracking links
- Advanced AI agent capabilities with learning

### Integration Opportunities
- CRM integrations (Salesforce, HubSpot)
- Payment processing (Stripe, Square)
- Social media scheduling
- Landing page builder
- Form builder for lead capture
- Survey and feedback tools
