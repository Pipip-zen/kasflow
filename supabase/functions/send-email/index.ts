// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.11"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
    }

    try {
        // [RESOLVED] HARDCODE KREDENSIAL DISINI!
        // Isi dengan Email dan Sandi Aplikasi Google yang baru digenerate (tanpa spasi).
        const GMAIL_USER = "GANTI_JADI_EMAIL_ANDA@gmail.com";
        const GMAIL_APP_PASSWORD = "HURUF16SANDIDISINI";

        const { to, nama, judul, grup, nominal, deadline, payment_link } = await req.json()

        if (!to || !judul || !payment_link) {
            return new Response(JSON.stringify({ error: 'Missing required payload fields' }), { status: 400, headers: corsHeaders })
        }

        const nominalRp = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nominal || 0);

        const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #16a34a; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">KasFlow Pay</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">Halo ${nama} 👋</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Anda memiliki tagihan baru <b>${judul}</b> dari grup <b>${grup}</b> yang menunggu pembayaran.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">TOTAL TAGIHAN</p>
          <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: 800;">${nominalRp}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${payment_link}" style="background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Bayar Sekarang</a>
        </div>
      </div>
    </div>
    `;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: '"KasFlow" <' + GMAIL_USER + '>',
            to: to,
            subject: 'Tagihan ' + judul + ' dari ' + grup,
            html: htmlContent
        };

        const result = await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (err: any) {
        console.error("Function exception: ", err)
        return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
