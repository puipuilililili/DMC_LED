const activeColor = "#377494";//明るさコントロールスライダー用の定数
const inactiveColor = "#dddddd";//明るさコントロールスライダー用の定数
const fileSelect = document.getElementById("fileSelect");
const input = document.getElementById("preset");
let data = {};

fileSelect.addEventListener("click", (e) => {
  if (input) {
    input.click();
  }
}, false);

const channel1 = {
    id: 1,
    intervalMs: 180,
    colorInterval: null,
    index: 0,
    previousLoop: 0,
    isLooping: false,
    mode: 1,
    loopStart: 0,
    loopEnd: 256,
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
    load: document.getElementById("load_ch1")
};

const channel2 = {
    id: 2,
    intervalMs: 180,
    colorInterval: null,
    index: 0,
    previousLoop: 0,
    isLooping: false,
    mode: 1,
    loopStart: 0,
    loopEnd: 256,
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
    load: document.getElementById("load_ch2")
};

/*BPMコントロール */
channel1.bpmInput.addEventListener("input", () => bpmChange(channel1));
channel2.bpmInput.addEventListener("input", () => bpmChange(channel2));

function bpmChange(channel){
    if (!channel.bpmInput.value || channel.bpmInput.value <= 0 || channel.bpmInput.value <= 60 || channel.bpmInput >= 360) return; // 入力チェック
    channel.intervalMs = 60 / channel.bpmInput.value / 2 * 1000;
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

function bpm05(channel){
    let bpm05 = 30 / channel.intervalMs * 500;
    if (bpm05 < 30 || 30 / bpm05 > 360) return; // 入力チェック
    channel.intervalMs = channel.intervalMs * 2;
    channel.bpmInput.value /= 2;
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

//BPM x 2
channel1.bpmx2.addEventListener("click", () => bpmx2(channel1));
channel2.bpmx2.addEventListener("click", () => bpmx2(channel2));

function bpmx2(channel){
    let bpmx2 = 30 / channel.intervalMs * 2000;
    if (bpmx2 < 30 || bpmx2 > 361) return; // 入力チェック
    channel.intervalMs = channel.intervalMs / 2;
    channel.bpmInput.value *= 2; 
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


/*play pauseボタン */
channel1.playPauseButton.addEventListener("click", () => playPause(channel1, channel2));
channel2.playPauseButton.addEventListener("click", () => playPause(channel2, channel1));

function playPause(activeChannel, otherChannel){
    //Play → Pause
    if(activeChannel.isPlaying == true){
        stopChannel(activeChannel);
    }
    //Pause → Play
    else{
        startChannel(activeChannel, otherChannel);
    }
}

function stopChannel(channel){
    clearInterval(channel.colorInterval);
    channel.playPauseButton.textContent = "Play" ;
    channel.isPlaying = false;
    fetch("/stop",{});
}
function startChannel(activeChannel, otherChannel){
    activeChannel.buttons[activeChannel.index].classList.remove("cue");
    clearInterval(otherChannel.colorInterval);
    otherChannel.colorInterval = null;
    clearInterval(activeChannel.colorInterval);
    activeChannel.colorInterval = setInterval(() => {
        play(activeChannel);
    }, activeChannel.intervalMs);
    activeChannel.isPlaying = true;
    activeChannel.playPauseButton.textContent = "Pause";
    otherChannel.isPlaying = false
    otherChannel.playPauseButton.textContent = "Play";
    /*各マスのデータ及び、index, loopStart, loopEnd送信*/
    data = {}
    for(i = 0; i < 256 ; i++){
        data[i] = activeChannel.buttons[i].value;
    }
    data[256] = activeChannel.index
    data[257] = activeChannel.loopStart
    data[258] = activeChannel.loopEnd
    data[259] = activeChannel.intervalMs
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
channel1.loopFromCue.addEventListener("click", () => loopSetFromCue(channel1));
channel2.loopFromCue.addEventListener("click", () => loopSetFromCue(channel2));


function loopSetting(channel){
    if(channel.loopSelecter.value != channel.previousLoop){
        loopReset(channel);

        if(Number(channel.loopSelecter.value) == 0){                    
            channel.isLooping = false;
            channel.buttons[channel.loopStart].classList.remove("loop");
            channel.buttons[channel.loopEnd].classList.remove("loop");    
            channel.loopStart = 0;
            channel.loopEnd = 256;
          }
        else if(Number(channel.loopSelecter.value) == 64){
        }
        else{
            channel.isLooping = true;
            
            channel.loopStart = channel.index;
            channel.loopEnd = channel.index + channel.loopSelecter.value * 2 - 1;

            if(channel.loopEnd > 256){
                for(let j = channel.loopStart; j <= 63; j ++){                
                    channel.buttons[j].classList.add("loop");
                }
                channel.loopEnd -= 256;
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
  
    if(channel.loopEnd > 256){
        for(let j = channel.loopStart; j <= 63; j ++){                
            channel.buttons[j].classList.add("loop");
        }
        channel.loopEnd -= 256;
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
    alert(channel.loopStart)
    alert(channel.loopEnd)

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

function cueSet(channel, boxNumber){
    if(channel.index > 0 ){
        channel.buttons[channel.index - 1].classList.remove("active");
    }
    channel.buttons[channel.index].classList.remove("cue");
    //ループ外にCUEを設定したときの処理
    if(boxNumber < channel.loopStart || channel.loopEnd < boxNumber){
        //ループが64小節超えてない時のループリセット
        if(channel.loopEnd > channel.loopStart){                            
            for(let i = channel.loopStart ; i <= channel.loopEnd ; i++){
                channel.buttons[i].classList.remove("loop");
            }
        }
        //ループが64小節を超えている時のループリセット
        else{
            for(let i = 0 ; i <= channel.loopEnd ; i++){
                channel.buttons[i].classList.remove("loop");
            }
            for(let i = channel.loopStart ; i < channel.buttons.length ; i++){
                channel.buttons[i].classList.remove("loop");
            }
        }
        channel.loopStart = 0;
        channel.loopEnd = 256;
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

channel1.resetButton.addEventListener("click", () => reset(channel1));
channel2.resetButton.addEventListener("click", () => reset(channel2));

function reset(channel){
    for(i = 0 ; i < 256 ; i++){
        channel.buttons[i].value = "#FFFFFF";
    }
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
        //ループが64小節目を超えない時
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
        //ループが64小節目を超える時
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
    if(channel.index >= 256){
        channel.index = 0;
    }
    else if(channel.index ==  channel.loopEnd + 1){
        channel.index = channel.loopStart;
    }
}



channel1.load.addEventListener("click", () => load(channel1));
channel2.load.addEventListener("click", () => load(channel2));

function load(channel){
    alert("aaa")
    if(channel.isPlaying == false){
        alert(input.value);
    }
}



const btn = document.getElementById('btn');

btn.addEventListener('click', function() {
    let a = ['a', 'b', 'c']
      const blob = new Blob(a, { "type" : "text/plain" });

      btn.href = window.URL.createObjectURL(blob);   
})