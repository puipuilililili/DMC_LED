from quart import Quart, Response,  render_template, url_for, request, jsonify, websocket
from quart_events import EventBroker
from led_controller import LEDContoller
from midi import getMidi
from osc_server import OSCServer
import json
import asyncio
led = LEDContoller()
beat_end = 16
chcue = 0 #CUEの偶奇回数判定用
MasterBpm = 200 #基準BPM値保存用

background_tasks = []

last_ch_state={
    "ch" : 1,
    "BPM": 1,
    "ch3Cue" : 0,
    "ch4Cue" : 0
}

white_color = {
    "buttons": [[255, 255, 255], [0, 0, 0]],
    "index": 0,
    "loopStart": 0,
    "loopEnd": 1,
    "intervalMs": MasterBpm,
    "brightness": 100
}

last_led_state = {
    "buttons": None,
    "index": 0,
    "loopStart": 0,
    "loopEnd": beat_end -1,
    "intervalMs": MasterBpm,
    "brightness": 100
}

osc_server = OSCServer(ip = "127.0.0.1", port=7000)
app = Quart(__name__)

@app.before_serving
async def connect():
    await led.connect()
    asyncio.create_task(osc_server.start())
    task1 = asyncio.create_task(midi_listner())
    task2 = asyncio.create_task(bpm_monitor_task())
    background_tasks.append(task1)
    background_tasks.append(task2)

app.secret_key = "dev_secret_key"

bcast = EventBroker(app, url_prefix="/events")

@app.after_serving
async def disconnect():
    print("Try to shutdown\n")
    for task in background_tasks:
        task.cancel()
    #タスクが完全終了するまで待つ
    await asyncio.gather(*background_tasks, return_exceptions=True)

    await led.disconnect()
    print("LED Disconnected")

@app.route('/')
async def index():
    return await render_template("index.html")

#各マスの色の設定 + Stop
@app.route("/stop", methods=["GET"])
async def stop():
    await led.stop_color()
    return jsonify({})


#各マスの色の設定 + Start
@app.route("/setColor", methods=["POST"])
async def set_color():
    global MasterBpm
    data = await request.get_json()
    buttons = [[0 for _ in range(3)] for _ in range(beat_end)] 
    for i in range (beat_end):
        color = data.get(str(i))
        buttons[i][0] = int(color[1:3], 16)
        buttons[i][1] = int(color[3:5], 16)
        buttons[i][2] = int(color[5:7], 16)       
    index = int(data.get("16"))
    loopStart = int(data.get("17"))
    loopEnd = int(data.get("18"))
    intervalMs = float(data.get("19"))
    MasterBpm = intervalMs

    last_led_state["buttons"] = buttons
    last_led_state["index"] = index
    last_led_state["loopStart"] = loopStart
    last_led_state["loopEnd"] = loopEnd
    last_led_state["intervalMs"] = intervalMs

    await led.stop_color()
    await led.set_color(buttons, index, loopStart, loopEnd, intervalMs)
    return jsonify({})

#BPM設定
@app.route("/setBpm", methods=["POST"])
async def set_bpm():
    global MasterBpm
    data = await request.get_json()
    intervalMs = float(data.get("bpm"))
    MasterBpm = intervalMs
    await led.change_bpm(intervalMs)
    return jsonify({})

@app.route("/setBpm2", methods=["POST"])
async def set_bpm2():
    data = await request.get_json()
    intervalMs = float(data.get("bpm"))
    await led.change_bpm(intervalMs)
    return jsonify({})

#ループの設定
@app.route("/setLoop", methods=["POST"])
async def set_loop():
    data = await request.get_json()
    loopStart = int(data.get("loopStart"))
    loopEnd = int(data.get("loopEnd"))
    await led.change_loop(loopStart, loopEnd)
    return jsonify({})

#CUEからのループの設定
@app.route("/setLoopFromCue", methods=["POST"])
async def set_loop_from_cue():
    data = await request.get_json()
    index = int(data.get("index"))
    loopStart = int(data.get("loopStart"))
    loopEnd = int(data.get("loopEnd"))
    await led.change_loop_from_cue(index, loopStart, loopEnd)
    return jsonify({})

#モードの設定
@app.route("/setMode", methods=["POST"])
async def set_mode():
    data = await request.get_json()
    mode = int(data.get("mode"))
    return jsonify({})

#明るさ設定
@app.route('/setBrightness', methods=['POST'])
async def set_brightness():
    data = await request.get_json()
    brightness = int(data.get('brightness'))
    await led.brightnessChange(brightness)
    return jsonify({})

#CUEの設定
@app.route("/setIndex", methods=["POST"])
async def set_index():
    data = await request.get_json()
    index = int(data.get("index"))
    loopStart = int(data.get("loopStart"))
    loopEnd = int(data.get("loopEnd"))
    await led.set_cue(index, loopStart, loopEnd)
    return jsonify({})


