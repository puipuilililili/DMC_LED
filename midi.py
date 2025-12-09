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
        input_device_id = None
        for i in range(device_count):
            device_info = pygame.midi.get_device_info(i)
            print(f"ID: {i}, Info: {device_info}")
            # 入力デバイスを探す (device_info[2] == 1 が入力デバイス)
            if device_info[2] == 1 and input_device_id is None:
                input_device_id = i

        # 入力デバイスが見つかった場合のみ接続
        if input_device_id is not None:
            self.i = pygame.midi.Input(input_device_id)
            print(f"MIDIデバイス ID {input_device_id} に接続しました")
        else:
            print("MIDI入力デバイスが見つかりません")

    def get_midi(self):
        if self.i and self.i.poll(): # MIDIデバイスが接続されていて、MIDIを受信すると
            # MIDI入力を取得
            midi_events = self.i.read(4)
            return midi_events
