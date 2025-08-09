# Undo/Revert Feature Setup

## Quick Setup

To enable the undo/revert functionality, you need to run the migration in your Supabase dashboard.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration from: `supabase/migrations/20240808_add_import_operations.sql`
4. Click "Run"

### What This Adds:

- **Undo Imports**: After any import (CSV, Google Maps, etc.), you'll see an undo notification
- **5 Minute Window**: You have 5 minutes to undo any import
- **Import History**: All imports are tracked with metadata
- **Smart Revert**: Only deletes leads that haven't been modified since import

### How It Works:

1. When you import leads, an "import operation" record is created
2. All imported leads are tagged with the operation ID
3. The undo notification appears with a countdown timer
4. Clicking "Undo" deletes all leads from that import
5. After 5 minutes, the undo option expires

### Usage:

After the migration is run, the feature is automatically active. You'll see:

- An undo notification after each import with a countdown
- The notification shows how many leads were imported
- Click "Undo" to revert the entire import
- Click "Dismiss" to keep the import

This is perfect for when:
- You accidentally import the wrong file
- The location override doesn't work as expected
- You need to fix import settings and try again
- You realize you selected the wrong source type

The feature is already integrated into your app - you just need to run the migration!