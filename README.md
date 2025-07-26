# Lead Tracker Pro - React/Next.js Version

A modern, multi-tenant ready lead tracking application built with React, Next.js, and TypeScript.

## 🚀 Features

- **Modern Tech Stack**: React 18, Next.js 14, TypeScript, Tailwind CSS
- **State Management**: Zustand for simple, powerful state management
- **Component Library**: Headless UI for accessible components
- **Real-time Updates**: Instant UI updates with optimistic mutations
- **AI-Powered**: OpenAI integration for intelligent lead extraction
- **Multi-tenant Ready**: Architecture prepared for multiple users/organizations
- **Responsive Design**: Works perfectly on desktop and mobile

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Google Apps Script deployment (from original project)
- OpenAI API key (optional, for AI features)

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
cd lead-tracker-react
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=your-google-apps-script-url
OPENAI_API_KEY=your-openai-api-key
```

3. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # React components
│   ├── modals/         # Modal components
│   └── ...             # Other components
├── lib/                 # Libraries and utilities
│   ├── api.ts          # API client functions
│   └── store.ts        # Zustand store
├── types/               # TypeScript types
├── utils/               # Utility functions
└── hooks/               # Custom React hooks
```

## 🔧 Key Technologies

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios

## 🚀 Deployment

### Vercel (Recommended)
```bash
npx vercel
```

### Self-hosted
```bash
npm run build
npm start
```

## 🔄 Migrating from Vanilla JS

This React version maintains compatibility with your existing:
- Google Sheets backend
- Google Apps Script API
- Data structure and schema

No changes needed to your backend!

## 🎯 Future Enhancements

### Multi-tenancy
- User authentication (NextAuth.js)
- Organization management
- Role-based access control
- Isolated data per tenant

### Database Integration
- PostgreSQL with Prisma
- Supabase for real-time sync
- Redis for caching

### Additional Features
- Real-time collaboration
- Advanced analytics dashboard
- Email/SMS notifications
- Webhook integrations
- API for third-party access

## 🧪 Development

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_GOOGLE_SCRIPT_URL` | Your Google Apps Script URL | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js and React# lead-tracker
# lead-tracker
# lead-tracker
