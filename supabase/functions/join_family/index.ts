import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    
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

    // Update the user's family_id
    const { error: updateError } = await supabase
      .from("users")
      .update({ family_id: family.id })
      .eq("id", user.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
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