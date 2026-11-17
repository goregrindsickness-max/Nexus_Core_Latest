import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.9.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, email, returnUrl, refreshUrl, country = "US", accountId } = await req.json();

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const appOrigin = returnUrl ? new URL(returnUrl).origin : "https://localhost:3000";
    const finalReturnUrl = returnUrl || `${appOrigin}?stripe_connect=success`;
    const finalRefreshUrl = refreshUrl || `${appOrigin}?stripe_connect=refresh`;

    if (!stripeSecret) {
      // In development or test sandbox without live Stripe keys, provide a structured sandbox onboarding session
      const mockAccountId = accountId || `acct_express_${Math.random().toString(36).substring(2, 10)}`;
      return new Response(
        JSON.stringify({
          url: `${finalReturnUrl}&account_id=${mockAccountId}&status=complete`,
          accountId: mockAccountId,
          status: "connected",
          mode: "sandbox",
          message: "Stripe Connect Express onboarding simulated for testing environment.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2022-11-15",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let targetAccountId = accountId;

    // If no existing account ID is provided, create a new Express account
    if (!targetAccountId || !targetAccountId.startsWith("acct_")) {
      const account = await stripe.accounts.create({
        type: "express",
        country: country,
        email: email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          userId: userId || "",
          platform: "nexus_social_commerce",
        },
      });
      targetAccountId = account.id;
    }

    // Create an account link for Stripe-hosted onboarding / dashboard access
    const accountLink = await stripe.accountLinks.create({
      account: targetAccountId,
      refresh_url: finalRefreshUrl,
      return_url: finalReturnUrl,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId: targetAccountId,
        status: "pending_onboarding",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create Stripe Connect link" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
