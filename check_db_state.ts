
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://xhhtkjtcdeewesijxbts.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaHRranRjZGVld2VzaWp4YnRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzNDI1OCwiZXhwIjoyMDc2NzEwMjU4fQ.Iow-oAe9_srUtAGT1T7TJj8q53cskle2ybJCjQ04YGc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log("Checking shop items...");
    const { data: items, error: itemsError } = await supabase.from('shop_items').select('*');
    if (itemsError) console.error("Error fetching shop_items:", itemsError);
    else console.log(`Found ${items?.length} shop items. Examples:`, items?.slice(0, 3));

    console.log("\nChecking finance_inventory...");
    const { data: inventory, error: invError } = await supabase.from('finance_inventory').select('*');
    if (invError) console.error("Error fetching inventory:", invError);
    else console.log(`Found ${inventory?.length} inventory items. Examples:`, inventory?.slice(0, 3));
}

checkData();
