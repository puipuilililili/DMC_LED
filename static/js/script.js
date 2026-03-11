const activeColor = "#377494";//明るさコントロールスライダー用の定数
const inactiveColor = "#dddddd";//明るさコントロールスライダー用の定数
const beat_end = 16; //最終拍
let data = {};

//--------Server-Sent Events(SSE)---------
//SSEエンドポイントに接続
const eventSource = new EventSource("/sse");

eventSource.onmessage = function(event){
    const data = JSON.parse(event.data);
    const channels = [channel1, channel2, channel3, channel4];
    switch(data.data_type){
        //PADからの入力処理
        case 0:
            switch(data.data1){
                case 1:
                    channel1.index = 0;
                    playPause(channel1, channel2, channel3, channel4);
                    break
                case 2:
                    channel2.index = 0;
                    playPause(channel2, channel1, channel3, channel4);
                    break
                case 3:
                    channel3.index = 0;
                    playPause(channel3, channel1, channel2, channel4);
                    break
                case 4:
                    channel4.index = 0;
                    playPause(channel4, channel1, channel2, channel3);
                    break
                case 5:
                    for(const ch of channels){
                        stopChannel(ch);
                        removeActiveCh(ch);
                    }
                default:
            }
        //Knobからの入力処理
        case 1:
            //data1はどのノブの入力か？
            //data2はノブの値
            knob_id = data.data1
            knob_value = data.data2
            switch(knob_id){
                case 0:
                    for(const ch of channels){
                        ch.bpmInput.value = knob_value;
                        ch.bpm = knob_value;
                        ch.intervalMs = 60 / knob_value * 1000 / 2;
                    }
                    break
                case 1:
                    for(const ch of channels){
                        ch.brightnessSlider.value = knob_value;
                    }
                    break
            }
        default: 
    }
}

// エラーハンドリング
eventSource.onerror = function(err) {
    console.error("EventSource failed:", err);
    if (eventSource.readyState === EventSource.CLOSED) {
        console.log("Connection was closed, attempting to reconnect...");
    }
};
//--------------------------------

const channel1 = {
    id: 1,
    bpm: 120,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    mode: 1,
    isPlaying: false,
    buttons: document.querySelectorAll('.btn1'),
    modeSelecter: document.getElementById("mode_ch1"),
    playPauseButton: document.getElementById("play_pause1"),
    brightnessSlider: document.getElementById("brightness1"),
    bpmInput: document.getElementById("BPM1"),
    resetButton: document.getElementById("reset_ch1"),
    load: document.getElementById("load_ch1"),
    save: document.getElementById("save_ch1"),
    chbox: document.querySelectorAll("[class^=ch1]")
};

const channel2 = {
    id: 2,
    bpm: 120,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    mode: 1,
    isPlaying: false,
    buttons: document.querySelectorAll('.btns2'),
    modeSelecter: document.getElementById("mode_ch2"),
    playPauseButton: document.getElementById("play_pause2"),
    brightnessSlider: document.getElementById("brightness2"),
    bpmInput: document.getElementById("BPM2"),
    resetButton: document.getElementById("reset_ch2"),
    load: document.getElementById("load_ch2"),
    save: document.getElementById("save_ch2"),
    chbox: document.querySelectorAll("[class^=ch2]")
};

const channel3 = {
    id: 3,
    bpm: 120,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    mode: 1,
    isPlaying: false,
    buttons: document.querySelectorAll('.btns3'),
    modeSelecter: document.getElementById("mode_ch3"),
    playPauseButton: document.getElementById("play_pause3"),
    brightnessSlider: document.getElementById("brightness3"),
    bpmInput: document.getElementById("BPM3"),
    resetButton: document.getElementById("reset_ch3"),
    load: document.getElementById("load_ch3"),
    save: document.getElementById("save_ch3"),
    chbox: document.querySelectorAll("[class^=ch3]")
};

const channel4 = {
    id: 4,
    bpm: 120,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    mode: 1,
    isPlaying: false,
    buttons: document.querySelectorAll('.btns4'),
    modeSelecter: document.getElementById("mode_ch4"),
    playPauseButton: document.getElementById("play_pause4"),
    brightnessSlider: document.getElementById("brightness4"),
    bpmInput: document.getElementById("BPM4"),
    resetButton: document.getElementById("reset_ch4"),
    load: document.getElementById("load_ch4"),
    save: document.getElementById("save_ch4"),
    chbox: document.querySelectorAll("[class^=ch4]")
};

