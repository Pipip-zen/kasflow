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
        const token = req.headers.get("Authorization");
        const webhookSecret = Deno.env.get("MAYAR_WEBHOOK_SECRET");

        // Verifikasi token dari header Authorization
        if (token !== webhookSecret) {
            console.warn("Unauthorized webhook attempt");
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await req.json();
        const { event, data } = body;

        // Jika event berupa testing dari dashboard Mayar
        if (event === "testing") {
            return new Response(JSON.stringify({ received: true, message: "Testing event acknowledged" }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }

        const mayarTransactionId = data?.id;
        const status = data?.status;

        // Jika event payment success
        if (status === "SUCCESS" && mayarTransactionId) {
            // Initialize Supabase Client using Service Role
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

            const supabase = createClient(supabaseUrl, supabaseKey);

            // Update the KasFlow payment record that matches the Mayar transaction ID
            const { error } = await supabase
                .from('payments')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('mayar_payment_id', mayarTransactionId);

            if (error) {
                console.error("Failed adjusting database:", error);
            } else {
                console.log(`Successfully settled payment for Mayar ID: ${mayarTransactionId}`);
            }
        }

        // 5. Selalu return 200 OK di akhir meskipun payment tidak ditemukan
        // supaya Mayar tidak me-retry webhook terus-menerus.
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(JSON.stringify({ error: 'Internal webhook error' }), { status: 500 });
    }
})
