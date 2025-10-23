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
    for (const ch of channels) {
        ch.bpmInput.value = 30000 / data.bpm;
        ch.intervalMs = data.bpm;
        ch.brightnessSlider.value = data.brightness;
    }
    switch(data.ch){
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
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    previousLoop: 0,
    isLooping: false,
    mode: 1,
    loopStart: 0,
    loopEnd: 16,
    isPlaying: false,
    cue: 0,
    buttons: document.querySelectorAll('.btn1'),
    modeSelecter: document.getElementById("mode_ch1"),
    loopSelecter: document.getElementById("loop_ch1"),
    loopFromCue: document.getElementById("loopFromCue_ch1"),
    playPauseButton: document.getElementById("play_pause1"),
    brightnessSlider: document.getElementById("brightness1"),
    bpm05: document.getElementById("BPM1/2_ch1"),
    bpmx2: document.getElementById("BPMx2_ch1"),
    bpmInput: document.getElementById("BPM1"),
    resetButton: document.getElementById("reset_ch1"),
    load: document.getElementById("load_ch1"),
    save: document.getElementById("save_ch1"),
    chbox: document.querySelectorAll("[class^=ch1]")
};

const channel2 = {
    id: 2,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    previousLoop: 0,
    isLooping: false,
    mode: 1,
    loopStart: 0,
    loopEnd: 16,
    isPlaying: false,
    cue: 0,
    buttons: document.querySelectorAll('.btns2'),
    loopSelecter: document.getElementById("loop_ch2"),
    modeSelecter: document.getElementById("mode_ch2"),
    loopFromCue: document.getElementById("loopFromCue_ch2"),
    playPauseButton: document.getElementById("play_pause2"),
    brightnessSlider: document.getElementById("brightness2"),
    bpm05: document.getElementById("BPM1/2_ch2"),
    bpmx2: document.getElementById("BPMx2_ch2"),
    bpmInput: document.getElementById("BPM2"),
    resetButton: document.getElementById("reset_ch1"),
    load: document.getElementById("load_ch2"),
    save: document.getElementById("save_ch2"),
    chbox: document.querySelectorAll("[class^=ch2]")
};

const channel3 = {
    id: 3,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    previousLoop: 0,
    isLooping: false,
    mode: 1,
    loopStart: 0,
    loopEnd: 16,
    isPlaying: false,
    cue: 0,
    buttons: document.querySelectorAll('.btns3'),
    modeSelecter: document.getElementById("mode_ch3"),
    loopSelecter: document.getElementById("loop_ch3"),
    loopFromCue: document.getElementById("loopFromCue_ch3"),
    playPauseButton: document.getElementById("play_pause3"),
    brightnessSlider: document.getElementById("brightness3"),
    bpm05: document.getElementById("BPM1/2_ch3"),
    bpmx2: document.getElementById("BPMx2_ch3"),
    bpmInput: document.getElementById("BPM3"),
    resetButton: document.getElementById("reset_ch3"),
    load: document.getElementById("load_ch3"),
    save: document.getElementById("save_ch3"),
    chbox: document.querySelectorAll("[class^=ch3]")
};

const channel4 = {
    id: 4,
    intervalMs: 250,
    colorInterval: null,
    index: 0,
    previousLoop: 0,
    isLooping: false,
    mode: 1,
    loopStart: 0,
    loopEnd: 16,
    isPlaying: false,
    cue: 0,
    buttons: document.querySelectorAll('.btns4'),
    modeSelecter: document.getElementById("mode_ch4"),
    loopSelecter: document.getElementById("loop_ch4"),
    loopFromCue: document.getElementById("loopFromCue_ch4"),
    playPauseButton: document.getElementById("play_pause4"),
    brightnessSlider: document.getElementById("brightness4"),
    bpm05: document.getElementById("BPM1/2_ch4"),
    bpmx2: document.getElementById("BPMx2_ch4"),
    bpmInput: document.getElementById("BPM4"),
    resetButton: document.getElementById("reset_ch4"),
    load: document.getElementById("load_ch4"),
    save: document.getElementById("save_ch4"),
    chbox: document.querySelectorAll("[class^=ch4]")
};

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
            bpm: channel.intervalMs
        })
    });
    }
}

