export const sendWhatsApp = async (nomor: string, pesan: string): Promise<{ success: boolean; message: string }> => {
    const apiKey = import.meta.env.VITE_FONNTE_API_KEY;

    if (!apiKey) {
        console.warn("Fonnte API Key is missing. Check your .env setup.");
        return { success: false, message: "API Key Fonnte belum tersubmit di environment variables." };
    }

    // Pre-process phone number: ensure prefix +62 / 62
    let targetNumber = nomor.trim();
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.substring(1);
    }

    try {
        const formData = new FormData();
        formData.append('target', targetNumber);
        formData.append('message', pesan);
        // You could also add 'delay', 'typing', etc., based on Fonnte API docs

        const endpoint = import.meta.env.DEV ? '/api/fonnte/send' : 'https://api.fonnte.com/send';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': apiKey, // Fonnte uses Authorization header with raw token
            },
            body: formData,
        });

        const data = await response.json();

        if (data.status) {
            return { success: true, message: `Pesan sukses terkirim ke ${targetNumber}` };
        } else {
            console.error("Fonnte API Error:", data.reason);
            return { success: false, message: data.reason || "Terjadi kesalahan pada layanan WhatsApp." };
        }
    } catch (error: any) {
        console.error("Fonnte fetch error:", error);
        return { success: false, message: error?.message || "Gagal menghubungi server Fonnte." };
    }
};
