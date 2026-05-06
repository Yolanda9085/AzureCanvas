import { __toESM } from "../../_virtual/_rolldown/runtime.js";
import { BoxGeometry, MathUtils, Mesh, MeshStandardMaterial, Vector3, TextureLoader, Color } from "three";
import { require_matter } from "../../node_modules/matter-js/build/matter.js";
import { gsapWithCSS } from "../../node_modules/gsap/index.js";
import { CARD_APPEARANCE } from "../config/cardConfig.js";
import { getPerformanceConfig } from "../utils/performance.js";
import { createCardTexture } from "./cardGenerator.js";

var import_matter = /* @__PURE__ */ __toESM(require_matter(), 1);
var perf = getPerformanceConfig();

var CardDeck = class {
    constructor(scene, camera, engine, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.engine = engine;
        this.world = engine.world;
        this.options = {
            width: CARD_APPEARANCE.width * 1.5,
            height: CARD_APPEARANCE.height * 1.5,
            depth: CARD_APPEARANCE.depth * 1.5,
            stackSpacing: CARD_APPEARANCE.stackSpacing,
            textureQuality: perf.textureQuality,
            ...options
        };
        this.cardsMesh = [];
        this.cardsBodies = [];
        
        // --- 核心参数：恢复第一版螺旋速度 ---
        this.spiralTurns = 3.5; 
        this.spiralSpacing = 1.2;
        
        this.isLocked = false;
        this.stackBaseY = 0;

        // 记录四张主角牌（现在改为五张）
        this.mainCards = [];
        this.idleTime = 0;
        this.isIdleAnimationEnabled = false;

        // 团队成员数据
        this.teamMembers = [
            {
                nickname: "Azure Explorer",
                avatarUrl: "team/222498847.jpg",
                philosophy: "Exploring the unknown blue, weaving dreams through code.",
                github: "AzureCanvas"
            },
            {
                nickname: "Canvas Master",
                avatarUrl: "team/257989705.jpg",
                philosophy: "Everything above the canvas is a world, everything below is a soul.",
                github: "AzureCanvas"
            },
            {
                nickname: "Void Architect",
                avatarUrl: "team/184054109.jpg",
                philosophy: "Building order in the void, searching for truth in code.",
                github: "AzureCanvas"
            },
            {
                nickname: "Pixel Wizard",
                avatarUrl: "team/184193429.png",
                philosophy: "Pixels are small, but can hold the universe; code is invisible, but has power.",
                github: "AzureCanvas"
            },
            {
                nickname: "Logic Weaver",
                avatarUrl: "team/258174284.png",
                philosophy: "Weaving logic through code, crossing the peak of algorithms.",
                github: "AzureCanvas"
            }
        ];
        
        // 预加载头像图片
        this.loadedAvatars = {};
        
        // 创建“核心开发者”标题元素
        this.createTitleElement();
    }
    
    /**
     * 创建屏幕中央的“核心开发者”标题
     */
    createTitleElement() {
        const titleContainer = document.createElement('div');
        titleContainer.id = 'core-developer-title';
        titleContainer.innerHTML = `
            <style>
                #core-developer-title .title-cn {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    font-size: 6rem;
                    font-weight: 700;
                    color: #ffffff;
                    text-shadow: 
                        0 0 20px rgba(100, 200, 255, 0.8),
                        0 0 40px rgba(100, 200, 255, 0.4),
                        0 2px 4px rgba(0, 0, 0, 0.3);
                    letter-spacing: 0.15em;
                    margin-bottom: 0.5rem;
                }
                #core-developer-title .title-en {
                    font-family: 'Inter', 'Courier New', monospace;
                    font-size: 3rem;
                    font-weight: 300;
                    color: rgba(200, 220, 255, 0.9);
                    text-shadow: 
                        0 0 10px rgba(100, 200, 255, 0.6),
                        0 0 20px rgba(100, 200, 255, 0.3);
                    letter-spacing: 0.3em;
                    text-transform: lowercase;
                }
            </style>
            <div class="title-cn">STAFF</div>
            <div class="title-en">CORE DEVELOPER</div>
        `;
        
        Object.assign(titleContainer.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: '1000',
            opacity: '0',
            pointerEvents: 'none'
        });
        
        document.body.appendChild(titleContainer);
        this.titleElement = titleContainer;
    }
    
    /**
     * 更新标题的显示/隐藏状态
     */
    updateTitleVisibility(progress) {
        if (!this.titleElement) return;
        
        // 扇形展开完成 (42%) 到 抽出开始 (42%) 之间显示
        if (progress >= 0.35 && progress <= 0.45) {
            this.titleElement.style.opacity = '1';
        } 
        // 开始抽出时缓慢消散
        else if (progress > 0.45 && progress <= 0.55) {
            const fadeProgress = (progress - 0.45) / 0.10; // 0 -> 1
            const opacity = 1 - fadeProgress;
            this.titleElement.style.opacity = Math.max(0, opacity).toString();
        }
        // 完全隐藏
        else {
            this.titleElement.style.opacity = '0';
        }
    }
    
    /**
     * 设置 UnrealBloomPass 引用（从 main.js 传入）
     */
    setBloomPass(bloomPass) {
        this.bloomPass = bloomPass;
    }
    
    /**
     * 动态更新 bloom 强度（在抽出阶段调用）
     */
    updateBloomIntensity(progress, isActive) {
        if (!this.bloomPass) return;
        
        if (isActive) {
            // 抽出阶段：逐渐增强 bloom 效果
            const targetStrength = 0.8; // 最大强度
            const currentStrength = progress * targetStrength;
            this.bloomPass.strength = Math.min(currentStrength, targetStrength);
        } else {
            // 非抽出阶段：逐渐减弱到0
            this.bloomPass.strength *= 0.95; // 平滑衰减
            if (this.bloomPass.strength < 0.01) {
                this.bloomPass.strength = 0;
            }
        }
    }
    
    /**
     * 预加载所有团队成员头像
     */
    async preloadTeamAvatars() {
        console.log('🖼️ 开始预加载团队头像...');
        
        const loadPromises = this.teamMembers.map((member, idx) => {
            return new Promise((resolve) => {
                const img = new Image();
                
                // 尝试不带 crossOrigin 加载（避免某些情况下的CORS问题）
                // 如果后续在 canvas 使用时报错，再尝试其他方式
                
                img.onload = () => {
                    console.log(`✅ 头像加载成功: ${member.nickname} (${member.avatarUrl})`);
                    console.log(`   图片尺寸: ${img.naturalWidth}x${img.naturalHeight}`);
                    
                    // 测试图片是否可以在 canvas 中使用
                    const testCanvas = document.createElement('canvas');
                    const testCtx = testCanvas.getContext('2d');
                    try {
                        testCtx.drawImage(img, 0, 0, 1, 1);
                        console.log(`   ✅ Canvas 兼容性测试通过`);
                        this.loadedAvatars[idx] = img;
                        resolve(img);
                    } catch (canvasError) {
                        console.warn(`⚠️ Canvas 跨域限制，图片无法在 canvas 中使用:`, canvasError.message);
                        console.warn(`   将使用默认头像替代`);
                        this.loadedAvatars[idx] = null; // 跨域失败，使用默认头像
                        resolve(null);
                    }
                };
                
                img.onerror = (e) => {
                    console.error(`❌ 头像加载失败: ${member.nickname}`, e);
                    console.error(`   URL: ${member.avatarUrl}`);
                    console.error(`   可能原因: 路径错误、文件不存在、或网络问题`);
                    
                    // 尝试不设置 crossOrigin 再次加载
                    if (img.crossOrigin === 'anonymous') {
                        console.log(`🔄 尝试不设置 crossOrigin 重新加载...`);
                        const img2 = new Image();
                        img2.onload = () => {
                            console.log(`✅ 第二次加载成功（无 crossOrigin）`);
                            this.loadedAvatars[idx] = img2;
                            resolve(img2);
                        };
                        img2.onerror = (e2) => {
                            console.error(`❌ 第二次加载也失败`, e2);
                            this.loadedAvatars[idx] = null;
                            resolve(null);
                        };
                        img2.src = member.avatarUrl;
                    } else {
                        this.loadedAvatars[idx] = null; // 将使用默认头像
                        resolve(null);
                    }
                };
                
                console.log(`⏳ 正在加载: ${member.avatarUrl}`);
                img.src = member.avatarUrl;
            });
        });
        
        const results = await Promise.all(loadPromises);
        const successCount = results.filter(r => r !== null).length;
        console.log(`🎯 头像预加载完成: ${successCount}/${this.teamMembers.length} 成功`);
        
        if (successCount < this.teamMembers.length) {
            console.warn(`⚠️ 有 ${this.teamMembers.length - successCount} 个头像加载失败，将显示默认头像（首字母）`);
        }
        
        return results;
    }

    /**
     * 螺旋位置计算
     */
    getPointOnSpiral(t) {
        const angle = t * Math.PI * 2 * this.spiralTurns;
        const radius = t * (this.spiralTurns * this.spiralSpacing);
        return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius, angle };
    }

    /**
     * 更新螺旋进度 (支持平滑展开)
     */
    setShuffleSpiralProgress(p) {
        if (this.isLocked) return;
        const total = this.cardsMesh.length;
        if (total === 0) return;
        
        // 缓入缓出
        const easedP = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        this.cardsMesh.forEach(card => card.visible = true);
        
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            const targetT = (total - 1 - i) / (total - 1);
            const currentT = Math.min(targetT, easedP);
            const pos = this.getPointOnSpiral(currentT);
            const y = (easedP < targetT) ? i * 0.05 : i * 0.001;
            mesh.position.set(pos.x, y, pos.z);
            mesh.rotation.set(Math.PI / 2, 0, -pos.angle);
        }
    }

    /**
     * 排队回收螺旋至正下方 (最多 5 张牌同时移动，直线轨迹)
     */
    collectSpiral(p) {
        if (this.isLocked) return;
        const total = this.cardsMesh.length;
        if (total === 0) return;

        const bottomZ = 6;
        const targetPos = { x: 0, z: bottomZ };
        
        // 限制并行数量为 5
        // 我们需要重新定义每个卡牌在 p [0, 1] 轴上的活跃区间
        const activeCount = 5;
        const windowSize = activeCount / total; // 每个窗口在 p 轴上的占比
        
        for (let i = 0; i < total; i++) {
            const mesh = this.cardsMesh[i];
            const targetT = (total - 1 - i) / (total - 1);
            
            // 计算该卡牌开始动作的 p 值
            // 我们希望 i=0 (最外圈) 先动。
            const startP = (i / total) * (1.0 - windowSize);
            const endP = startP + windowSize;
            
            let cardProg = 0;
            if (p > startP) {
                cardProg = Math.max(0, Math.min(1, (p - startP) / windowSize));
                // 使用缓入缓出函数
                cardProg = cardProg < 0.5 ? 2 * cardProg * cardProg : 1 - Math.pow(-2 * cardProg + 2, 2) / 2;
            }
            
            const spiralPos = this.getPointOnSpiral(targetT);
            
            mesh.position.x = MathUtils.lerp(spiralPos.x, targetPos.x, cardProg);
            mesh.position.z = MathUtils.lerp(spiralPos.z, targetPos.z, cardProg);
            mesh.position.y = MathUtils.lerp(i * 0.001, i * 0.02, cardProg);
            mesh.rotation.z = MathUtils.lerp(-spiralPos.angle, 0, cardProg);
        }
    }

    /**
     * 视图正下方单张展开为扇形
     */
    expandFanFromBottom(progress) {
        const bottomZ = 6;
        const radius = 8;
        const arcAngle = Math.PI * 0.3;
        const startAngle = -arcAngle / 2;
        const total = this.cardsMesh.length;
        const scale = 1.5;

        // 缓入缓出
        const easedP = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        this.cardsMesh.forEach((mesh, i) => {
            const angle = (startAngle + (i / (total - 1)) * arcAngle) * easedP;
            const x = Math.sin(angle) * radius;
            const z = bottomZ - (Math.cos(angle) * radius) + radius; 
            
            mesh.position.set(x, i * 0.01, z);
            mesh.rotation.set(Math.PI / 2, 0, angle);
            mesh.scale.set(scale, scale, scale);
        });
    }

    /**
     * 初始化牌堆
     */
    initCards(cardsData) {
        this.sharedGeometry = new BoxGeometry(this.options.width, this.options.height, this.options.depth);
        const loader = new TextureLoader();
        const cardBackTex = loader.load('card.png');

        cardsData.forEach((data, index) => {
            let cardFrontTex;
            
            // 最后五张牌使用团队成员纹理（与 mainCards = this.cardsMesh.slice(-5) 对应）
            const totalCards = cardsData.length;
            const isLastFive = index >= totalCards - 5;
            
            if (isLastFive) {
                // 计算在 teamMembers 数组中的索引（0-4）
                const memberIndex = index - (totalCards - 5);
                const avatar = this.loadedAvatars[memberIndex];
                
                console.log(`🃏 初始化第 ${index + 1} 张牌 - ${this.teamMembers[memberIndex].nickname} (主角牌 #${memberIndex + 1}):`);
                console.log(`   预加载头像对象: ${avatar ? '✅ 存在' : '❌ 为空'}`);
                if (avatar) {
                    console.log(`   头像尺寸: ${avatar.naturalWidth}x${avatar.naturalHeight}`);
                }
                
                const memberData = {
                    isTeamMember: true,
                    ...this.teamMembers[memberIndex],
                    avatarImage: avatar || null // 传入预加载的图片对象
                };
                // 使用高质量纹理 (quality=3) 避免放大时马赛克
                cardFrontTex = createCardTexture(memberData, 3);
            } else {
                cardFrontTex = createCardTexture({ isCustom: true, customText: "INFO" }, this.options.textureQuality);
            }

            const materials = [
                new MeshStandardMaterial({ color: 0xffffff }), 
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ color: 0xffffff }),
                new MeshStandardMaterial({ map: cardFrontTex, transparent: true }), 
                new MeshStandardMaterial({ map: cardBackTex, transparent: true })  
            ];

            const mesh = new Mesh(this.sharedGeometry, materials);
            mesh.rotation.set(Math.PI / 2, 0, 0);
            this.scene.add(mesh);
            this.cardsMesh.push(mesh);
            
            const body = import_matter.default.Bodies.rectangle(0, 0, this.options.width, this.options.height, { isStatic: true });
            this.cardsBodies.push(body);
        });

        // 取最后五张作为主角牌（保证对称）
        this.mainCards = this.cardsMesh.slice(-5);
        import_matter.default.World.add(this.world, this.cardsBodies);
    }

    /**
     * 初始状态：四张牌重叠在中心
     */
    prepareMainCards() {
        this.mainCards.forEach((card, idx) => {
            card.position.set(0, idx * 0.05, 0);
            card.rotation.set(Math.PI / 2, 0, 0); // 背面朝上
            card.visible = true;
        });
        // 隐藏其他干扰牌
        this.cardsMesh.forEach(card => {
            if (!this.mainCards.includes(card)) card.visible = false;
        });
    }

    /**
     * 扇形散开动画
     */
    spreadMainCards(progress) {
        const radius = 6;
        const total = this.mainCards.length;
        const startAngle = -Math.PI * 0.15;
        const endAngle = Math.PI * 0.15;

        this.mainCards.forEach((card, i) => {
            const angle = MathUtils.lerp(0, startAngle + (i / (total - 1)) * (endAngle - startAngle), progress);
            const x = Math.sin(angle) * radius * progress;
            const z = (1.0 - Math.cos(angle)) * radius * progress;
            
            card.position.x = x;
            card.position.z = z;
            card.rotation.z = angle;
        });
    }

    /**
     * 左右翻转动画 (Y轴翻转)
     */
    flipMainCards() {
        this.mainCards.forEach((card, idx) => {
            gsapWithCSS.to(card.rotation, {
                y: Math.PI, // 左右翻转 180 度
                duration: 1.2,
                delay: idx * 0.15,
                ease: "power2.inOut"
            });
        });
    }

    /**
     * 5 张牌整体抽出至中心后，再缓慢散开 (仿图 1 -> 图 2 模式)
     */
    /**
     * 五张牌从扇形中抽出并逐渐向屏幕中央散开
     * 包含丝滑的翻面过渡动画
     */
    drawMainCards(progress) {
        const bottomZ = 6;
        const finalY = 2;
        const finalZ = -2;
        const baseScale = 1.5;

        // 缓入缓出
        const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const easedP = easeInOutCubic(progress);

        this.mainCards.forEach((card, idx) => {
            // 对称布局：idx 0,1,2,3,4 映射到 -2, -1, 0, 1, 2
            const offsetIdx = idx - 2;
            
            // 图 2 模式的散开参数
            const spreadX = offsetIdx * 3.5;
            const spreadZ = -Math.abs(offsetIdx) * 0.8;
            const spreadRotZ = offsetIdx * 0.15;

            let targetX, targetY, targetZ, targetRotZ, targetRotY;

            // 阶段一：0.0 - 0.4 整体叠在一起抽出到屏幕中央 (对应图 1)
            if (easedP <= 0.4) {
                const subProg = easedP / 0.4;
                targetX = 0;
                targetY = MathUtils.lerp(0.5, finalY, subProg);
                targetZ = MathUtils.lerp(bottomZ, finalZ, subProg);
                targetRotZ = 0;
                targetRotY = 0; // 背面
            } 
            // 阶段二：0.4 - 0.7 在中央缓慢散开至图 2 模式（保持背面）
            else if (easedP <= 0.7) {
                const subProg = (easedP - 0.4) / 0.3;
                targetX = MathUtils.lerp(0, spreadX, subProg);
                targetY = finalY;
                targetZ = MathUtils.lerp(finalZ, finalZ + spreadZ, subProg);
                targetRotZ = MathUtils.lerp(0, spreadRotZ, subProg);
                targetRotY = 0; // 保持背面
            }
            // 阶段三：0.7 - 1.0 丝滑翻面过渡（从背面翻到正面）
            else {
                const subProg = (easedP - 0.7) / 0.3;
                // 翻面使用 easeInOutCubic 让翻转更自然
                const flipEase = subProg < 0.5 
                    ? 4 * subProg * subProg * subProg 
                    : 1 - Math.pow(-2 * subProg + 2, 3) / 2;
                
                targetX = spreadX;
                targetY = finalY;
                targetZ = finalZ + spreadZ;
                targetRotZ = spreadRotZ;
                
                // 丝滑翻面：0 (背面) → PI (正面)
                targetRotY = flipEase * Math.PI;
                
                // 翻面时稍微提升渲染层级
                card.renderOrder = Math.floor(50 * flipEase);
            }
            
            card.position.set(targetX, targetY, targetZ);
            card.scale.set(baseScale, baseScale, baseScale);
            card.rotation.set(Math.PI / 2, targetRotY, targetRotZ); 
        });
    }

    /**
     * 根据滚动进度更新场景背景颜色
     * 同步 index.html 中的 sky-change 动画逻辑
     */
    updateBackgroundColor(p) {
        if (!this.scene) return;
        
        const startColor = new Color('#000F33');
        const endColor = new Color('#003bbe');
        
        let lerpFactor = 0;
        if (p <= 0.4) {
            lerpFactor = 0;
        } else if (p >= 0.7) {
            lerpFactor = 1;
        } else {
            // 0.4 - 0.7 之间进行线性插值
            lerpFactor = (p - 0.4) / 0.3;
        }
        
        // 如果 scene.background 还没有被初始化为 Color 对象，则初始化它
        if (!(this.scene.background instanceof Color)) {
            this.scene.background = new Color();
        }
        
        this.scene.background.copy(startColor).lerp(endColor, lerpFactor);
    }

    /**
     * 由 CSS Scroll-Driven Animation 驱动的整体更新逻辑
     * 时间线：平衡的节奏分配
     */
    updateFromCSSProgress(p) {
        if (this.isLocked) return;

        // 同步背景颜色
        this.updateBackgroundColor(p);

        // 阶段 1: 展开螺旋 (0% - 12%)
        if (p <= 0.12) {
            this.setShuffleSpiralProgress(p / 0.12);
            this.isIdleAnimationEnabled = false;
            this.updateBloomIntensity(0, false); // 关闭 bloom
        } 
        // 阶段 2: 排队收回至底堆 (12% - 28%)
        else if (p > 0.12 && p <= 0.28) {
            this.collectSpiral((p - 0.12) / 0.16);
            this.isIdleAnimationEnabled = false;
            this.updateBloomIntensity(0, false); // 关闭 bloom
        }
        // 阶段 3: 底堆展开为扇形 (28% - 42%)
        else if (p > 0.28 && p <= 0.42) {
            this.expandFanFromBottom((p - 0.28) / 0.14);
            this.isIdleAnimationEnabled = false;
            this.updateBloomIntensity(0, false); // 关闭 bloom
        }
        // 阶段 4a: 五张牌从扇形中抽出并逐渐向屏幕中央散开 (42% - 55%) - 启用 bloom
        else if (p > 0.42 && p <= 0.55) {
            const drawProgress = (p - 0.42) / 0.13;
            this.drawMainCards(drawProgress);
            this.isIdleAnimationEnabled = false;
            this.updateBloomIntensity(drawProgress, true); // 启用 bloom，随进度增强
        }
        // 阶段 4b: 在已散开的五张牌中，依次旋转放大、全屏展示 (55% - 80%)
        else if (p > 0.55 && p <= 0.80) {
            this.showMainCardsSequentially((p - 0.55) / 0.25);
            this.isIdleAnimationEnabled = false;
            this.updateBloomIntensity(1, true); // 保持最大 bloom
        }
        // 阶段 5: 归正到中央的丝滑动画 (80% - 100%)
        else if (p > 0.80) {
            this.recycleCardsSmoothly((p - 0.80) / 0.20);
            this.isIdleAnimationEnabled = true;
            this.updateBloomIntensity(0, false); // 衰减 bloom
        }
        
        // 更新标题显示/隐藏
        this.updateTitleVisibility(p);
    }

    /**
     * 五张牌依次旋转放大、全屏展示（带回收循环）
     * 每张牌：从散开位置 → 全屏展示 → 倒放回到原位 → 下一张
     */
    showMainCardsSequentially(progress) {
        const totalCards = this.mainCards.length; // 5张牌
        
        // 时间分配：每张牌 = 展示(50%) + 回收(50%)
        const cardCycleDuration = 1 / totalCards; // 0.2 per card
        
        // 全屏展示参数
        const fullScreenScale = 4.5;
        const displayZ = -3;
        const displayY = 3.5;
        
        this.mainCards.forEach((card, idx) => {
            const cycleStart = idx * cardCycleDuration;
            const cycleEnd = cycleStart + cardCycleDuration;
            
            // 起始位置：drawMainCards的散开位置（保持不变）
            const offsetIdx = idx - 2;
            const restX = offsetIdx * 3.5;
            const restY = 2;
            const restZ = -2 + (-Math.abs(offsetIdx) * 0.8);
            const restRotZ = offsetIdx * 0.15;
            const restScale = 1.5;
            
            if (progress < cycleStart) {
                card.position.set(restX, restY, restZ);
                card.scale.set(restScale, restScale, restScale);
                card.rotation.set(Math.PI / 2, Math.PI, restRotZ); // 确保在背景时已经是正面
                card.renderOrder = 0;
                card.visible = true;
                
            } else if (progress >= cycleEnd) {
                card.position.set(restX, restY, restZ);
                card.scale.set(restScale, restScale, restScale);
                card.rotation.set(Math.PI / 2, Math.PI, restRotZ); // 确保在背景时已经是正面
                card.renderOrder = 0;
                card.visible = true;
                
            } else {
                const localProgress = (progress - cycleStart) / (cycleEnd - cycleStart);
                
                // 使用统一的进度值，前半段正向，后半段反向（完美倒放）
                let animProgress;
                if (localProgress < 0.5) {
                    // 展示阶段：0 -> 1
                    animProgress = localProgress / 0.5;
                } else {
                    // 回收阶段：1 -> 0 （倒放！）
                    animProgress = 1 - (localProgress - 0.5) / 0.5;
                }
                
                // 统一的缓动函数
                const eased = animProgress < 0.5 
                    ? 4 * animProgress * animProgress * animProgress 
                    : 1 - Math.pow(-2 * animProgress + 2, 3) / 2;
                
                // 统一的位置/缩放/旋转计算（展示和回收共用）
                card.position.x = MathUtils.lerp(restX, 0, eased);
                card.position.y = MathUtils.lerp(restY, displayY, eased);
                card.position.z = MathUtils.lerp(restZ, displayZ, eased);
                
                const scaleEase = Math.pow(eased, 0.7);
                const currentScale = MathUtils.lerp(restScale, fullScreenScale, scaleEase);
                card.scale.set(currentScale, currentScale, currentScale);
                
                card.rotation.x = Math.PI / 2;
                // 翻转逻辑：基于 Math.PI (正面) 进行翻转动画，而不是从 0 开始
                card.rotation.y = Math.PI + (eased * Math.PI); 
                card.rotation.z = MathUtils.lerp(restRotZ, 0, eased);
                
                // 动态渲染层级
                card.renderOrder = Math.floor(100 * eased + 1);
                
                card.visible = true;
            }
        });
    }

    /**
     * 丝滑回收动画：五张牌从全屏状态平滑缩小并移回原位
     */
    /**
     * 丝滑回收动画：从散开位置 → 归正到中央整齐排列
     * 包含两个阶段：聚拢 + 对齐
     */
    recycleCardsSmoothly(progress) {
        const totalCards = this.mainCards.length;
        
        // 使用更平滑的缓动函数（easeInOutQuart）
        const easedP = progress < 0.5 
            ? 8 * progress * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 4) / 2;

        this.mainCards.forEach((card, idx) => {
            // 起始位置：散开位置（与 showMainCardsSequentially 的 restX/Y/Z 一致）
            const offsetIdx = idx - 2;
            const startX = offsetIdx * 3.5; // 散开的X位置
            const startY = 2; // 散开的Y位置
            const startZ = -2 + (-Math.abs(offsetIdx) * 0.8); // 散开的Z位置
            const startRotZ = offsetIdx * 0.15; // 散开的角度
            const startScale = 1.5; // 散开的大小
            
            // 最终位置：整齐排列在屏幕中央偏下
            const finalX = (idx - 2) * 3.0; // 五张牌横向排列，间距适中
            const finalY = 0.8; // 稍微偏下
            const finalZ = 1.5; // 靠近相机
            const finalRotZ = (idx - 2) * 0.1; // 轻微弧度
            const finalScale = 2.0; // 最终展示大小

            // 每张牌稍微错开时间，形成波浪式归正效果（从中间向两边）
            const centerIdx = (totalCards - 1) / 2; // 中心索引 = 2
            const distanceFromCenter = Math.abs(idx - centerIdx);
            const delay = distanceFromCenter * 0.08; // 距离中心越远，延迟越大
            
            const adjustedProgress = Math.max(0, Math.min(1, (easedP - delay) / (1 - delay)));
            
            // 使用弹性缓动让归正更自然
            const cardEase = adjustedProgress < 0.5 
                ? 4 * adjustedProgress * adjustedProgress * adjustedProgress 
                : 1 - Math.pow(-2 * adjustedProgress + 2, 3) / 2;

            // 阶段一 (0-60%)：快速聚拢到中心附近
            // 阶段二 (60-100%)：缓慢对齐到最终精确位置
            let currentX, currentY, currentZ, currentRotZ, currentScale;
            
            if (adjustedProgress < 0.6) {
                // 快速聚拢阶段
                const gatherProg = adjustedProgress / 0.6;
                const gatherEase = gatherProg < 0.5 
                    ? 4 * gatherProg * gatherProg * gatherProg 
                    : 1 - Math.pow(-2 * gatherProg + 2, 3) / 2;
                
                // 先移动到中间位置（介于散开和最终之间）
                const midX = (startX + finalX) / 2;
                const midY = (startY + finalY) / 2;
                const midZ = (startZ + finalZ) / 2;
                
                currentX = MathUtils.lerp(startX, midX, gatherEase);
                currentY = MathUtils.lerp(startY, midY, gatherEase);
                currentZ = MathUtils.lerp(startZ, midZ, gatherEase);
                currentRotZ = MathUtils.lerp(startRotZ, (startRotZ + finalRotZ) / 2, gatherEase);
                currentScale = MathUtils.lerp(startScale, (startScale + finalScale) / 2, gatherEase);
                
            } else {
                // 缓慢对齐阶段
                const alignProg = (adjustedProgress - 0.6) / 0.4;
                const alignEase = alignProg < 0.5 
                    ? 4 * alignProg * alignProg * alignProg 
                    : 1 - Math.pow(-2 * alignProg + 2, 3) / 2;
                
                // 中间位置
                const midX = (startX + finalX) / 2;
                const midY = (startY + finalY) / 2;
                const midZ = (startZ + finalZ) / 2;
                const midRotZ = (startRotZ + finalRotZ) / 2;
                const midScale = (startScale + finalScale) / 2;
                
                currentX = MathUtils.lerp(midX, finalX, alignEase);
                currentY = MathUtils.lerp(midY, finalY, alignEase);
                currentZ = MathUtils.lerp(midZ, finalZ, alignEase);
                currentRotZ = MathUtils.lerp(midRotZ, finalRotZ, alignEase);
                currentScale = MathUtils.lerp(midScale, finalScale, alignEase);
            }
            
            // 应用计算出的值
            card.position.set(currentX, currentY, currentZ);
            card.scale.set(currentScale, currentScale, currentScale);
            
            // --- 修复跳转逻辑 ---
            // 直接锁定为正面 (Math.PI)，因为从 4a 阶段开始它们已经是正面了
            // 这样可以彻底消除因重新计算进度导致的“跳回背面”问题
            card.rotation.x = Math.PI / 2;
            card.rotation.y = Math.PI; 
            card.rotation.z = currentRotZ;
            
            // 动态渲染层级（逐渐降低）
            card.renderOrder = Math.floor(50 * (1 - adjustedProgress) + 10);

            card.visible = true;
        });
    }

    /**
     * 律动起伏动画：仅上下，幅度减小，无旋转
     */
    updateIdleAnimation(dt) {
        if (!this.isIdleAnimationEnabled) return;
        this.idleTime += dt;
        this.mainCards.forEach((card, i) => {
            // 计算正弦波偏移量
            const wave = Math.sin(this.idleTime * 1.5 + i * 0.8) * 0.03;
            // 修复：基于卡牌当前位置进行微调，而不是覆盖它
            card.position.y += wave; 
        });
    }

    /**
     * 移动到角落并彻底翻面
     */
    moveToCorner(progress) {
        if (this.isLocked) return;
        const cornerX = -8;
        const cornerZ = 4;
        this.cardsMesh.forEach((mesh, i) => {
            const lagAmount = i * 0.005;
            const dynamicProgress = Math.max(0, Math.min(1, progress - lagAmount));
            const targetPos = new Vector3(cornerX, i * 0.015, cornerZ);
            
            mesh.position.lerpVectors(mesh.position.clone(), targetPos, dynamicProgress);
            // 翻转：从正面(-PI/2)到背面(PI/2)[cite: 2]
            mesh.rotation.x = MathUtils.lerp(mesh.rotation.x, Math.PI / 2, dynamicProgress);
            mesh.rotation.z = MathUtils.lerp(mesh.rotation.z, 0, dynamicProgress);
        });
    }

    /**
     * 发牌到小堆：确保位置对齐扇形顶点
     */
    dealToSmallDeck() {
        const hearts = this.cardsMesh.slice(0, 13);
        const syncZ = 2.0; // 对应 fanSpread(0) 的坐标点
        hearts.forEach((card, idx) => {
            gsapWithCSS.to(card.position, {
                x: 0, y: idx * 0.02, z: syncZ,
                duration: 0.4, delay: idx * 0.05, ease: "power2.out"
            });
            gsapWithCSS.to(card.rotation, { x: Math.PI / 2, z: 0, duration: 0.4, delay: idx * 0.05 });
        });
    }

    /**
     * 扇形展开：公式重构
     * 圆心在前 (Z=10)，公式：Z = Center - R * cos(theta)
     */
    fanSpread(progress = 1) {
        if (this.isLocked) return;
        const totalHearts = 13;
        const hearts = this.cardsMesh.slice(0, totalHearts);
        const radius = 8;
        const arcAngle = Math.PI * 0.4;
        const startAngle = -arcAngle / 2;
        
        // 圆心设在卡牌前方（靠近相机）
        const centerZBase = 10; 

        hearts.forEach((mesh, i) => {
            const angle = (startAngle + (i / (totalHearts - 1)) * arcAngle) * progress;
            const x = Math.sin(angle) * radius;
            // 凸起计算：因为圆心在前，减去cos偏移让中间向后缩，边缘向后缩得更多，
            // 最终在背面朝上的视角下形成向玩家凸出的弧线[cite: 2]
            const z = centerZBase - (Math.cos(angle) * radius);
            
            mesh.position.set(x, i * 0.02, z);
            // 修正旋转角方向
            mesh.rotation.set(Math.PI / 2, 0, angle); 
        });
    }

    /**
     * 发出三张主角牌：锁定并禁止回滚
     */
    dealThreeCards() {
        this.isLocked = true; // 锁定状态，禁止上滑回滚[cite: 2]
        const topThree = this.cardsMesh.slice(0, 13).slice(-3).reverse();
        const customTexts = ["CONTENT 1", "CONTENT 2", "CONTENT 3"];

        topThree.forEach((card, idx) => {
            // 动态更换牌面纹理
            const newFront = createCardTexture({ isCustom: true, customText: customTexts[idx] }, this.options.textureQuality);
            card.material[4].map = newFront;
            card.material[4].needsUpdate = true;

            const tl = gsapWithCSS.timeline({ delay: idx * 0.3 });
            tl.to(card.position, {
                x: (idx - 1) * 3.5, y: 1.5, z: -1,
                duration: 1, ease: "expo.inOut"
            })
            .to(card.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 1 }, "<")
            .to(card.rotation, {
                x: Math.PI / 2, // 翻转回正面朝上[cite: 2]
                y: 0,
                z: Math.PI * 2,
                duration: 1.2,
                ease: "back.out(1.2)"
            }, "<");
        });
        return topThree;
    }

    /**
     * 背景卡牌淡出逻辑
     */
    fadeOutDeck(excludeCards = []) {
        this.cardsMesh.forEach((mesh) => {
            if (!excludeCards.includes(mesh)) {
                mesh.material.forEach(mat => {
                    gsapWithCSS.to(mat, {
                        opacity: 0,
                        duration: 0.8,
                        onComplete: () => { mesh.visible = false; }
                    });
                });
            }
        });
    }
};

export { CardDeck };
