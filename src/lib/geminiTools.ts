// OpenAI/Groq-compatible tool format
export const groqTools = [
    {
        type: "function" as const,
        function: {
            name: "get_unpaid_members",
            description: "Ambil daftar anggota yang belum bayar tagihan. Bisa untuk tagihan tertentu atau semua tagihan aktif",
            parameters: {
                type: "object",
                properties: {
                    bill_id: {
                        type: "string",
                        description: "ID tagihan (opsional). Jika kosong, ambil dari semua tagihan aktif"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_payment_summary",
            description: "Ambil ringkasan total kas terkumpul, persentase pembayaran per tagihan atau per grup",
            parameters: {
                type: "object",
                properties: {
                    group_id: {
                        type: "string",
                        description: "ID grup (opsional). Jika kosong ambil semua grup"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "analyze_payment_pattern",
            description: "Analisis pola pembayaran: siapa yang sering telat, prediksi completion rate, saran waktu terbaik untuk tagihan",
            parameters: {
                type: "object",
                properties: {
                    bill_id: {
                        type: "string",
                        description: "ID tagihan untuk dianalisis (opsional)"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "get_late_members",
            description: "Ambil daftar anggota yang paling sering telat bayar berdasarkan riwayat pembayaran",
            parameters: {
                type: "object",
                properties: {
                    group_id: {
                        type: "string",
                        description: "ID grup (opsional)"
                    }
                }
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "send_reminder",
            description: "Kirim ulang email reminder ke semua anggota yang belum bayar pada tagihan tertentu",
            parameters: {
                type: "object",
                properties: {
                    bill_id: {
                        type: "string",
                        description: "ID tagihan yang akan dikirim remindernya"
                    }
                },
                required: ["bill_id"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "create_bill",
            description: "Buat tagihan baru dengan status draft untuk grup tertentu",
            parameters: {
                type: "object",
                properties: {
                    judul: { type: "string", description: "Judul tagihan" },
                    nominal: { type: "number", description: "Nominal tagihan dalam Rupiah (minimal 500)" },
                    deadline: { type: "string", description: "Deadline tagihan format YYYY-MM-DD" },
                    group_id: { type: "string", description: "ID grup yang akan ditagih" }
                },
                required: ["judul", "nominal", "deadline", "group_id"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "close_bill",
            description: "Tutup tagihan yang sudah selesai atau melewati deadline, ubah status menjadi closed",
            parameters: {
                type: "object",
                properties: {
                    bill_id: { type: "string", description: "ID tagihan yang akan ditutup" }
                },
                required: ["bill_id"]
            }
        }
    }
];

// Keep old export name for any potential leftover references (can be removed later)
export const tools = groqTools;