//keyboardからの入力
document.addEventListener("keydown", keyInput);
function keyInput(e) {
    if(e.shiftKey){
        switch (e.code){
            case "Digit1":
                channel1.load.click();
                break;
            case "Digit2":
                channel2.load.click();
                break;
            case "Digit3":
                channel3.load.click();
                break;
            case "Digit4":
                channel4.load.click();
                break;
            default:
        }
    }
}

//LOAD
channel1.load.addEventListener("change", (e) => load(channel1, e))
channel2.load.addEventListener("change", (e) => load(channel2, e))
channel3.load.addEventListener("change", (e) => load(channel3, e))
channel4.load.addEventListener("change", (e) => load(channel4, e))

function load (channel ,e){
    if(channel.isPlaying == false){
        var result = e.target.files[0]; //FileReaderのインスタンスを作成する
        var reader = new FileReader();  //読み込んだファイルの中身を取得する
        reader.readAsText(result);
        reader.addEventListener("load", function(){
            const rows = reader.result.split(/\r?\n/);
            for(i = 0 ; i < rows.length ; i++){
                const colomuns = rows[i].split(",");
                const red = colomuns[0]
                const green = colomuns[1]
                const blue = colomuns[2]
                
                color = "#" + red + green + blue;
                channel.buttons[i].value = color;
            }
        })
    }
}

//SAVE
channel1.save.addEventListener("click", () => save(channel1));
channel2.save.addEventListener("click", () => save(channel2));
channel3.save.addEventListener("click", () => save(channel3));
channel4.save.addEventListener("click", () => save(channel4));

async function save(channel){
    const opts = {
        suggestedName: 'preset',
        types: [{
        description: 'Text file',
        accept: {'text/plain': ['.csv']},
        }],
    };
    let save_data = '';
    for(i = 0 ; i < channel.buttons.length ; i++){
        if(i == 0){
            save_data = channel.buttons[i].value.substr(1, 2) + ',' + channel.buttons[i].value.substr(3, 2) + ',' + channel.buttons[i].value.substr(5, 2) + '\n';
        }
        else{
            save_data = save_data + channel.buttons[i].value.substr(1, 2) + ',' + channel.buttons[i].value.substr(3, 2) + ',' + channel.buttons[i].value.substr(5, 2) + '\n';
        }
    }
    const handle = await window.showSaveFilePicker(opts);
    const writable = await handle.createWritable();

    await writable.write(save_data);
    await writable.close();
}

/*BPMコントロール */
channel1.bpmInput.addEventListener("input", () => bpmChange(channel1));
channel2.bpmInput.addEventListener("input", () => bpmChange(channel2));
channel3.bpmInput.addEventListener("input", () => bpmChange(channel3));
channel4.bpmInput.addEventListener("input", () => bpmChange(channel4));


function bpmChange(channel){
    if (!channel.bpmInput.value || channel.bpmInput.value <= 25 || channel.bpmInput >= 1000) return; // 入力チェック
    channel.intervalMs = 60 / channel.bpmInput.value * 1000 / 2;
    channel.bpm = channel.bpmInput.value 
    //拍と拍の間の間隔（ms表記なのでx1000）(画面表記上の一マスは八分音符相当なので/2)
    
    //BPM送信
    if(channel.isPlaying == true){
        clearInterval(channel.colorInterval);
        channel.colorInterval = setInterval(() => {
            play(channel);
        }, channel.intervalMs);

        fetch("/setBpm", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
            bpm: channel.bpm
        })
    });
    }
}


/*play pauseボタン */
channel1.playPauseButton.addEventListener("click", () => playPause(channel1, channel2, channel3, channel4));
channel2.playPauseButton.addEventListener("click", () => playPause(channel2, channel1, channel3, channel4));
channel3.playPauseButton.addEventListener("click", () => playPause(channel3, channel1, channel2, channel4));
channel4.playPauseButton.addEventListener("click", () => playPause(channel4, channel1, channel2, channel3));


