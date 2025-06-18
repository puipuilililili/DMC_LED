import sys
import os
import asyncio
import time
import threading
import queue
from matplotlib.colors import to_rgb
from src import connect_device


def run_async_coroutine(coro):
    asyncio.run(coro)  


class LEDContoller:
    def  __init__(self):
        self.client = None
        self.device = None
        self.stop = None
        self.newIndex = None
        self.newLoopStart = None
        self.newLoopEnd = None
        self.newIntervalMs = None

        self.thread = None

    async def connect(self):
        if self.client is None or self.device is None or not self.client.is_connected:
            print("device is not connecting... try to conect")
            prefix = os.environ.get("ELK-BLEDOM", "ELK-BLEDOM")
            self.device, self.client = await connect_device(prefix)

        if self.device is None or self.client is None:
            print(f"No device with prefix {prefix} found. If your device has another prefix, set the environment variable ELK-BLEDOM")
    
    async def disconnect(self):
        await self.device.power_off()
        await self.client.disconnect()
        
    
    async def brightnessChange(self, brightness):
        print(f"change brightness to {brightness}")
        await self.device.set_brightness(int(brightness))


    async def set_color(self, buttons, index, loopStart, loopEnd, intervalMs):
        if self.stop is not None:
            print("Stopping previous color thread...")
            self.stop.put("stop")
        if self.thread is not None:
            self.thread.join()  # スレッドの終了を待つ
            print("Previous thread stopped.")
            
        self.stop = queue.Queue()
        self.newIndex = queue.Queue()
        self.newLoopStart = queue.Queue()
        self.newLoopEnd = queue.Queue()
        self.newIntervalMs = queue.Queue()
        coro = run_color(self.stop, 
                         buttons, index, loopStart, loopEnd, intervalMs, 
                         self.newIndex, self.newLoopStart, self.newLoopEnd, self.newIntervalMs,self.device, self.client
                        )
        self.thread = threading.Thread(target=run_async_coroutine, args=(coro,))
        self.thread.start()


    async def stop_color(self):
        print("stop color")
        self.stop.put("stop")
    
    async def change_bpm(self, intervalMs):
        print(f"change bpm, to {30000 / intervalMs}")
        self.newIntervalMs.put(intervalMs)

    async def change_loop(self, loopStart, loopEnd):
        print(f"change loop {loopStart} --- {loopEnd}")
        self.newLoopStart.put(loopStart)
        self.newLoopEnd.put(loopEnd)

    async def change_loop_from_cue(self,index, loopStart, loopEnd):
        print(f"change loop {loopStart} --- {loopEnd}")
        self.newIndex.put(index)
        self.newLoopStart.put(loopStart)
        self.newLoopEnd.put(loopEnd)

    async def set_cue(self, index, loopStart, loopEnd):
        print(f"set Cue {index} loopSrat{loopStart} loopEnd{loopEnd}")
        self.newIndex.put(index)
        self.newLoopStart.put(loopStart)
        self.newLoopEnd.put(loopEnd)


async def run_color(stop, buttons, index, loopStart, loopEnd, intervalMs,
                    newIndex, newLoopStart, newLoopEnd, newIntervalMs,
                    device, client):
    previous_color = [255, 255, 255]  # 初期化
    next_time = time.time()
    while True:
        #値の受け渡し
        if not stop.empty():
            cmd = stop.get()
            if cmd == "stop":
                break
        if not newIndex.empty():
            index = newIndex.get()
        if not newIntervalMs.empty():
            intervalMs = newIntervalMs.get()
        if not newLoopStart.empty():
            loopStart = newLoopStart.get()
        if not newLoopEnd.empty():
            loopEnd = newLoopEnd.get()
        # 実行内容
        if buttons[index] == [255, 255, 255]:
            if previous_color != [0, 0, 0]:
                await device.set_color(*previous_color)
            else:
                print("暗転")
        else:
            if buttons[index] != [0, 0, 0]:
                previous_color = buttons[index]
                await device.set_color(*buttons[index])
            else:
                print("暗転")
        print(index)

        index = loopStart if index == loopEnd else (index + 1) % 256

        next_time += intervalMs / 1000

        sleep_time = next_time - time.time()
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        else:
            print("処理が遅延")
            next_time = time.time()


