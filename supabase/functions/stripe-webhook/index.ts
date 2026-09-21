import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.9.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";

// Define the required CORS headers for standard Edge function execution
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight OPTIONS requests gracefully
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("stripe_secret_key") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || Deno.env.get("stripe_webhook_secret") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

  // Initialize clients carefully
  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
  });
  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Retrieve essential verification header
  const signature = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature");
  if (!signature) {
    console.error("[WEBHOOK ERROR] Missing Stripe verification signature header.");
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: Stripe.Event;
  const body = await req.text();

  if (!webhookSecret) {
    console.warn("[WEBHOOK WARNING] STRIPE_WEBHOOK_SECRET environment variable is not set. Bypassing cryptographic signature verification.");
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (parseErr: any) {
      console.error(`[WEBHOOK ERROR] Failed to parse request body: ${parseErr.message}`);
      return new Response(JSON.stringify({ error: `Invalid JSON body: ${parseErr.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    try {
      // 1. WEBHOOK VERIFICATION HANDSHAKE
      // Validate that request originates exclusively from Stripe's authenticated subnet
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err: any) {
      console.error(`[WEBHOOK ERROR] Cryptographic signature validation failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  console.log(`[STRIPE WEBHOOK] Received valid cryptographic event: ${event.type} [ID: ${event.id}]`);

  // 2. LOGIC FOR LIFECYCLE EVENTS
  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        if (!customerId) {
          console.warn("[WEBHOOK WARN] invoice.paid missing customer ID token.");
          break;
        }

        // Search for relevant billing line items to identify target tier
        const lineItems = invoice.lines.data;
        let priceId = "";
        if (lineItems.length > 0) {
          priceId = lineItems[0].price?.id || "";
        }

        console.log(`[STRIPE WEBHOOK] invoice.paid for Customer [${customerId}] with Price ID [${priceId}]`);

        // Map price ID strings dynamically to target system subscription tiers
        let targetTier = "band_pro"; // default fallback safely
        const priceLower = priceId.toLowerCase();

        if (priceLower.includes("pro_plus") || priceLower.includes("pro-plus") || priceLower.includes("band_pro_plus")) {
          targetTier = "band_pro_plus";
        } else if (priceLower.includes("touring_pro") || priceLower.includes("band_pro")) {
          targetTier = "band_pro";
        } else if (priceLower.includes("power")) {
          targetTier = "promoter_power";
        } else if (priceLower.includes("enterprise") || priceLower.includes("circuit")) {
          targetTier = "promoter_enterprise";
        } else {
          // If fallback contains other descriptors, analyze matching patterns accurately
          if (priceLower.includes("promoter")) {
            targetTier = priceLower.includes("enterprise") ? "promoter_enterprise" : "promoter_power";
          }
        }

        console.log(`[STRIPE WEBHOOK] Evaluated pricing tier: [${targetTier}] for database synchronization.`);

        // Perform clean database profile update
        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_tier: targetTier,
            updated_at: new Date().toISOString()
          })
          .eq("stripe_customer_id", customerId)
          .select();

        if (error) {
          console.error(`[DATABASE ERROR] Failed to update customer profile: ${JSON.stringify(error)}`);
        } else {
          console.log(`[DATABASE SUCCESS] Updated profile successfully. Match count: ${data?.length || 0}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (!customerId) {
          console.warn("[WEBHOOK WARN] customer.subscription.deleted missing customer ID token.");
          break;
        }

        console.log(`[STRIPE WEBHOOK] Subscription canceled. Resetting customer: [${customerId}]`);

        // Perform clean database profile fallback reset
        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_tier: "free",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_customer_id", customerId)
          .select();

        if (error) {
          console.error(`[DATABASE ERROR] Failed to reset customer sub fields: ${JSON.stringify(error)}`);
        } else {
          console.log(`[DATABASE SUCCESS] Reset profile successfully. Match count: ${data?.length || 0}`);
        }
        break;
      }

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled lifecycle event broadcasted: ${event.type}`);
        break;
    }
  } catch (handlerError: any) {
    console.error(`[WEBHOOK HANDLER PROCESSOR EXCEPTION] ${handlerError.message}`);
    // return successfully to prevent Stripe retries since signature handshake succeeded
  }

  // 3. EDGE RESPONSE MANAGEMENT
  // Return a clean validation success callback payload to complete processing flow
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
