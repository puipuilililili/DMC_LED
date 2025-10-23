import asyncio
import aiosc

class OSCServer:
    """
    aiosc を使った非同期 OSC サーバーを管理するクラス。
    受信した BPM を self.bpm プロパティに保持します。
    """
    def __init__(self, ip: str = "127.0.0.1", port: int = 7000):
        self.ip = ip
        self.port = port
        self.bpm = 0  # 受信したBPMを保存するプロパティ

        # OSCアドレスに対応するハンドラをマッピング
        # ハンドラには、このクラス自身のメソッドを指定
        self.protocol = aiosc.OSCProtocol({
            "/master/bpm": self._bpm_handler
        })

    def _bpm_handler(self, address, path, bpm_value: float):
        # インスタンスのプロパティを更新
        self.bpm = bpm_value

    async def start(self):
        loop = asyncio.get_running_loop()
        
        transport, _ = await loop.create_datagram_endpoint(
            lambda: self.protocol, local_addr=(self.ip, self.port)
        )
        print(f"OSC Server started and listening on {self.ip}:{self.port}")