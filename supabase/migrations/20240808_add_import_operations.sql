-- Create import_operations table to track bulk import actions
CREATE TABLE IF NOT EXISTS import_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- 'csv_import', 'google_maps_import', 'bulk_edit', etc.
  operation_status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'reverted', 'partial_revert'
  lead_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Store import details, source info, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  reverted_at TIMESTAMP WITH TIME ZONE,
  reverted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW() + INTERVAL '24 hours') -- Auto-expire old operations
);

-- Add import_operation_id to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS import_operation_id UUID REFERENCES import_operations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_import_operation_id ON leads(import_operation_id);
CREATE INDEX IF NOT EXISTS idx_import_operations_user_id ON import_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_import_operations_created_at ON import_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_operations_status ON import_operations(operation_status);

-- Enable RLS on import_operations
ALTER TABLE import_operations ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_operations
CREATE POLICY "Users can view their own import operations" ON import_operations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import operations" ON import_operations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import operations" ON import_operations
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to get revertable operations (not expired and not already reverted)
CREATE OR REPLACE FUNCTION get_revertable_operations(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  operation_type VARCHAR(50),
  lead_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    io.id,
    io.operation_type,
    io.lead_count,
    io.metadata,
    io.created_at
  FROM import_operations io
  WHERE io.user_id = user_uuid
    AND io.operation_status = 'completed'
    AND io.expires_at > NOW()
  ORDER BY io.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revert an import operation
CREATE OR REPLACE FUNCTION revert_import_operation(operation_uuid UUID, user_uuid UUID)
RETURNS TABLE (
  success BOOLEAN,
  deleted_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_deleted_count INTEGER;
  v_operation_exists BOOLEAN;
  v_already_reverted BOOLEAN;
  v_expired BOOLEAN;
BEGIN
  -- Check if operation exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM import_operations 
    WHERE id = operation_uuid AND user_id = user_uuid
  ) INTO v_operation_exists;

  IF NOT v_operation_exists THEN
    RETURN QUERY SELECT FALSE, 0, 'Operation not found or unauthorized'::TEXT;
    RETURN;
  END IF;

  -- Check if already reverted
  SELECT operation_status = 'reverted' 
  FROM import_operations 
  WHERE id = operation_uuid 
  INTO v_already_reverted;

  IF v_already_reverted THEN
    RETURN QUERY SELECT FALSE, 0, 'Operation already reverted'::TEXT;
    RETURN;
  END IF;

  -- Check if expired
  SELECT expires_at < NOW() 
  FROM import_operations 
  WHERE id = operation_uuid 
  INTO v_expired;

  IF v_expired THEN
    RETURN QUERY SELECT FALSE, 0, 'Operation has expired and cannot be reverted'::TEXT;
    RETURN;
  END IF;

  -- Delete leads associated with this operation
  DELETE FROM leads 
  WHERE import_operation_id = operation_uuid 
    AND user_id = user_uuid;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Update operation status
  UPDATE import_operations 
  SET operation_status = 'reverted',
      reverted_at = NOW()
  WHERE id = operation_uuid;

  RETURN QUERY SELECT TRUE, v_deleted_count, 'Successfully reverted operation'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;