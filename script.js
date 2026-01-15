// ===== إعدادات اللعبة =====
let MUSIC_ENABLED = true; // تتحكم بموسيقى الخلفية
let EFFECTS_ENABLED = true; // تتحكم بالمؤثرات الصوتية
let ENEMY_IMAGES = [
    "https://emojiguide.com/wp-content/uploads/platform/google/43983.png",
    "https://emojiguide.com/wp-content/uploads/platform/apple/43983.png"
];
let PLAYER_IMAGE = "https://www.freeiconspng.com/uploads/red-rocket-png-5.png";

let score=0,lives=3,isRunning=false,enemies=[],lasers=[],fireInterval=null,autoFire=false,lastTap=0;

const scoreVal=document.getElementById("scoreVal"),
highScoreVal=document.getElementById("highScoreVal"),
finalScore=document.getElementById("finalScore"),
finalHighScore=document.getElementById("finalHighScore"),
rankText=document.getElementById("rankText"),
livesVal=document.getElementById("livesVal"),
player=document.getElementById("player"),
battleField=document.getElementById("battleField"),
fireBtn=document.getElementById("fireBtn"),
laserSound=document.getElementById("laserSound"),
explosionSound=document.getElementById("explosionSound"),
bgMusic=document.getElementById("bgMusic");

let highScore=localStorage.getItem("highScore")||0;
highScoreVal.textContent=highScore;

let enemyImgs = [...ENEMY_IMAGES];

// --- بدء اللعبة ---
function initGame(){
    document.getElementById("startScreen").style.display="none";
    document.getElementById("gameContainer").style.display="block";
    score=0;lives=3;enemies=[];lasers=[];
    scoreVal.textContent=score;livesVal.textContent="❤️❤️❤️";
    isRunning=true;
    player.style.background=`url('${PLAYER_IMAGE}') no-repeat center`;
    player.style.backgroundSize="contain";
    enemyImgs = [...ENEMY_IMAGES];
    if(MUSIC_ENABLED) bgMusic.play(); else bgMusic.pause();
    gameLoop();
}

// --- الحركة ---
let keys = {};
document.addEventListener("keydown", e => keys[e.key]=true);
document.addEventListener("keyup", e => keys[e.key]=false);

function movePlayer(){
    if(!isRunning) return;
    let x = player.offsetLeft;
    let y = player.offsetTop;
    if(keys["ArrowLeft"] || keys["a"]){x -= 10;}
    if(keys["ArrowRight"] || keys["d"]){x += 10;}
    if(keys["ArrowUp"] || keys["w"]){y -= 10;}
    if(keys["ArrowDown"] || keys["s"]){y += 10;}
    x = Math.max(0,Math.min(window.innerWidth-60,x));
    y = Math.max(0,Math.min(window.innerHeight-75,y));
    player.style.left = x + "px";
    player.style.top = y + "px";
}
setInterval(movePlayer,20);

// الماوس / لمس الجوال
window.addEventListener("mousemove", e => { player.style.left = Math.max(0,Math.min(window.innerWidth-60,e.clientX-30)) + "px"; });
window.addEventListener("touchmove", e => { e.preventDefault(); player.style.left = Math.max(0,Math.min(window.innerWidth-60,e.touches[0].clientX-30)) + "px"; }, {passive:false});

// --- إطلاق الليزر ---
function fireLaser(){
    if(!isRunning) return;
    const l=document.createElement("div");
    l.className="laser";
    l.style.left=(player.offsetLeft+28)+"px";
    l.style.top=(player.offsetTop)+"px";
    battleField.appendChild(l);
    lasers.push({el:l,y:player.offsetTop});
    if(EFFECTS_ENABLED){ // شغل المؤثرات فقط إذا مفعلة
        laserSound.currentTime=0;
        laserSound.play();
    }
}

function startFiring(){ if(!fireInterval) fireLaser(); if(!fireInterval) fireInterval=setInterval(fireLaser,200); }
function stopFiring(){ if(fireInterval && !autoFire){ clearInterval(fireInterval); fireInterval=null; } }

fireBtn.addEventListener("mousedown",()=>{ if(!autoFire) startFiring(); });
fireBtn.addEventListener("mouseup", stopFiring);
fireBtn.addEventListener("mouseleave", stopFiring);

// الجوال - الضغط المزدوج للتلقائي
fireBtn.addEventListener("touchstart", e=>{
    e.preventDefault();
    let currentTime = new Date().getTime();
    let tapLength = currentTime-lastTap;
    if(tapLength<400 && tapLength>0){
        autoFire = !autoFire;
        fireBtn.textContent = autoFire ? "🚀 تلقائي" : "🔥 إطلاق النار";
        if(autoFire) startFiring(); else stopFiring();
    } else { if(!autoFire) startFiring(); }
    lastTap=currentTime;
}, {passive:false});
fireBtn.addEventListener("touchend", e=>{ e.preventDefault(); stopFiring(); }, {passive:false});

