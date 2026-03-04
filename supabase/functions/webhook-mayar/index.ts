// @ts-nocheck
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { event, data } = body

        console.log("Webhook received:", event, data?.productId)

        // Selalu return 200 untuk testing
        if (event === "testing") {
            return new Response(
                JSON.stringify({ received: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        // Handle payment sukses
        if (event === "payment.received" && data?.status === "SUCCESS") {
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            )

            const { error } = await supabase
                .from("payments")
                .update({
                    status: "paid",
                    paid_at: new Date().toISOString()
                })
                .eq("mayar_payment_id", data.productId)

            console.log("Update result:", error ?? "success")
        }

        return new Response(
            JSON.stringify({ received: true }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        )

    } catch (err) {
        console.error("Webhook error:", err)
        return new Response(
            JSON.stringify({ error: err.message }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        )
    }
})
