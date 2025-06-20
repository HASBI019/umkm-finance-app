// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wljmrmdhtrtuixhqywia.supabase.co'  
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsam1ybWRodHJ0dWl4aHF5d2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MTYyMjgsImV4cCI6MjA2NTk5MjIyOH0.fJZsAULY68Jq0kminixg1iyNsWuNvXBaIanvyhxHtoE'   

export const supabase = createClient(supabaseUrl, supabaseKey)
