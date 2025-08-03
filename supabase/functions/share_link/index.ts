import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  try {
    const { message } = await req.json();
    
    // Generate a unique link ID
    const linkId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Get user ID from auth header
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
    
    // Create share link in database
    const { data: shareLink, error: insertError } = await supabase
      .from("share_links")
      .insert({
        link_id: linkId,
        created_by: user.id,
        message: message,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
      
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Generate the share URL
    const domain = "https://whosnight.netlify.app";
    const shareUrl = `${domain}/share/${shareLink.link_id}`;
    
    return new Response(JSON.stringify({ 
      success: true,
      message: message,
      shareUrl: shareUrl,
      linkId: shareLink.link_id
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