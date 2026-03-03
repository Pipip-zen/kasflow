// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY in Edge Functions")
            return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: corsHeaders })
        }

        const { to, nama, judul, grup, nominal, deadline, payment_link } = await req.json()

        if (!to || !judul || !payment_link) {
            return new Response(JSON.stringify({ error: 'Missing required payload fields' }), { status: 400, headers: corsHeaders })
        }

        const nominalRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal || 0);
        const deadlineStr = deadline ? new Date(deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-';

        // HTML Email Template matching KasFlow Branding
        const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #16a34a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">KasFlow <span style="font-weight: normal;">Pay</span></h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Halo ${nama} 👋</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Anda memiliki tagihan baru <b>${judul}</b> dari grup <b>${grup}</b> yang menunggu pembayaran.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">TOTAL TAGIHAN</p>
          <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: 800; color: #0f172a; letter-spacing: -1px;">${nominalRp}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0; color: #64748b; font-size: 14px;">Batas Waktu</td>
            <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #0f172a;">${deadlineStr}</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${payment_link}" style="background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(22, 163, 74, 0.39);">Bayar Sekarang</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Dikirim otomatis oleh sistem terpadu KasFlow.<br>Harap jangan membalas email ini.</p>
      </div>
    </div>
    `;

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'KasFlow Billing <no-reply@kasflow.local>', // Adjust if you have a verified Resend domain
                to: [to],
                subject: `Tagihan ${judul} dari ${grup}`,
                html: htmlContent
            })
        })

        const resData = await res.json()

        if (res.ok) {
            return new Response(JSON.stringify({ success: true, id: resData.id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            console.error("Resend delivery failed:", resData);
            return new Response(JSON.stringify({ error: resData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

    } catch (err: any) {
        console.error("Function exception: ", err)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