//BPM 1/2
channel1.bpm05.addEventListener("click", () => bpm05(channel1));
channel2.bpm05.addEventListener("click", () => bpm05(channel2));
channel3.bpm05.addEventListener("click", () => bpm05(channel3));
channel4.bpm05.addEventListener("click", () => bpm05(channel4));

function bpm05(channel){

    let bpm05 = 30 / channel.intervalMs * 500;
    if (bpm05 < 25 || 30 / bpm05 > 401) return; // 入力チェック
    channel.intervalMs = channel.intervalMs * 2;
    channel.bpmInput.value /= 2;
    if(channel.isPlaying == true){
        clearInterval(channel.colorInterval);
        channel.colorInterval = setInterval(() => {
            play(channel);
        }, channel.intervalMs);

        fetch("/setBpm2", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
            bpm: channel.intervalMs
        })
    });
    }
}

//BPM x 2
channel1.bpmx2.addEventListener("click", () => bpmx2(channel1));
channel2.bpmx2.addEventListener("click", () => bpmx2(channel2));
channel3.bpmx2.addEventListener("click", () => bpmx2(channel3));
channel4.bpmx2.addEventListener("click", () => bpmx2(channel4));

function bpmx2(channel){
    let bpmx2 = 30 / channel.intervalMs * 2000 / 2;
    if (bpmx2 < 25 || bpmx2 > 1001) return; // 入力チェック
    channel.intervalMs = channel.intervalMs / 2;
    channel.bpmInput.value *= 2; 
    if(channel.isPlaying == true){
        clearInterval(channel.colorInterval);
        channel.colorInterval = setInterval(() => {
            play(channel);
        }, channel.intervalMs);

        fetch("/setBpm2", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
            bpm: channel.intervalMs
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
    //Play → Pause
    if(activeChannel.isPlaying == true){
        stopChannel(activeChannel);
        removeActiceCh(activeChannel);
    }
    //Pause → Play
    else{
        startChannel(activeChannel, otherChannel1, otherChannel2, otherChannel3);
        addActiveCh(activeChannel);
        removeActiceCh(otherChannel1);
        removeActiceCh(otherChannel2);
        removeActiceCh(otherChannel3);
    }
}


function addActiveCh(channel){
    channel.chbox.forEach(el => {
        el.classList.add("activeCh");
    });
}

function removeActiceCh(channel){
    channel.chbox.forEach(el =>{
        el.classList.remove("activeCh");
    });
}

function stopChannel(channel){
    clearInterval(channel.colorInterval);
    channel.playPauseButton.textContent = "Play" ;
    channel.isPlaying = false;
    fetch("/stop",{});
}
function startChannel(activeChannel, otherChannel1, otherChannel2, otherChannel3){
    activeChannel.buttons[activeChannel.index].classList.remove("cue");
    clearInterval(otherChannel1.colorInterval);
    clearInterval(otherChannel2.colorInterval);
    clearInterval(otherChannel3.colorInterval);
    otherChannel1.colorInterval = null;
    otherChannel2.colorInterval = null;
    otherChannel3.colorInterval = null;
    clearInterval(activeChannel.colorInterval);
    activeChannel.colorInterval = setInterval(() => {
        play(activeChannel);
    }, activeChannel.intervalMs);
    activeChannel.isPlaying = true;
    activeChannel.playPauseButton.textContent = "Pause";
    otherChannel1.isPlaying = false
    otherChannel1.playPauseButton.textContent = "Play";
    otherChannel2.isPlaying = false
    otherChannel2.playPauseButton.textContent = "Play";
    otherChannel3.isPlaying = false
    otherChannel3.playPauseButton.textContent = "Play";
    /*各マスのデータ及び、index, loopStart, loopEnd送信*/
    data = {}
    for(i = 0; i < beat_end ; i++){
        data[i] = activeChannel.buttons[i].value;
        //alert(activeChannel.buttons[i].value);
    }
    data[16] = activeChannel.index
    data[17] = activeChannel.loopStart
    data[18] = activeChannel.loopEnd
    data[19] = activeChannel.intervalMs
    fetch("/setColor", {
        method: "POST",
        headers: {
           'Content-Type': 'application/json' 
        },
        body: JSON.stringify(data)
    });

}

channel1.loopSelecter.addEventListener("change", () => loopSetting(channel1));
channel2.loopSelecter.addEventListener("change", () => loopSetting(channel2));
channel3.loopSelecter.addEventListener("change", () => loopSetting(channel3));
channel4.loopSelecter.addEventListener("change", () => loopSetting(channel4));
channel1.loopFromCue.addEventListener("click", () => loopSetFromCue(channel1));
channel2.loopFromCue.addEventListener("click", () => loopSetFromCue(channel2));
channel3.loopFromCue.addEventListener("click", () => loopSetFromCue(channel3));
channel4.loopFromCue.addEventListener("click", () => loopSetFromCue(channel4));

function loopSetting(channel){
    if(channel.loopSelecter.value != channel.previousLoop){
        loopReset(channel);

        if(Number(channel.loopSelecter.value) == 0){                    
            channel.isLooping = false;
            channel.buttons[channel.loopStart].classList.remove("loop");
            channel.buttons[channel.loopEnd].classList.remove("loop");    
            channel.loopStart = 0;
            channel.loopEnd = beat_end;
          }
        else if(Number(channel.loopSelecter.value) == 64){
        }
        else{
            channel.isLooping = true;
            
            channel.loopStart = channel.index;
            channel.loopEnd = channel.index + Number(channel.loopSelecter.value) - 1;
            if(channel.loopEnd > beat_end){
                for(let j = channel.loopStart; j <= beat_end; j ++){                
                    channel.buttons[j].classList.add("loop");
                }
                channel.loopEnd = beat_end - channel.loopEnd;
                for(let j = 0; j <= channel.loopEnd; j ++){                
                    channel.buttons[j].classList.add("loop");
                }                
            }
            else{

                for(let j = channel.loopStart; j <= channel.loopEnd; j ++){                
                    channel.buttons[j].classList.add("loop");
                }
            }
        }
        channel.previousLoop = channel.loopSelecter.value;
        /*ループデータの送信*/
        fetch("/setLoop", {
            method: "POST",
            headers: {
               'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                loopStart: channel.loopStart,
                loopEnd: channel.loopEnd
            })
        });
    }
}

function loopSetFromCue(channel){
    loopReset(channel);
    channel.isLooping = true;
    channel.loopStart = channel.cue;
    channel.loopEnd = channel.index - 1;
    channel.index = channel.loopStart;
  
    if(channel.loopEnd > beat_end){
        for(let j = channel.loopStart; j <= beat_end; j ++){                
            channel.buttons[j].classList.add("loop");
        }
        channel.loopEnd -= beat_end;
        for(let j = 0; j <= channel.loopEnd; j ++){                
            channel.buttons[j].classList.add("loop");
        }                
    }
    else{
        for(let j = channel.loopStart; j <= channel.loopEnd; j ++){                
            channel.buttons[j].classList.add("loop");
        }
    }
    channel.previousLoop = 64;
    channel.loopSelecter.value = 64;
    fetch("/setLoopFromCue", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            index: index,
            loopStart: channel.loopStart,
            loopEnd: channel.loopEnd
        })
    })

}