#Server-Sent Events(SSE)
queues = set()
@app.route("/sse")
async def sse():
    queue = asyncio.Queue()
    queues.add(queue)

    async def send_events():
        try:
            while True:
                try:
                    # 15秒間データが来なければ TimeoutError を発生させる
                    data = await asyncio.wait_for(queue.get(), timeout=15)
                    event = f"data: {json.dumps(data)}\n\n"
                    yield event.encode("utf-8")
                except asyncio.TimeoutError:
                    # ハートビート（コメント行、クライアントには無視される）
                    yield b": keep-alive\n\n"
        finally:
            queues.remove(queue)
        
    response = Response(send_events(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Transfer-Encoding"] = "chunked"
    response.headers["Connection"] = "keep-alive" 
    return response

async def send_data():
    ch = last_ch_state["ch"]
    intervalMs = last_led_state["intervalMs"]
    for queue in queues:
        data_to_send = {"ch": ch, "bpm": intervalMs, "brightness": last_led_state["brightness"]}
        await queue.put(data_to_send)

async def send_knob_data():
    ch = 5
    intervalMs = last_led_state["intervalMs"]
    for queue in queues:
        data_to_send = {"ch": ch, "bpm": intervalMs, "brightness": last_led_state["brightness"]}
        await queue.put(data_to_send)

#---------コントローラーからの入力制御------------
async def BPM_Change2(value):
    BPM_MULTIPLIER_LIST = [
        (32, 0),
        (64, 1),
        (96, 1 / 2),
        (128, 1 / 4)
    ]
    
    midi_value = value
    newWhiteBpm = MasterBpm

    for threshold, multiplier in BPM_MULTIPLIER_LIST:
        if midi_value <= threshold:
            newWhiteBpm = MasterBpm * multiplier
            white_color["intervalMs"] = newWhiteBpm
            break

async def PAD(value):
    match value:
        case 36:
            last_ch_state["ch"] = 3
            await send_data()
        case 37:
            last_ch_state["ch"] = 1
            await send_data()
        case 38:
            last_ch_state["ch"] = 2
            await send_data()
        case 39:
            last_ch_state["ch"] = 4
            await send_data()
        case 40:
            if last_ch_state["ch3Cue"] == 0:
                last_ch_state["ch3Cue"]+=1
                if white_color["intervalMs"] == 0:
                    await led.stop_color()
                    await led.device.set_color(255, 255, 255)
                else:
                    await led.stop_color()
                    await led.set_color(
                        white_color["buttons"],
                        white_color["index"],
                        white_color["loopStart"],
                        white_color["loopEnd"],
                        white_color["intervalMs"]
                    )

            else :
                last_ch_state["ch3Cue"]-=1
                if last_led_state["buttons"] is not None:
                    await led.set_color(
                        last_led_state["buttons"],
                        last_led_state["index"],
                        last_led_state["loopStart"],
                        last_led_state["loopEnd"],
                        last_led_state["intervalMs"]
                    )
        case _:
            print("other")

async def BPM_Change(value):
    BPM_MULTIPLIER_LIST = [
        (20, 4),
        (40, 2),
        (80, 1),
        (102, 1 / 2),
        (128, 1 / 4)
    ]

    midi_value = value
    newBpm = MasterBpm

    for threshold, multiplier in BPM_MULTIPLIER_LIST:
        if midi_value <= threshold:
            last_ch_state["BPM"] = multiplier
            newBpm = MasterBpm * multiplier
            break
    if last_ch_state["ch3Cue"] == 0:
        await led.change_bpm(newBpm)
    last_led_state["intervalMs"] = newBpm
    await send_knob_data()

async def BRIGHTNESS_CHANGE(value):
    brightness = int(value / 1.27)
    last_led_state["brightness"] = brightness
    await led.brightnessChange(brightness)
    await send_knob_data()

async def midi_listner():
    global MasterBpm

    BPM = 40
    BRIGHTNESS = 41
    BPM2 = 36

    midiSignal = getMidi()
    midiSignal.connect()
    control_map = {
        BPM : BPM_Change,
        BRIGHTNESS : BRIGHTNESS_CHANGE,
        BPM2: BPM_Change2,
    }

    while True:
        mididata = midiSignal.get_midi()
        if mididata is not None:
            status = mididata[0][0][0]
            control_number = mididata[0][0][1]
            command = status & 0xF0
                
            if command in (0x90,):
                value = mididata[0][0][1]
                if 36 <= value <= 40:
                    await PAD(value)

            elif command in (0xB0,):         
                if control_number in control_map:
                    value = mididata[0][0][2]
                    handler_function = control_map.get(control_number)
                    await handler_function(value)        
        await asyncio.sleep(0.01)  

async def bpm_monitor_task():
    global MasterBpm
    last_processed_bpm = -1
    while True:
        current_bpm = osc_server.bpm  # OSCServerインスタンスから現在のBPMを取得
        # BPMに変化があり、0ではない場合に処理を実行
        if current_bpm != last_processed_bpm and current_bpm != 0:
            last_processed_bpm = current_bpm
            MasterBpm = 60000 / last_processed_bpm / 2
            newBpm = MasterBpm * last_ch_state["BPM"]
            await led.change_bpm(newBpm)
            last_led_state["intervalMs"] = newBpm
            await send_knob_data()

        await asyncio.sleep(0)


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
