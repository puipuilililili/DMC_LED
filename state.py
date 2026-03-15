import asyncio
from led_controller import LEDController
from osc_server import OSCServer
from bpm_client import BPMClient

class AppState:
    def __init__(self):
        self.MasterBpm = 150
        self.last_led_state = {
            "multiplier": 1,
            "white_multiplier": 1,
            "white_is_playing": 0,
            "brightness": 100,
            "cross_fade_7color" : 50
        }
        self.white_color = [([254, 255, 255] if i % 2 == 0 else [0, 0, 0]) for i in range(16)]
        self.pure_white_color = [[254, 255, 255] for _ in range(16)]
        self.queues = set()
        self.led = LEDController()
        self.oscserver = OSCServer(ip = "127.0.0.1", port=7000)
        self.BPMCient =BPMClient(url = "http://127.0.0.1:17081/params.json", polling_interval=0.1)

state = AppState()
