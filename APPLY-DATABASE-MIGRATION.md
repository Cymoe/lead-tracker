# Apply Database Migration - Social Media Fields

You need to apply the database migration to add the new fields to your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/002_add_social_media_fields.sql`
6. Click **Run** to execute the migration
7. You should see a success message

## Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're in your project directory
cd /Users/myleswebb/Apps/lead-tracker-react

# Push the migration to your database
supabase db push
```

## Verify the Migration

After running the migration, verify it worked:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `leads` table
3. Check that these new columns exist:
   - `email2`
   - `email3`
   - `facebook_url`
   - `linkedin_url`
   - `twitter_url`
   - `full_address`
   - `search_query`

## What This Migration Does

- Adds 7 new columns to the `leads` table for enhanced contact tracking
- Creates indexes on social media URL fields for better performance
- Adds documentation comments to each field
- All fields are optional (nullable) so existing data won't be affected

After applying this migration, your CSV imports will be able to save all the new fields! 