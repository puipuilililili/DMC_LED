from quart import Quart, Response,  render_template, url_for, request, jsonify, websocket
from quart_events import EventBroker
from led_controller import LEDContoller
from state import state
import tasks
import json
import asyncio
BEAT_END = 16

background_tasks = []

app = Quart(__name__)

@app.before_serving
async def connect():
    await state.led.connect()
    asyncio.create_task(state.oscserver.start())
    task1 = asyncio.create_task(tasks.midi_listner())
    task2 = asyncio.create_task(tasks.bpm_monitor_task())
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

    await state.led.disconnect()
    print("LED Disconnected")

@app.route('/')
async def index():
    return await render_template("index.html")

#各マスの色の設定 + Stop
@app.route("/stop", methods=["GET"])
async def stop():
    await state.led.stop_color()
    return jsonify({})


#各マスの色の設定 + Start
@app.route("/setColor", methods=["POST"])
async def set_color():
    data = await request.get_json()
    buttons = [[0 for _ in range(3)] for _ in range(BEAT_END)] 
    for i in range (BEAT_END):
        color = data.get(str(i))
        buttons[i][0] = int(color[1:3], 16)
        buttons[i][1] = int(color[3:5], 16)
        buttons[i][2] = int(color[5:7], 16)       
    index = int(data.get("16"))
    bpm = float(data.get("17"))
    state.MasterBpm = bpm

    state.last_led_state["bpm"] = bpm

    await state.led.set_color(buttons, index, bpm)
    return jsonify({})

#BPM設定
@app.route("/setBpm", methods=["POST"])
async def set_bpm():
    data = await request.get_json()
    bpm = float(data.get("bpm"))
    state.MasterBpm = bpm
    await state.led.change_bpm(bpm)
    return jsonify({})

'''
#モードの設定
@app.route("/setMode", methods=["POST"])
async def set_mode():
    data = await request.get_json()
    mode = int(data.get("mode"))
    return jsonify({})
'''

#明るさ設定
@app.route('/setBrightness', methods=['POST'])
async def set_brightness():
    data = await request.get_json()
    brightness = int(data.get('brightness'))
    state.last_led_state['brightness'] = brightness
    await state.led.brightnessChange(brightness)
    return jsonify({})


#Server-Sent Events(SSE)
@app.route("/sse")
async def sse():
    queue = asyncio.Queue()
    state.queues.add(queue)

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
            state.queues.remove(queue)
        
    response = Response(send_events(), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Transfer-Encoding"] = "chunked"
    response.headers["Connection"] = "keep-alive" 
    return response



if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
