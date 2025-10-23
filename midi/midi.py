
import pygame.midi

pygame.midi.init()

# 接続されているMIDIデバイスの数を取得
device_count = pygame.midi.get_count()
print(f"接続されているMIDIデバイスの数: {device_count}")

# 各デバイスの情報を表示
for i in range(device_count):
    device_info = pygame.midi.get_device_info(i)
    print(f"ID: {i}, Info: {device_info}")

### midiキーボードを初期化
i = pygame.midi.Input(1)

while True:
    if i.poll(): # MIDIを受信するとTrue

        # MIDI入力を取得
        midi_events = i.read(4)
        print(f'events: {midi_events}')