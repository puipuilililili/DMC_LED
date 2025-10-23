import pygame.midi
import time

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
        self.i = pygame.midi.Input(3)

    def get_midi(self):
        if self.i.poll(): # MIDIを受信すると
            # MIDI入力を取得
            midi_events = self.i.read(4)
            return midi_events

def main():
    BPM = 40
    BRIGHTNESS = 41
    BPM2 = 36
    
    control_map = {
        BPM : BPM_Change,
        BRIGHTNESS : BRIGHTNESS_CHANGE,
        BPM2: BPM_Change2,
    }

    midiSignal = getMidi()
    midiSignal.connect()
    
    try:
        while True:
            mididata = midiSignal.get_midi()
            if mididata is not None:
                status = mididata[0][0][0]
                control_number = mididata[0][0][1]
                command = status & 0xF0
                
                if command in (0x90,):
                    value = mididata[0][0][1]
                    if 36 <= value <= 40:
                        PAD(value)

                elif command in (0xB0,):         
                    if control_number in control_map:
                        value = mididata[0][0][2]
                        handler_function = control_map.get(control_number)
                        handler_function(value)
                
            time.sleep(0.01)  
    except KeyboardInterrupt:
        pass

def PAD(value):
    print(f"Channel change to {value}")

def BRIGHTNESS_CHANGE(value):
    print(f"Bright ness change to {value}")

def BPM_Change(value):
    print(f"BPM1 change to {value}")

def BPM_Change2(value):
    print(f"BPM2 change to {value}")

if __name__ == "__main__":
    main()
