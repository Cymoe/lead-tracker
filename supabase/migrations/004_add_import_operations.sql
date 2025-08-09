-- Create import_operations table to track bulk import operations
CREATE TABLE IF NOT EXISTS public.import_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('bulk_import', 'csv_import', 'google_maps_import', 'manual_add')),
  source TEXT NOT NULL CHECK (source IN ('FB Ad Library', 'Instagram Manual', 'Google Maps', 'CSV Import')),
  lead_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reverted_at TIMESTAMP WITH TIME ZONE,
  reverted_by UUID REFERENCES auth.users(id),
  CONSTRAINT positive_lead_count CHECK (lead_count >= 0)
);

-- Add import_operation_id to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS import_operation_id UUID REFERENCES public.import_operations(id) ON DELETE SET NULL;

-- Create indexes for efficient querying
CREATE INDEX idx_import_operations_user_id ON public.import_operations(user_id);
CREATE INDEX idx_import_operations_created_at ON public.import_operations(created_at DESC);
CREATE INDEX idx_import_operations_reverted_at ON public.import_operations(reverted_at) WHERE reverted_at IS NULL;
CREATE INDEX idx_leads_import_operation_id ON public.leads(import_operation_id) WHERE import_operation_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.import_operations ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_operations
CREATE POLICY "Users can view their own import operations"
  ON public.import_operations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import operations"
  ON public.import_operations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import operations"
  ON public.import_operations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.import_operations IS 'Tracks bulk import operations for undo functionality';
COMMENT ON COLUMN public.import_operations.operation_type IS 'Type of import operation performed';
COMMENT ON COLUMN public.import_operations.source IS 'Source platform for the imported leads';
COMMENT ON COLUMN public.import_operations.metadata IS 'Additional data about the import (city, service_type, keywords, etc)';
COMMENT ON COLUMN public.import_operations.reverted_at IS 'Timestamp when this operation was reverted/undone';