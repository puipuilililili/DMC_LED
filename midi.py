import pygame.midi

class getMidi:
    def __init__(self):
        self.i = None

    def connect(self):
        # midi入力を初期化
        pygame.midi.init()

        # 接続されているMIDIデバイスの数を取得
        device_count = pygame.midi.get_count()

        # 各デバイスの情報を表示
        for i in range(device_count):
            device_info = pygame.midi.get_device_info(i)
            print(f"ID: {i}, Info: {device_info}")
            if device_info[1] == b'LPD8 mk2' and device_info[2] == 1:
                id = i

        #接続
        self.i = pygame.midi.Input(id)

    def get_midi(self):
        if self.i.poll(): # MIDIを受信すると
            # MIDI入力を取得
            midi_events = self.i.read(4)
            return midi_events