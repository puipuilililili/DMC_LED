import asyncio
from led_controller import LEDController
from osc_server import OSCServer

class AppState:
    def __init__(self):
        self.MasterBpm = 140
        self.last_led_state = {
            "BPM": 140,
            "multiplier": 1,
            "white_multiplier": 1,
            "white": 0,
            "brightness": 100
        }
        self.queues = set()
        self.led = LEDController()
        self.oscserver = OSCServer(ip = "127.0.0.1", port=7000)

state = AppState()
