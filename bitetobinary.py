# バイナリデータ（16進数文字列）
hex_data = "5173707431576d4a4f4c2858444a2d585a0000000000000000000000000000010002003c000001dc000003b9000003b90000077100000b2900000ee2ffffffffffffffffffffffffffffffffffffffffffffffff000ea0ea0000313803000002"

# バイト番号付きで表示
for i in range(0, len(hex_data), 2):
    byte_num = i // 2 + 1  # 1バイト目からスタート
    byte_value = hex_data[i:i+2]
    print(f"Byte {byte_num:03}: {byte_value}")