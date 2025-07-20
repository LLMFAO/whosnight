import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const user = url.searchParams.get("user");

    const [assignmentsRes, eventsRes, tasksRes, expensesRes] = await Promise.all([
      supabase
        .from("calendar_assignments")
        .select("*")
        .eq("created_by", user)
        .eq("status", "pending"),
      supabase
        .from("events")
        .select("*")
        .eq("created_by", user)
        .eq("status", "pending"),
      supabase
        .from("tasks")
        .select("*")
        .eq("created_by", user)
        .eq("status", "pending"),
      supabase
        .from("expenses")
        .select("*")
        .eq("created_by", user)
        .eq("status", "pending"),
    ]);

    const error =
      assignmentsRes.error ||
      eventsRes.error ||
      tasksRes.error ||
      expensesRes.error;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    const result = {
      assignments: assignmentsRes.data,
      events: eventsRes.data,
      tasks: tasksRes.data,
      expenses: expensesRes.data,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});