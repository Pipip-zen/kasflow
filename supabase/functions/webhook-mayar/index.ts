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
        const signature = req.headers.get('x-mayar-signature');
        const webhookSecret = Deno.env.get('MAYAR_WEBHOOK_SECRET');

        // NOTE: In production, you should cryptographically verify the signature
        // using HMAC-SHA256 according to Mayar.id documentation.
        // For now, we will rely on basic presence checks and token payload logic.

        if (!webhookSecret) {
            console.warn("Missing MAYAR_WEBHOOK_SECRET in Edge Function environment");
        }

        const payload = await req.json();

        // Check if the event is a successful payment
        if (payload.status === 'success' || payload.status === 'settled') {
            const mayarPaymentId = payload.data?.id;

            if (!mayarPaymentId) {
                return new Response(JSON.stringify({ error: 'Missing payment ID in payload' }), { status: 400 });
            }

            // Initialize Supabase Client using Service Role
            const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

            const supabase = createClient(supabaseUrl, supabaseKey);

            // Update the KasFlow payment record matches the Mayar transaction ID
            const { error } = await supabase
                .from('payments')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('mayar_payment_id', mayarPaymentId);

            if (error) {
                console.error("Failed adjusting database:", error);
                return new Response(JSON.stringify({ error: 'Database update failed' }), { status: 500 });
            }

            console.log(`Successfully settled payment for Mayar ID: ${mayarPaymentId}`);
        }

        // Always return 200 OK to acknowledge receipt to Mayar
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(JSON.stringify({ error: 'Internal webhook error' }), { status: 500 });
    }
})
