export const tools = [
    {
        functionDeclarations: [
            {
                name: "get_unpaid_members",
                description: "Ambil daftar anggota yang belum bayar tagihan. Bisa untuk tagihan tertentu atau semua tagihan aktif",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        bill_id: {
                            type: "STRING",
                            description: "ID tagihan (opsional). Jika kosong, ambil dari semua tagihan aktif"
                        }
                    }
                }
            },
            {
                name: "get_payment_summary",
                description: "Ambil ringkasan total kas terkumpul, persentase pembayaran per tagihan atau per grup",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        group_id: {
                            type: "STRING",
                            description: "ID grup (opsional). Jika kosong ambil semua grup"
                        }
                    }
                }
            },
            {
                name: "analyze_payment_pattern",
                description: "Analisis pola pembayaran: siapa yang sering telat, prediksi completion rate, saran waktu terbaik untuk tagihan",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        bill_id: {
                            type: "STRING",
                            description: "ID tagihan untuk dianalisis (opsional)"
                        }
                    }
                }
            },
            {
                name: "get_late_members",
                description: "Ambil daftar anggota yang paling sering telat bayar berdasarkan riwayat pembayaran",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        group_id: {
                            type: "STRING",
                            description: "ID grup (opsional)"
                        }
                    }
                }
            },
            {
                name: "send_reminder",
                description: "Kirim ulang email reminder ke semua anggota yang belum bayar pada tagihan tertentu",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        bill_id: {
                            type: "STRING",
                            description: "ID tagihan yang akan dikirim remindernya"
                        }
                    },
                    required: ["bill_id"]
                }
            },
            {
                name: "create_bill",
                description: "Buat tagihan baru dengan status draft untuk grup tertentu",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        judul: {
                            type: "STRING",
                            description: "Judul tagihan"
                        },
                        nominal: {
                            type: "NUMBER",
                            description: "Nominal tagihan dalam Rupiah (minimal 500)"
                        },
                        deadline: {
                            type: "STRING",
                            description: "Deadline tagihan format YYYY-MM-DD"
                        },
                        group_id: {
                            type: "STRING",
                            description: "ID grup yang akan ditagih"
                        }
                    },
                    required: ["judul", "nominal", "deadline", "group_id"]
                }
            },
            {
                name: "close_bill",
                description: "Tutup tagihan yang sudah selesai atau melewati deadline, ubah status menjadi closed",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        bill_id: {
                            type: "STRING",
                            description: "ID tagihan yang akan ditutup"
                        }
                    },
                    required: ["bill_id"]
                }
            }
        ]
    }
];