//ループリセット用関数
function loopReset(channel){
    //ループが64小節超えてない時のループリセット
    if(channel.loopEnd > channel.loopStart){ 
        for(let i = channel.loopStart ; i < channel.loopEnd ; i++){
            channel.buttons[i].classList.remove("loop");
        } 
    }
    //ループが64小節を超えている時のループリセット
    else{
        for(let i = 0 ; i < channel.loopEnd ; i++){
            channel.buttons[i].classList.remove("loop");
        }
        for(let i = channel.loopStart ; i < channel.buttons.length ; i++){
            channel.buttons[i].classList.remove("loop");
        }
     }
}

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
    /*モードデータ送信*/
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
channel3.brightnessSlider.addEventListener("input", function(){
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

/*CUE設定*/
channel1.buttons.forEach(function(button, boxNumber){
    button.addEventListener("click", () => cueSet(channel1, boxNumber))
});
channel2.buttons.forEach(function(button, boxNumber){
    button.addEventListener("click", () => cueSet(channel2, boxNumber))
});
channel3.buttons.forEach(function(button, boxNumber){
    button.addEventListener("click", () => cueSet(channel3, boxNumber))
});
channel4.buttons.forEach(function(button, boxNumber){
    button.addEventListener("click", () => cueSet(channel4, boxNumber))
});

function cueSet(channel, boxNumber){
    if(channel.index > 0 ){
        channel.buttons[channel.index - 1].classList.remove("active");
    }
    channel.buttons[channel.index].classList.remove("cue");
    //ループ外にCUEを設定したときの処理
    if(boxNumber < channel.loopStart || channel.loopEnd < boxNumber){
        //ループが最大小節数を超えてない時のループリセット
        if(channel.loopEnd > channel.loopStart){                            
            for(let i = channel.loopStart ; i <= channel.loopEnd ; i++){
                channel.buttons[i].classList.remove("loop");
            }
        }
        //ループが最大小節を超えている時のループリセット
        else{
            for(let i = 0 ; i <= channel.loopEnd ; i++){
                channel.buttons[i].classList.remove("loop");
            }
            for(let i = channel.loopStart ; i < channel.buttons.length ; i++){
                channel.buttons[i].classList.remove("loop");
            }
        }
        channel.loopStart = 0;
        channel.loopEnd = beat_end;
        channel.isLooping = false;
        channel.previousLoop = false;
        channel.loopSelecter.value = "0";
    }
    channel.index = boxNumber;
    if(channel.isPlaying == true){
        clearInterval(channel.colorInterval);
        channel.colorInterval = setInterval(() => play(channel), channel.intervalMs);

        fetch("/setIndex", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                index:  boxNumber,
                loopStart: channel.loopStart,
                loopEnd: channel.loopEnd
            })
        });
    }
    else{
        channel.buttons[channel.index].classList.remove('loop');
        channel.buttons[channel.index].classList.add('cue');
    }
    channel.cue = channel.index;

};

