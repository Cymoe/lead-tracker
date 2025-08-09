-- Reset the failed import status for the search result
UPDATE apify_search_results 
SET import_status = 'ready',
    import_completed_at = NULL,
    leads_imported = 0,
    import_operation_id = NULL,
    import_error = NULL
WHERE import_status = 'completed' 
  AND leads_imported = 0;
EOF < /dev/null