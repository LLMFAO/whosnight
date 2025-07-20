import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    // Log the external notification action
    const { error: logError } = await supabase
      .from("action_logs")
      .insert({
        userId: 1, // TODO: Get from auth context
        action: "notify_external",
        entityType: null,
        entityId: null,
        details: "User notified co-parent externally",
        requestedBy: 1, // TODO: Get from auth context
        approvedBy: null,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      });

    if (logError) {
      return new Response(JSON.stringify({ error: logError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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