//play関数
function play(channel){
    channel.buttons[channel.index].classList.add('active'); // 緑に塗る
    //ループしている時
    if(channel.isLooping){                             
        if(channel.index > 0){
            channel.buttons[channel.index - 1].classList.remove("active");
        }
        channel.buttons[channel.index].classList.remove("loop");
        //ループが最大小節数を超えていない時
        if(channel.loopEnd > channel.loopStart){        
            if(channel.index > channel.loopStart){
                channel.buttons[channel.index - 1].classList.remove('active'); // 元の色に戻す
                channel.buttons[channel.index - 1].classList.add('loop');
            }
            else{
                channel.buttons[channel.loopEnd].classList.remove('active');
                channel.buttons[channel.loopEnd].classList.add('loop');
            }
        }
        //ループが最大小節数を超えているとき
        else{
            if(channel.index == 0){
                channel.buttons[channel.buttons.length - 1].classList.remove('active');
                channel.buttons[channel.buttons.length - 1].classList.add('loop');
            }
            else if(channel.index == channel.loopStart){
                channel.buttons[channel.loopEnd].classList.remove('active');
                channel.buttons[channel.loopEnd].classList.add('loop');
            }
            else{
                channel.buttons[channel.index - 1].classList.remove('active'); // 元の色に戻す
                channel.buttons[channel.index - 1].classList.add('loop');
            }
        }
    }
    //ループなしの場合
    else{
        if(channel.index > 0){
            channel.buttons[channel.index - 1].classList.remove('active'); // 元の色に戻す
        }
        else{
            channel.buttons[channel.buttons.length - 1].classList.remove('active');
        }
    }

    //現在位置を+1
    channel.index++ ;
    if(channel.index >= beat_end){
        channel.index = 0;
    }
    else if(channel.index ==  channel.loopEnd + 1){
        channel.index = channel.loopStart;
    }
}