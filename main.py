from quart import Quart, render_template, url_for, request, jsonify
from led_controller import LEDContoller
led = LEDContoller()

app = Quart(__name__)
@app.before_serving
async def connect():
    await led.connect()

@app.after_serving
async def disconnect():
    await led.disconnect()

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
    data = await request.get_json()
    buttons = [[0 for _ in range(3)] for _ in range(256)] 
    for i in range (256):
        color = data.get(str(i))
        buttons[i][0] = int(color[1:3], 16)
        buttons[i][1] = int(color[3:5], 16)
        buttons[i][2] = int(color[5:7], 16)       
    index = int(data.get("256"))
    loopStart = int(data.get("257"))
    loopEnd = int(data.get("258"))
    intervalMs = float(data.get("259"))  
    await led.set_color(buttons, index, loopStart, loopEnd, intervalMs)
    return jsonify({})

#BPM設定
@app.route("/setBpm", methods=["POST"])
async def set_bpm():
    data = await request.get_json()
    intervalMs = float(data.get("bpm"))
    print(f"{intervalMs}")
    print(f"BPM set to {30000 / intervalMs}")
    await led.change_bpm(intervalMs)
    return jsonify({})

#ループの設定
@app.route("/setLoop", methods=["POST"])
async def set_loop():
    data = await request.get_json()
    loopStart = int(data.get("loopStart"))
    loopEnd = int(data.get("loopEnd"))
    print(f"change loop {loopStart} --- {loopEnd}")    
    await led.change_loop(loopStart, loopEnd)
    return jsonify({})

#CUEからのループの設定
@app.route("/setLoopFromCue", methods=["POST"])
async def set_loop_from_cue():
    data = await request.get_json()
    index = int(data.get("index"))
    loopStart = int(data.get("loopStart"))
    loopEnd = int(data.get("loopEnd"))
    print(f"change loop {loopStart} --- {loopEnd}")    
    await led.change_loop_from_cue(index, loopStart, loopEnd)
    return jsonify({})

#モードの設定
@app.route("/setMode", methods=["POST"])
async def set_mode():
    data = await request.get_json()
    mode = int(data.get("mode"))
    #print(mode)
    return jsonify({})

#明るさ設定
@app.route('/setBrightness', methods=['POST'])
async def set_brightness():
    data = await request.get_json()
    brightness = int(data.get('brightness'))
    #print(brightness)
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
    #print(index)
    return jsonify({})



if __name__ == "__main__":    
    app.run(debug=True)

