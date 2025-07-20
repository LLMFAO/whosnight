import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    const { familyCode } = await req.json();
    
    if (!familyCode) {
      return new Response(JSON.stringify({ error: "Family code is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the family by code
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id")
      .eq("code", familyCode)
      .single();

    if (familyError || !family) {
      return new Response(JSON.stringify({ error: "Invalid family code" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: Get user ID from auth context and update their family_id
    // For now, this is a placeholder that would need proper auth integration
    
    return new Response(JSON.stringify({ 
      success: true, 
      familyId: family.id,
      message: "Successfully joined family" 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});