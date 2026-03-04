// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

serve(async (req) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            "Content-Type": "application/json"
        };

        const { event, data } = await req.json();

        console.log("Event:", event);
        if (data) {
            console.log("Payment ID:", data.id);
            console.log("Status:", data.status);
        }

        if (event === "testing") {
            return new Response(JSON.stringify({ received: true, message: "Testing event acknowledged" }), {
                status: 200,
                headers: corsHeaders
            });
        }

        if (event === "payment.received" && data && data.status === "SUCCESS") {
            const supabase = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );

            const mayarTransactionId = data.id;

            const { error, count } = await supabase
                .from('payments')
                .update({ status: 'paid', paid_at: new Date().toISOString() })
                .eq('mayar_payment_id', mayarTransactionId);

            if (error) {
                console.error("Failed executing database update:", error);
            } else {
                console.log(`Payment updated. Status: paid. ID: ${mayarTransactionId}`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error("Webhook processing error:", error.message);
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            "Content-Type": "application/json"
        };
        return new Response(JSON.stringify({ error: 'Internal webhook error' }), { status: 500, headers: corsHeaders });
    }
})
