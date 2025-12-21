# DMC_LED セットアップガイド

## 概要
rekordbox等のDJソフトウェアからBPM情報を自動取得し、Bluetooth LED（ELK-BLEDOM）をリアルタイム制御するシステムです。

## システム構成

```
[rekordbox] → [ProLink Bridge] → [HTTP API :17081]
                                        ↓
[MIDI Controller] → [DMC_LED App :5000] → [Bluetooth LED]
                            ↑
                     [Web UI Browser]
```

## 必要な機材・ソフトウェア

### ハードウェア
- **Bluetooth LEDデバイス**: ELK-BLEDOMで始まる名前のBLEデバイス
- **MIDIコントローラー** (オプション): BPM/明るさの物理制御用
- **Mac**: macOS 11.0以降（Bluetooth Low Energy対応）

### ソフトウェア
- **Python 3.13**: アプリケーション実行環境
- **ProLink Bridge**: rekordboxからのBPM取得（https://github.com/brunchboy/link-bridge）
- **rekordbox**: DJソフトウェア

## インストール手順

### 1. 依存パッケージのインストール

```bash
pip3 install --break-system-packages \
  quart \
  quart-events \
  aiosc \
  aiohttp \
  bleak \
  pygame \
  matplotlib
```

### 2. ProLink Bridgeのセットアップ

1. ProLink Bridgeをダウンロード・起動
2. rekordboxを起動し、ProLink接続を有効化
3. `http://127.0.0.1:17081/params.json`でデータ取得を確認

### 3. BPM入力源の設定

`main.py`の40行目で入力源を選択：

```python
# BPM入力源の選択
BPM_SOURCE = "http"  # ProLink Bridge経由（推奨）
# BPM_SOURCE = "osc"   # OSCサーバー経由
# BPM_SOURCE = "both"  # 両方同時使用
```

## 起動方法

### 1. Bluetooth LEDの準備
```bash
# LEDデバイスの電源をON
# デバイス名が"ELK-BLEDOM"で始まることを確認
```

### 2. アプリケーションの起動
```bash
cd /Users/mtdnot/dev/personal/DMC_LED
python3 main.py
```

### 3. 起動確認
以下のメッセージが表示されることを確認：
- `device is not connecting... try to connect` - Bluetooth接続中
- `connected` - Bluetooth接続成功
- `BPM Client started, polling...` - BPM取得開始
- `Running on http://127.0.0.1:5000` - サーバー起動完了

### 4. Web UIアクセス
ブラウザで`http://localhost:5000`にアクセス

## トラブルシューティング

### Bluetoothデバイスが見つからない
```bash
# Bluetoothデバイスの確認
system_profiler SPBluetoothDataType | grep -A 5 "ELK"

# デバイス名が異なる場合は環境変数で指定
export ELK-BLEDOM="YOUR_DEVICE_NAME"
python3 main.py
```

### ProLink Bridge接続エラー
```bash
# ProLink Bridgeが起動しているか確認
curl http://127.0.0.1:17081/params.json

# ポートが異なる場合はbpm_client.pyで変更
```

### MIDIデバイスエラー（無視可能）
```
pygame.midi.MidiException: 'Device id invalid, out of range.'
```
MIDIコントローラーが接続されていない場合に表示されますが、動作に影響ありません。

## 動作確認

### BPM自動同期の確認
1. rekordboxで曲を再生
2. コンソールに`[BPM Client] BPM updated: xxx.xx`が表示
3. LEDの点滅速度が自動で変化

### Web UIからの制御
1. `http://localhost:5000`にアクセス
2. 色パレットで16ビートのパターンを設定
3. BPM値を手動設定
4. PLAY/PAUSEボタンで再生制御

## システムアーキテクチャ

### BPM処理フロー
```
1. ProLink Bridge → HTTP JSON (100ms間隔でポーリング)
2. bpm_client.py → BPM変更検出
3. main.py → intervalMs計算 (60000 / BPM / 2)
4. led_controller.py → ColorSequencer更新
5. Bluetooth → LEDデバイス制御
```

### Bluetooth通信仕様
- **プロトコル**: BLE (Bluetooth Low Energy)
- **ライブラリ**: Bleak
- **GATT UUID**: `0000fff3-0000-1000-8000-00805f9b34fb`
- **コマンド形式**: `[0x7E, 0x00, CMD, ARG1-5, 0xEF]`

## 注意事項

- Bluetooth接続は最大5回まで自動リトライ
- BPM変更は0.01以上の差分で更新
- 明るさ制御は20ms間隔でレート制限
- 特殊色: [255,255,255]=前の色継続、[0,0,0]=消灯