// --- الانفجارات ---
function explode(x,y){
    const ex=document.createElement("div");
    ex.className="explosion";
    ex.style.left=x+"px"; ex.style.top=y+"px";
    battleField.appendChild(ex);
    setTimeout(()=>ex.remove(),400);
    if(EFFECTS_ENABLED){ // شغل المؤثرات فقط إذا مفعلة
        explosionSound.currentTime=0;
        explosionSound.play();
    }
}

// --- وحوش ---
function spawnEnemy(){
    const e=document.createElement("div"); 
    e.className="enemy";
    e.style.background=`url('${enemyImgs[Math.floor(Math.random()*enemyImgs.length)]}') no-repeat center`;
    e.style.left=Math.random()*(window.innerWidth-50)+"px";
    e.style.top="-60px";
    battleField.appendChild(e);

    // نحدد سرعة العدو حسب مستوى الصعوبة
    let difficulty = parseInt(document.getElementById("diffLevel").value);
    let speed;
    if(difficulty === 1) speed = 2 + Math.random()*2;      // مبتدئ
    else if(difficulty === 2) speed = 4 + Math.random()*2; // محترف
    else speed = 6 + Math.random()*2;                      // أسطوري

    enemies.push({el:e, y:-60, s:speed});
}


// --- الحلقة الرئيسية ---
function gameLoop(){
    if(!isRunning) return;

    lasers.forEach((l,i)=>{
        l.y-=10;
        l.el.style.top=l.y+"px";
        if(l.y<-20){ l.el.remove(); lasers.splice(i,1); }
    });

    enemies.forEach((e,i)=>{
        e.y+=e.s;
        e.el.style.top=e.y+"px";

        let pr=player.getBoundingClientRect(), er=e.el.getBoundingClientRect();
        if(!(pr.right<er.left||pr.left>er.right||pr.bottom<er.top||pr.top>er.bottom)){
            lives--; livesVal.innerText="❤️".repeat(lives);
            e.el.remove(); enemies.splice(i,1);
            if(lives<=0){ endGame(); return; }
        }

        lasers.forEach((l,j)=>{
            let lr=l.el.getBoundingClientRect();
            if(!(lr.right<er.left||lr.left>er.right||lr.bottom<er.top||lr.top>er.bottom)){
                score++; scoreVal.textContent=score;
                explode(er.left,er.top);
                e.el.remove(); enemies.splice(i,1);
                l.el.remove(); lasers.splice(j,1);
            }
        });

        if(e && e.y>window.innerHeight){ e.el.remove(); enemies.splice(i,1); }
    });

    if(Math.random()<0.02) spawnEnemy();
    requestAnimationFrame(gameLoop);
}

// --- إنهاء اللعبة ---
function endGame(){
    isRunning=false; 
    bgMusic.pause();

    // تشغيل صوت الخسارة
    const loseSound = document.getElementById("loseSound");
    loseSound.currentTime = 0;  // يبدأ الصوت من البداية
    loseSound.play();

    if(score>highScore){highScore=score; localStorage.setItem("highScore",highScore);}
    document.getElementById("gameOverScreen").style.display="flex";
    finalScore.textContent=score; 
    finalHighScore.textContent=highScore;
    rankText.textContent=getRank(score);
}


// --- رتبة اللاعب ---
function getRank(s){
    if(s<100)return"🟢 مبتدئ";
    if(s<300)return"🔵 محترف";
    if(s<600)return"🟣 أسطوري";
    return"🔥 سيد المجرة";
}

// --- الإعدادات ---
const settingsScreen=document.getElementById("settingsScreen");
const settingsBtn=document.querySelector(".settings-btn");
const settingsBackBtn=document.getElementById("settingsBackBtn");

settingsBtn.addEventListener("click", ()=>{ document.getElementById("startScreen").style.display="none"; settingsScreen.style.display="flex"; });
settingsBackBtn.addEventListener("click", ()=>{ settingsScreen.style.display="none"; document.getElementById("startScreen").style.display="flex"; });

// --- التحكم بالموسيقى والمؤثرات ---
const musicToggleBtn = document.getElementById("musicToggleBtn");
musicToggleBtn.addEventListener("click", () => {
    MUSIC_ENABLED = !MUSIC_ENABLED;
    if(MUSIC_ENABLED) { bgMusic.play(); musicToggleBtn.textContent = "🎵 موسيقى الخلفية: تشغيل"; }
    else { bgMusic.pause(); musicToggleBtn.textContent = "🎵 موسيقى الخلفية: إيقاف"; }
});

const effectsToggleBtn = document.getElementById("effectsToggleBtn");
effectsToggleBtn.addEventListener("click", () => {
    EFFECTS_ENABLED = !EFFECTS_ENABLED;
    effectsToggleBtn.textContent = EFFECTS_ENABLED ? "🔊 المؤثرات: تشغيل" : "🔊 المؤثرات: إيقاف";
});

// تغيير اللاعب
function changePlayer(url){ PLAYER_IMAGE=url; player.style.background=`url('${PLAYER_IMAGE}') no-repeat center`; player.style.backgroundSize="contain"; }

// تغيير الوحوش
function changeEnemies(arr){ ENEMY_IMAGES = [...arr]; enemyImgs = [...ENEMY_IMAGES]; alert("تم تحديث الوحوش!"); }
