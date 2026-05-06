// ============================================
// PCB风格电路动画 - 负责人：@glow
// 从四角生长
// 深蓝背景适配：青蓝→电光蓝→淡紫渐变
// ============================================
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    let audioCtx = null;
    let audioEnabled = false;
    let audioPlayed = false;
    let toast = null;

    function showToast(message, isHint = true) {
        if (toast) toast.remove();
        toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = 'rgba(0,0,0,0.85)';
        toast.style.backdropFilter = 'blur(10px)';
        toast.style.color = '#88ccff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '40px';
        toast.style.fontFamily = 'monospace';
        toast.style.fontSize = '14px';
        toast.style.zIndex = '100000';
        toast.style.border = '1px solid rgba(100,200,255,0.5)';
        toast.style.boxShadow = '0 0 20px rgba(100,200,255,0.3)';
        toast.style.whiteSpace = 'nowrap';
        document.body.appendChild(toast);
        
        if (isHint) {
            setTimeout(() => {
                if (toast) toast.style.opacity = '0';
                setTimeout(() => { if (toast) toast.remove(); }, 500);
            }, 4000);
        }
    }

    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioEnabled = true;
            showToast('⚡ Circuit Activated! Try clicking faster during loading for clearer sound effects next time.', true);
        } catch(e) { console.log('Audio not supported'); }
    }

    function playPowerUpSound() {
        if (!audioEnabled || !audioCtx || audioPlayed) return;
        audioPlayed = true;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const now = audioCtx.currentTime;
            
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1200, now);
            osc1.frequency.exponentialRampToValueAtTime(200, now + 0.8);
            gain1.gain.setValueAtTime(0.25, now);
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start();
            osc1.stop(now + 1.2);
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'square';
            osc2.frequency.value = 880;
            gain2.gain.setValueAtTime(0.12, now);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(now + 0.6);
            
            const osc3 = audioCtx.createOscillator();
            const gain3 = audioCtx.createGain();
            osc3.type = 'sawtooth';
            osc3.frequency.value = 80;
            gain3.gain.setValueAtTime(0.08, now);
            gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
            osc3.connect(gain3);
            gain3.connect(audioCtx.destination);
            osc3.start();
            osc3.stop(now + 1.5);
            
            console.log('[Circuit] Power-up sound effect played');
        } catch(e) { console.log('Sound effect failed to play', e); }
    }

    function init() {
        const canvas = document.createElement('canvas');
        canvas.id = 'circuit-border-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '99999';
        canvas.style.backgroundColor = 'transparent';
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let allTraces = [];      // 所有电路走线
        let particles = [];
        let currentProgress = 0;
        let isComplete = false;
        let time = 0;
        
        const centerMarginX = 180;  // 避开中心区域宽度
        const centerMarginY = 150;  // 避开中心区域高度
        
        // 方向：仅保留上下左右，去掉斜向
        const dirs = [
            { dx: 1, dy: 0, name: 'right' },    // 右
            { dx: -1, dy: 0, name: 'left' },    // 左
            { dx: 0, dy: 1, name: 'down' },     // 下
            { dx: 0, dy: -1, name: 'up' }       // 上
        ];
        
        // 电路走线类
        class PCBTrace {
            constructor(startX, startY, startDirIdx, width, colorHue) {
                this.points = [{ x: startX, y: startY }];
                this.width = width;      // 线宽
                this.colorHue = colorHue;
                this.active = true;
                this.length = 0;
                this.maxLength = 80 + Math.random() * 50;  // 总节点数
                this.currentDirIdx = startDirIdx;
                this.branches = [];
                this.hasBranched = false;
            }
            
            // 生长一格（横平竖直）
            growStep(w, h, progress) {
                if (this.points.length >= this.maxLength) return false;
                
                const last = this.points[this.points.length - 1];
                
                // 随机改变方向（仅限90度转弯）
                if (Math.random() < 0.2) {
                    this.currentDirIdx = Math.floor(Math.random() * dirs.length);
                }
                
                const dir = dirs[this.currentDirIdx];
                let stepLen = 18 + Math.random() * 8; 
                
                let newX = last.x + dir.dx * stepLen;
                let newY = last.y + dir.dy * stepLen;
                
                // 边界限制
                newX = Math.min(w - 15, Math.max(15, newX));
                newY = Math.min(h - 15, Math.max(15, newY));
                
                // 避开中心区域
                const centerX = w / 2, centerY = h / 2;
                const dx = newX - centerX;
                const dy = newY - centerY;
                if (Math.abs(dx) < centerMarginX && Math.abs(dy) < centerMarginY) {
                    // 如果进入中心区域，向外弹开
                    if (Math.abs(dx) < centerMarginX) {
                        newX = centerX + (dx > 0 ? centerMarginX : -centerMarginX);
                    }
                    if (Math.abs(dy) < centerMarginY) {
                        newY = centerY + (dy > 0 ? centerMarginY : -centerMarginY);
                    }
                }
                
                // 避免与自身过近（简单检测）
                let tooClose = false;
                for (let i = Math.max(0, this.points.length - 5); i < this.points.length; i++) {
                    const p = this.points[i];
                    const dist = Math.hypot(newX - p.x, newY - p.y);
                    if (dist < 8) { tooClose = true; break; }
                }
                if (tooClose) return false;
                
                this.points.push({ x: newX, y: newY });
                this.length++;
                
                // 随机产生分支
                if (!this.hasBranched && this.points.length > 5 && Math.random() < 0.1 * progress) {
                    this.hasBranched = true;
                    const branchWidth = this.width * 0.6;
                    const branchHue = this.colorHue + 15;
                    const branchDir = (this.currentDirIdx + 1) % dirs.length;
                    const branch = new PCBTrace(newX, newY, branchDir, branchWidth, branchHue);
                    branch.maxLength = this.maxLength * 0.5;
                    this.branches.push(branch);
                }
                
                return true;
            }
            
            grow(w, h, progress) {
                if (!this.active) return;
                const targetLen = Math.floor(this.maxLength * progress);
                while (this.points.length - 1 < targetLen && this.points.length - 1 < this.maxLength) {
                    if (!this.growStep(w, h, progress)) break;
                }
                
                for (let branch of this.branches) {
                    branch.grow(w, h, progress);
                }
            }
            
            draw(ctx, brightness, time) {
                if (this.points.length < 2) return;
                
                const alpha = 0.6 + brightness * 0.4;
                const lineWidth = this.width * (0.5 + brightness * 0.8);
                
                for (let i = 0; i < this.points.length - 1; i++) {
                    const p1 = this.points[i];
                    const p2 = this.points[i+1];
                    
                    // 颜色渐变：青蓝(180) → 电光蓝(210) → 淡紫(280)
                    const t = i / this.points.length;
                    const hue = (this.colorHue + t * 40) % 360;
                    
                    // 主线
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `hsla(${hue}, 90%, 55%, ${alpha})`;
                    ctx.lineWidth = lineWidth * (1 - t * 0.3);
                    ctx.stroke();
                    
                    // 内层高光
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `hsla(${hue}, 95%, 70%, ${alpha * 0.5})`;
                    ctx.lineWidth = lineWidth * 0.4;
                    ctx.stroke();
                }
                
                // 绘制节点
                const nodeCount = Math.floor(this.points.length * brightness);
                for (let i = 0; i < nodeCount; i++) {
                    const p = this.points[i];
                    const pulse = 0.5 + Math.sin(time * 10 + i) * 0.5;
                    const rad = (2 + brightness * 4) * (0.6 + pulse * 0.4);
                    
                    const t = i / this.points.length;
                    const hue = (this.colorHue + t * 40) % 360;
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${hue}, 95%, 65%, 0.9)`;
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.arc(p.x - 1, p.y - 1, rad * 0.3, 0, Math.PI * 2);
                    ctx.fillStyle = `white`;
                    ctx.fill();
                }
                
                for (let branch of this.branches) {
                    branch.draw(ctx, brightness, time);
                }
            }
            
            collectSegments(segments) {
                for (let i = 0; i < this.points.length - 1; i++) {
                    segments.push({
                        p1: this.points[i],
                        p2: this.points[i+1],
                        hue: this.colorHue
                    });
                }
                for (let branch of this.branches) {
                    branch.collectSegments(segments);
                }
            }
        }
        
        // 从四角生成多束电路
        function initTraces(w, h) {
            allTraces = [];
            
            // 每个角落增加至 8-12 束电路
            const corners = [
                { x: 20, y: 20, baseAngle: 0, hues: [180, 195, 210] },           // 左上
                { x: w - 20, y: 20, baseAngle: 1, hues: [195, 210, 225] },       // 右上
                { x: w - 20, y: h - 20, baseAngle: 2, hues: [210, 225, 240] },   // 右下
                { x: 20, y: h - 20, baseAngle: 3, hues: [225, 240, 255] }        // 左下
            ];
            
            for (let corner of corners) {
                const count = 8 + Math.floor(Math.random() * 5); // 增加数量
                for (let i = 0; i < count; i++) {
                    let startDirIdx;
                    if (corner.baseAngle === 0) startDirIdx = Math.random() > 0.5 ? 0 : 2; // 右或下
                    else if (corner.baseAngle === 1) startDirIdx = Math.random() > 0.5 ? 1 : 2; // 左或下
                    else if (corner.baseAngle === 2) startDirIdx = Math.random() > 0.5 ? 1 : 3; // 左或上
                    else startDirIdx = Math.random() > 0.5 ? 0 : 3; // 右或上
                    
                    const width = 2 + Math.random() * 6;
                    const hue = corner.hues[i % corner.hues.length] + (Math.random() - 0.5) * 30;
                    const trace = new PCBTrace(corner.x, corner.y, startDirIdx, width, hue);
                    trace.maxLength = 100 + Math.random() * 150; // 增加长度
                    allTraces.push(trace);
                }
            }
        }
        
        function updateParticles(brightness, w, h) {
            if (brightness < 0.1) return;
            
            // 收集所有线段
            let allSegments = [];
            for (let trace of allTraces) {
                trace.collectSegments(allSegments);
            }
            
            const targetCount = Math.floor(150 * brightness); // 增加粒子密度
            while (particles.length < targetCount) {
                const seg = allSegments[Math.floor(Math.random() * allSegments.length)];
                if (seg) {
                    particles.push({
                        seg: seg,
                        pos: Math.random(),
                        speed: 0.01 + Math.random() * 0.02,
                        size: 1.5 + Math.random() * 3
                    });
                } else {
                    break;
                }
            }
            
            for (let i = particles.length-1; i >= 0; i--) {
                const p = particles[i];
                p.pos += p.speed * brightness;
                if (p.pos >= 1) {
                    particles.splice(i, 1);
                    continue;
                }
                
                const x = p.seg.p1.x + (p.seg.p2.x - p.seg.p1.x) * p.pos;
                const y = p.seg.p1.y + (p.seg.p2.y - p.seg.p1.y) * p.pos;
                const t = p.pos;
                const hue = (p.seg.hue + t * 40) % 360;
                
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(x, y, p.size * brightness, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 95%, 65%, 0.9)`;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(x, y, p.size * brightness * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = `white`;
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }
        
        function draw() {
            if (!ctx) return;
            const w = canvas.width, h = canvas.height;
            if (w === 0 || h === 0) return;
            
            if (isComplete) {
                ctx.clearRect(0, 0, w, h);
                return;
            }
            
            ctx.clearRect(0, 0, w, h);
            const brightness = Math.min(1, Math.max(0, currentProgress));
            if (brightness === 0) return;
            
            time += 0.03;
            
            // 让所有电路生长
            for (let trace of allTraces) {
                trace.grow(w, h, brightness);
            }
            
            ctx.shadowBlur = brightness * 10;
            ctx.shadowColor = `hsla(200, 90%, 55%, ${brightness * 0.8})`;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // 绘制所有电路
            for (let trace of allTraces) {
                trace.draw(ctx, brightness, time);
            }
            
            // 绘制流动粒子
            updateParticles(brightness, w, h);
            
            ctx.shadowBlur = 0;
        }
        
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initTraces(canvas.width, canvas.height);
            draw();
        }
        
        window.addEventListener('resize', resize);
        resize();
        
        function animate() {
            draw();
            requestAnimationFrame(animate);
        }
        animate();
        
        function completeAndFadeOut() {
            if (isComplete) return;
            isComplete = true;
            
            if (audioEnabled && audioCtx) {
                playPowerUpSound();
            } else {
                showToast('🔊 Click anywhere to unlock circuit sound effects! Growth initiated from corners~⚡', true);
            }
            
            let opacity = 1;
            function fadeOut() {
                if (!canvas) return;
                opacity -= 0.05;
                if (opacity <= 0) {
                    canvas.style.opacity = '0';
                    setTimeout(() => {
                        if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
                        if (toast) toast.remove();
                    }, 300);
                } else {
                    canvas.style.opacity = opacity;
                    requestAnimationFrame(fadeOut);
                }
            }
            fadeOut();
        }
        
        // 劫持进度
        const originalUpdate = window.Preloader?.update;
        if (window.Preloader && window.Preloader.update) {
            window.Preloader.update = function(progress, status) {
                currentProgress = progress;
                if (originalUpdate) originalUpdate(progress, status);
                if (progress >= 1 && !isComplete) completeAndFadeOut();
            };
        }
        
        function monitorProgressBar() {
            const progressFill = document.getElementById('progress-bar-fill');
            if (progressFill) {
                const observer = new MutationObserver(() => {
                    const width = progressFill.style.width;
                    if (width) {
                        const percent = parseFloat(width) / 100;
                        if (!isNaN(percent)) {
                            currentProgress = percent;
                            if (percent >= 1 && !isComplete) completeAndFadeOut();
                        }
                    }
                });
                observer.observe(progressFill, { attributes: true, attributeFilter: ['style'] });
                return;
            }
            setTimeout(monitorProgressBar, 200);
        }
        monitorProgressBar();
        
        document.body.addEventListener('click', function once() {
            initAudio();
            document.body.removeEventListener('click', once);
        });
        
        setTimeout(() => {
            if (!audioEnabled) {
                showToast('⚡ Try clicking faster during loading for clearer sound effects next time.', true);
            }
        }, 1500);
        
        setTimeout(() => {
            if (!isComplete && currentProgress < 1) {
                currentProgress = 1;
                completeAndFadeOut();
            }
        }, 12000);
        
        console.log('[Circuit] PCB style animation started, growing from corners with orthogonal lines');
    }
})();