function playPause(activeChannel, otherChannel1, otherChannel2, otherChannel3){
    const channels = [otherChannel1, otherChannel2, otherChannel3];
    //Play → Pause
    if(activeChannel.isPlaying == true){
        stopChannel(activeChannel);
        removeActiveCh(activeChannel);
    }
    //Pause → Play
    else{
        startChannel(activeChannel);
        addActiveCh(activeChannel);
        for(const ch of channels){
            stopChannel(ch);
            removeActiveCh(ch);
        }
    }
}


function addActiveCh(channel){
    channel.chbox.forEach(el => {
        el.classList.add("activeCh");
    });
}

function removeActiveCh(channel){
    channel.chbox.forEach(el =>{
        el.classList.remove("activeCh");
    });
}

function stopChannel(channel){
    clearInterval(channel.colorInterval);
    channel.colorInterval = null;
    channel.playPauseButton.textContent = "Play" ;
    channel.isPlaying = false;
    fetch("/stop",{});
}
function startChannel(activeChannel){
    clearInterval(activeChannel.colorInterval);
    activeChannel.colorInterval = setInterval(() => {
        play(activeChannel);
    }, activeChannel.intervalMs);
    activeChannel.isPlaying = true;
    activeChannel.playPauseButton.textContent = "Pause";
    /*各マスのデータ及び、index送信*/
    data = {}
    for(i = 0; i < beat_end ; i++){
        data[i] = activeChannel.buttons[i].value;
        //alert(activeChannel.buttons[i].value);
    }
    data[16] = activeChannel.index
    data[17] = activeChannel.bpm
    fetch("/setColor", {
        method: "POST",
        headers: {
           'Content-Type': 'application/json' 
        },
        body: JSON.stringify(data)
    });

}
/*
//mode変更
channel1.modeSelecter.addEventListener("change", () => modeSetting(channel1));
channel2.modeSelecter.addEventListener("change", () => modeSetting(channel2));
channel3.modeSelecter.addEventListener("change", () => modeSetting(channel3));
channel4.modeSelecter.addEventListener("change", () => modeSetting(channel4));


function modeSetting(channel){
    if(channel.modeSelecter.value == 'standard'){
        channel.mode = 1;
    }
    else if(channel.modeSelecter.value == 'color_fade'){
        channel.mode = 2;
    }
    //モードデータ送信
    fetch('/setMode', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'    
        },
        body: JSON.stringify({
            mode: channel.mode
        })
    });
};
*/


/*明るさスライダー*/ 
channel1.brightnessSlider.addEventListener("input", function(){
    const ratio = (this.value - this.min) / (this.max - this.min) * 100;
    this.style.background = `linear-gradient(0deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`;
    changeBrightness(channel1);
});
channel2.brightnessSlider.addEventListener("input", function(){
    const ratio = (this.value - this.min) / (this.max - this.min) * 100;
    this.style.background = `linear-gradient(0deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`;
    changeBrightness(channel2);
});
channel3.brightnessSlider.addEventListener("input", function(){
    const ratio = (this.value - this.min) / (this.max - this.min) * 100;
    this.style.background = `linear-gradient(0deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`;
    changeBrightness(channel3);
});
channel4.brightnessSlider.addEventListener("input", function(){
    const ratio = (this.value - this.min) / (this.max - this.min) * 100;
    this.style.background = `linear-gradient(0deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`;
    changeBrightness(channel3);
});

//明るさデータ送信
function changeBrightness(channel){
    if(channel.isPlaying == true){
        fetch('/setBrightness', {
            method: "POST",
            headers: {
            'Content-Type': 'application/json'    
            },
            body: JSON.stringify({
                brightness: channel.brightnessSlider.value
            })
        });
    }
};

//play関数
function play(channel){
    channel.buttons[channel.index].classList.add('active'); // 緑に塗る
    if(channel.index > 0){
        channel.buttons[channel.index - 1].classList.remove('active'); // 元の色に戻す
    }
    else{
        channel.buttons[channel.buttons.length - 1].classList.remove('active');
    }


    //現在位置を+1
    channel.index++ ;
    if(channel.index >= beat_end){
        channel.index = 0;
    }
}