import pygame.midi

class getMidi:
    def __init__(self):
        self.i = None

    def connect(self):
        # midi入力を初期化
        pygame.midi.init()

        # 接続されているMIDIデバイスの数を取得
        device_count = pygame.midi.get_count()
        print(f"接続されているMIDIデバイスの数: {device_count}")

        # 各デバイスの情報を表示
        for i in range(device_count):
            device_info = pygame.midi.get_device_info(i)
            print(f"ID: {i}, Info: {device_info}")

        #XDJXZのmidiを入力信号に指定
        self.i = pygame.midi.Input(1)

    def get_midi(self):
        if self.i.poll(): # MIDIを受信すると
            # MIDI入力を取得
            midi_events = self.i.read(4)
            return midi_events