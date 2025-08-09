# Database Migrations

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_missing_lead_columns.sql`
4. Click "Run" to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Direct SQL Connection

If you have direct database access:

```bash
psql -h your-database-host -U postgres -d postgres -f supabase/migrations/add_missing_lead_columns.sql
```

## Migration Details

### add_missing_lead_columns.sql

This migration adds the following columns to the `leads` table:
- `email2` (TEXT) - Secondary email address
- `email3` (TEXT) - Tertiary email address  
- `facebook_url` (TEXT) - Facebook page/profile URL
- `linkedin_url` (TEXT) - LinkedIn company/profile URL
- `twitter_url` (TEXT) - Twitter/X profile URL

These columns were referenced in the application code but were missing from the database schema.