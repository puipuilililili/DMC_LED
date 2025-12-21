# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LED制御用のAPI - Bluetooth LED light controller with web interface using Quart framework. Supports multiple BPM input sources including rekordbox via ProLink Bridge.

## Architecture

### Core Components

1. **main.py** - Quart web server providing REST API and SSE endpoints for LED control
   - Routes for color, BPM, brightness, and loop control
   - MIDI listener for hardware controller input
   - OSC server integration for external BPM sync
   - HTTP BPM client for ProLink Bridge integration
   - Server-Sent Events for real-time updates
   - BPM source selection: `BPM_SOURCE` = "http" | "osc" | "both"

2. **led_controller.py** - LED device control logic
   - ColorSequencer class for managing color sequences and timing
   - Brightness control with rate limiting (20ms minimum interval)
   - BPM and loop management

3. **bpm_client.py** - HTTP client for ProLink Bridge BPM sync
   - Polls `http://127.0.0.1:17081/params.json` every 100ms
   - Extracts tempo from master player or active players
   - Auto-updates LED BPM on changes

4. **osc_server.py** - OSC server for receiving BPM from external sources (port 7000)

5. **midi.py** - MIDI controller integration for physical control

6. **src/** - Bluetooth Low Energy (BLE) device communication
   - connecting.py - BLE device discovery using Bleak
   - device.py - LED control protocol implementation
   - GATT characteristic: `0000fff3-0000-1000-8000-00805f9b34fb`

## Commands

### Install Dependencies
```bash
pip3 install --break-system-packages quart quart-events aiosc aiohttp bleak pygame matplotlib
```

### Run Development Server
```bash
python3 main.py
```
Server runs on `http://127.0.0.1:5000` with debug mode enabled.

### Environment Variables
- `ELK-BLEDOM` - Bluetooth device prefix (defaults to "ELK-BLEDOM")

## BPM Input Sources

Configure in `main.py` line 40:
- `BPM_SOURCE = "http"` - ProLink Bridge via HTTP polling (default)
- `BPM_SOURCE = "osc"` - OSC protocol on port 7000
- `BPM_SOURCE = "both"` - Both sources active simultaneously

## API Endpoints

- `GET /` - Web interface
- `POST /setColor` - Set color sequence with 16 color values
- `POST /setBpm` - Set master BPM
- `POST /setLoop` - Configure loop points
- `POST /setBrightness` - Adjust LED brightness
- `GET /stop` - Stop color sequence
- `GET /sse` - Server-Sent Events stream

## Key Implementation Details

- Beat grid: 16 beats (0-15 index)
- BPM stored as intervalMs (60000 / BPM / 2)
- Color format: RGB arrays [R, G, B] where each is 0-255
- Special colors: [255,255,255] = continue previous, [0,0,0] = blackout
- MIDI control mappings: BPM (control 40), Brightness (control 41), Pads (notes 36-40)
- Bluetooth: Uses BLE (Bluetooth Low Energy) via Bleak library
- Device detection: Auto-scans for devices starting with "ELK-BLEDOM"

## Dependencies

- quart - Async web framework
- quart-events - Event broadcasting
- aiosc - OSC server
- aiohttp - HTTP client for ProLink Bridge
- bleak - Bluetooth Low Energy communication
- pygame - MIDI controller support
- matplotlib - Color conversion utilities