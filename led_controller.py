import os
import asyncio
import time
from src import connect_device


def run_async_coroutine(coro):
    asyncio.run(coro)  


class LEDController:
    def  __init__(self):
        self.client = None
        self.device = None
        self.sequencer = None
        self._brightness = 100
        self._brightness_event = asyncio.Event()
        self._last_brightness_send = 0  # 最後に送った時刻

    async def connect(self):
        if self.client is None or self.device is None or not self.client.is_connected:
            print("device is not connecting... try to connect")
            prefix = os.environ.get("ELK-BLEDOM", "ELK-BLEDOM")
            self.device, self.client = await connect_device(prefix)

        if self.device is None or self.client is None:
            print(f"No device with prefix {prefix} found. If your device has another prefix, set the environment variable ELK-BLEDOM")
        
        if self.device and self.client:
            self.sequencer = ColorSequencer(
                self.device, [], 0, 140
            )
            asyncio.create_task(self._brightness_task())
    
    async def disconnect(self):
        await self.device.power_off()
        await self.client.disconnect()  
      
    async def set_color(self, buttons, index, BPM):
        if self.sequencer:
            await self.sequencer.stop()
            await self.sequencer.load_sequencer(
                buttons, index, BPM
            )
            await self.sequencer.start()

    async def set_effect(self, effect):
        if self.sequencer:
            await self.sequencer.stop()
            await self.device.set_effect(effect)
    
    async def stop_color(self):
        if self.sequencer:
            #self.sequencer(ColorSequencer)内のstopを呼び出して停止
            await self.sequencer.stop() 

    async def brightnessChange(self, brightness):
        self._brightness = int(brightness)
        self._brightness_event.set()

    async def _brightness_task(self):
        """明るさをリアルタイム反映 + 送信レート制御"""
        MIN_INTERVAL = 0.010  # 10ms
        while True:
            await self._brightness_event.wait()
            self._brightness_event.clear()
            now = asyncio.get_event_loop().time()
            elapsed = now - self._last_brightness_send

            # 前回送信から10ms未満なら待つ
            if elapsed < MIN_INTERVAL:
                await asyncio.sleep(MIN_INTERVAL - elapsed)

            try:
                await self.device.set_brightness(self._brightness)
                self._last_brightness_send = asyncio.get_event_loop().time()
            except Exception as e:
                print(f"[WARN] brightness set error: {e}")

    async def change_bpm(self, BPM):
        if self.sequencer:
            self.sequencer.change_bpm(BPM)

class ColorSequencer:
    def __init__(self, device, buttons, index, BPM):
        self.buttons = buttons
        self.index = index
        self.BPM = BPM
        self.device = device
        self.task = None
        self.stop_event = asyncio.Event()

    async def start(self):
        if self.task is not None and not(self.task.done()):#slef.taskが空白でない、かつself.taskが終了していない時
            print("シーケンスが既に実行中です")
            return
        self.task = asyncio.create_task(self.run_sequence())

    
    async def stop(self):
        if self.task is not None and not (self.task.done()):#slef.taskが空白でない、かつself.taskが終了していない時
            self.stop_event.set()
            await self.task
            self.task = None
            print("シーケンスを停止しました。")
    
    async def load_sequencer(self, buttons, index, BPM):
        self.buttons = buttons
        self.index = index
        self.BPM = BPM

            
    def change_bpm(self, BPM):
        print(f"change bpm, to {BPM}")
        self.BPM = BPM

    async def run_sequence(self):
        self.stop_event.clear()
        WHITE = [255, 255, 255] #白なら前のボックスのやつを継続
        BLACK = [0, 0, 0] #黒なら暗転
        PAUSE_COLOR = [254, 255, 255]
        previous_color = WHITE  # 初期化
        next_time = time.time()
        while not self.stop_event.is_set():
            #BPMが0のときは白
            if self.BPM == 0:
                await self.device.set_color(*PAUSE_COLOR)
                #BPMが0の間はここにとどまる
                while self.BPM == 0:
                    if self.stop_event.is_set():
                        return
                    await asyncio.sleep(0.1)
                next_time = time.time()
                continue
            # 色変更
            if self.buttons[self.index] == BLACK:
                await self.device.set_color(1, 1, 1)#暗転               
            elif self.buttons[self.index] == WHITE:
                if previous_color == BLACK:
                    await self.device.set_color(1, 1, 1)#暗転 
                else:               
                    await self.device.set_color(*previous_color)
            else:# WHITEでもBLACKでもない場合
                previous_color = self.buttons[self.index]
                await self.device.set_color(*self.buttons[self.index])

            #次の位置
            if self.index == 15 :
                self.index = 0 
            else :
                self.index = self.index + 1

            #待機時間計算＆待機
            next_time += 60 / self.BPM / 2
            sleep_time = next_time - time.time()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            else:
                print("処理が遅延")
                next_time = time.time()
