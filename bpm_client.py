import asyncio
import aiohttp
from typing import Optional, Callable

class BPMClient:
    """
    ProLink Bridge等のHTTPエンドポイントからBPM情報を取得するクライアント
    """
    def __init__(self, url: str = "http://127.0.0.1:17081/params.json", polling_interval: float = 0.1):
        self.url = url
        self.polling_interval = polling_interval
        self.current_bpm: float = 0
        self.last_bpm: float = 0
        self.is_running = False
        self._on_bpm_change: Optional[Callable] = None
    
    def on_bpm_change(self, callback: Callable):
        """BPM変更時のコールバックを設定"""
        self._on_bpm_change = callback
    
    async def start(self):
        """ポーリングを開始"""
        self.is_running = True
        asyncio.create_task(self._polling_task())
        print(f"BPM Client started, polling {self.url} every {self.polling_interval}s")
    
    async def stop(self):
        """ポーリングを停止"""
        self.is_running = False
    
    async def _polling_task(self):
        """HTTPポーリングでBPMを監視"""
        async with aiohttp.ClientSession() as session:
            while self.is_running:
                try:
                    async with session.get(self.url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                        if response.status == 200:
                            data = await response.json()
                            await self._process_data(data)
                except aiohttp.ClientError as e:
                    print(f"[BPM Client] Connection error: {e}")
                except asyncio.TimeoutError:
                    print(f"[BPM Client] Timeout")
                except Exception as e:
                    print(f"[BPM Client] Error: {e}")
                
                await asyncio.sleep(self.polling_interval)
    
    async def _process_data(self, data: dict):
        """JSONデータからBPMを抽出して処理"""
        try:
            # masterのtempoを優先、なければplayer 1または2から取得
            if 'master' in data and data['master'] and 'tempo' in data['master']:
                new_bpm = float(data['master']['tempo'])
            elif 'players' in data:
                # マスターがない場合は再生中のプレイヤーから取得
                for player_id, player_data in data['players'].items():
                    if player_data.get('is-playing', False) and 'tempo' in player_data:
                        new_bpm = float(player_data['tempo'])
                        break
                else:
                    return  # 再生中のプレイヤーがない
            else:
                return
            
            # BPMが変化した場合のみ更新
            if abs(new_bpm - self.last_bpm) > 0.01:  # 0.01以上の変化で更新
                self.last_bpm = new_bpm
                self.current_bpm = new_bpm
                
                # コールバック実行
                if self._on_bpm_change:
                    await self._on_bpm_change(new_bpm)
                    
                print(f"[BPM Client] BPM updated: {new_bpm:.2f}")
                
        except (KeyError, TypeError, ValueError) as e:
            print(f"[BPM Client] Data parsing error: {e}")