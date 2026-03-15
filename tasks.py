from state import state
from src.device import Effects
import asyncio
import midi

#------------データ送信-----------------------
async def send_data(data_type, data1, data2):
    '''
    data_type 0はパッドデータ
    data_type 1はノブデータ
    data1はノブデータの場合のどのノブのデータか
            パッドの場合どのパッドが押されたか
    data2はノブのデータ
    data1, data2は空欄の場合は0を入れる
    '''
    for queue in state.queues:
        data_to_send = {"data_type": data_type, "data1": data1, "data2": data2}
        await queue.put(data_to_send)

#---------コントローラーからの入力制御------------
#PADからの入力
async def PAD(value):
    match value:
        case 36:    #ch3
            state.last_led_state["current_ch"] = value
            await send_data(0, 3, 0)
        case 37:    #ch1
            state.last_led_state["current_ch"] = value
            await send_data(0, 1, 0)
        case 38:    #ch2
            state.last_led_state["current_ch"] = value
            await send_data(0, 2, 0)
        case 39:    #ch4
            state.last_led_state["current_ch"] = value
            await send_data(0, 4, 0)
        case 40:    #white
            white_bpm = state.MasterBpm * state.last_led_state["white_multiplier"]
            #Play → Pause
            if state.last_led_state["current_ch"] == 40:
                state.last_led_state["current_ch"] = 99
                await state.led.set_color(state.pure_white_color, 0, white_bpm)
            #Pause → Play
            else:
                state.last_led_state["current_ch"] = value
                await state.led.set_color(state.white_color, 0, white_bpm)
                await send_data(0, 5, 0)
        case 42:
            state.last_led_state["current_ch"] = value
            await send_data(0, 5, 0)
            await state.led.set_effect_speed(state.last_led_state["cross_fade_7color_speed"])
            await state.led.set_effect(Effects.CROSSFADE_RED_GREEN_BLUE_YELLOW_CYAN_MAGENTA_WHITE)
        case 43:
            state.last_led_state["current_ch"] = value
            await send_data(0, 5, 0)
            await state.led.set_effect_speed(state.last_led_state["blink_7color_speed"])
            await state.led.set_effect(Effects.BLINK_RED_GREEN_BLUE_YELLOW_CYAN_MAGENTA_WHITE)


        case _:
            print("other")

#上段左一番目ノブからの入力(白色のBPM変更)
async def BPM_Change_white(value):
    BPM_MULTIPLIER_LIST = [
        (32, 0),
        (64, 1),
        (96, 2),
        (128, 4)
    ]
    
    midi_value = value
    newWhiteBpm = state.MasterBpm
    for threshold, multiplier in BPM_MULTIPLIER_LIST:
        if midi_value <= threshold:
            state.last_led_state["white_multiplier"] = multiplier
            newWhiteBpm = state.MasterBpm * multiplier
            break
    if state.last_led_state["current_ch"] == 40:
        await state.led.change_bpm(newWhiteBpm)

#下段左一番目ノブからの入力（BPM変更）
async def BPM_Change(value):
    BPM_MULTIPLIER_LIST = [
        (20, 1/ 4),
        (40, 1 / 2),
        (80, 1),
        (102, 2),
        (127, 4)
    ]

    midi_value = value
    newBpm = state.MasterBpm

    for threshold, multiplier in BPM_MULTIPLIER_LIST:
        if midi_value <= threshold:
            state.last_led_state["multiplier"] = multiplier
            newBpm = state.MasterBpm * multiplier
            break
    if state.last_led_state["current_ch"] < 40:
        await state.led.change_bpm(newBpm)
    await send_data(1, 0, newBpm)

#下段左から二番目のノブの入力(明るさ変更)
async def BRIGHTNESS_CHANGE(value):
    brightness = int(value / 1.27)
    state.last_led_state["brightness"] = brightness
    print("brightness change")
    await state.led.brightnessChange(brightness)
    await send_data(1, 1, brightness)

#上段左から三番目のノブの入力(7色カラーフェードのスピード変更)
async def SPEED_Change_7color_fade(value):
    speed = int(value / 1.27)
    state.last_led_state["cross_fade_7color_speed"] = speed
    if state.last_led_state["current_ch"] == 42:
        await state.led.set_effect_speed(speed)


#上段左から四番目のノブの入力(7色ブリンクモードのスピード変更)
async def SPEED_Change_7color_blink(value):
    speed = int(value / 1.27)
    state.last_led_state["blink_7color_speed"] = speed
    if state.last_led_state["current_ch"] == 43:
        await state.led.set_effect_speed(speed)


#----------モニタータスク----------
async def midi_listner():

    BPM = 40
    BRIGHTNESS = 41
    BPM_FOR_WHITE = 36
    SPEED_FOR_7COLOR_FADE = 38
    SPEED_FOR_7COLOR_BLINK = 39

    midiSignal = midi.getMidi()
    midiSignal.connect()
    control_map = {
        BPM : BPM_Change,
        BRIGHTNESS : BRIGHTNESS_CHANGE,
        BPM_FOR_WHITE: BPM_Change_white,
        SPEED_FOR_7COLOR_FADE:SPEED_Change_7color_fade,
        SPEED_FOR_7COLOR_BLINK:SPEED_Change_7color_blink
    }

    while True:
        mididata = midiSignal.get_midi()
        if mididata is not None:
            status = mididata[0][0][0]
            control_number = mididata[0][0][1]
            command = status & 0xF0
                
            if command in (0x90,):
                value = mididata[0][0][1]
                if 36 <= value <= 43:
                    await PAD(value)

            elif command in (0xB0,):         
                if control_number in control_map:
                    value = mididata[0][0][2]
                    handler_function = control_map.get(control_number)
                    await handler_function(value)        
        await asyncio.sleep(0.01)  

async def bpm_monitor_task():
    last_processed_bpm = -1
    while True:
        current_bpm = state.oscserver.bpm  # OSCServerインスタンスから現在のBPMを取得
        # BPMに変化があり、0ではない場合に処理を実行
        if current_bpm != last_processed_bpm and current_bpm != 0:
            last_processed_bpm = current_bpm
            #一色当たりの時間
            state.MasterBpm = last_processed_bpm
            ch = state.last_led_state["current_ch"]
            if ch <= 40:
                multiplier = (
                    state.last_led_state["white_multiplier"]
                    if ch == 40
                    else state.last_led_state["multiplier"]
                )
                newBpm = state.MasterBpm * multiplier
                if ch < 40:
                    await send_data(1, 0, newBpm)
                await state.led.change_bpm(newBpm)

        await asyncio.sleep(0)