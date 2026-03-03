export interface EmailPayload {
    to: string;
    nama: string;
    judul: string;
    grup: string;
    nominal: number;
    deadline: string;
    payment_link: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<{ success: boolean; message: string }> => {
    try {
        // NOTE: This triggers the deployed Supabase Edge Function directly
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            return { success: false, message: "Missing Supabase configuration." };
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, message: "Berhasil mengirim Email tagihan." };
        } else {
            console.error("Resend API Error:", data.error);
            return { success: false, message: "Terjadi kesalahan pada layanan Resend." };
        }
    } catch (error: any) {
        console.error("Resend fetch error:", error);
        return { success: false, message: error?.message || "Gagal menghubungi server Email." };
    }
};
