import * as THREE from 'three';
import { gsap } from 'gsap';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

(function() {
    const authForm = document.getElementById('auth-form');
    const submitBtn = document.getElementById('submit-btn');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const formTitle = document.getElementById('form-title');
    const rememberMeContainer = document.getElementById('remember-me-container');
    const avatarDialog = document.getElementById('avatar-dialog');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarUpload = document.getElementById('avatar-upload');
    const activateBtn = document.getElementById('activate-account');
    const skipBtn = document.getElementById('skip-avatar');

    // Audio elements
    const errorAudio = new Audio('../audios/login/error.ogg');
    const accessGrantedAudio = new Audio('../audios/login/access_granted.ogg');
    const restoreBackupAudio = new Audio('../audios/login/restoring_from_backup.ogg');
    const initializingAudio = new Audio('../audios/login/Initializing_10s.ogg');
    const initiatingSimAudio = new Audio('../audios/login/Initiating_the_simulation.ogg');

    let isRegisterMode = false;
    let selectedAvatarFile = null;

    let user_local = '';
    let password_local = '';

    // Toggle between Login and Register
    toggleAuthBtn.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;

        if (isRegisterMode) {
            authForm.classList.add('register-mode');
            formTitle.innerText = 'CREATE ACCOUNT';
            submitBtn.innerText = 'SIGN UP';
            toggleAuthBtn.innerText = 'Back to Login';
            rememberMeContainer.style.display = 'none';

            // Add required attributes for register fields
            document.getElementById('email').required = true;
            document.getElementById('confirm-password').required = true;
        } else {
            authForm.classList.remove('register-mode');
            formTitle.innerText = 'AZURE CANVAS';
            submitBtn.innerText = 'ENTER SYSTEM';
            toggleAuthBtn.innerText = 'Create Account';
            rememberMeContainer.style.display = 'flex';

            // Remove required attributes
            document.getElementById('email').required = false;
            document.getElementById('confirm-password').required = false;
        }
    });

    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (isRegisterMode) {
            const email = document.getElementById('email').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                handleLoginError('Passwords do not match');
                return;
            }

            handleRegister(username, email, password);
        } else {
            const rememberMe = document.getElementById('inputcheckbox').checked;
            handleLogin(username, password, rememberMe);
        }
    });

    async function handleLogin(username, password, rememberMe) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerText = 'AUTHENTICATING...';

        try {
            const response = await fetch('https://api.szsummer.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': window.getCsrfToken()
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    remember: rememberMe
                })
            });

            const data = await response.json();
            user_local = username;
            password_local = password;
            if (data.success) {
                window.notify.show('Login successful! Accessing system...', 'success');
                startSuccessSequence(false); // Pass false for login
            } else {
                handleLoginError(data.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            handleLoginError('Connection error. Please try again later.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerText = isRegisterMode ? 'SIGN UP' : 'ENTER SYSTEM';
        }
    }

    async function handleRegister(username, email, password) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerText = 'CREATING ACCOUNT...';

        try {
            const response = await fetch('https://api.szsummer.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': window.getCsrfToken()
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });
            const data = await response.json();

            if (data.success) {
                window.notify.show('Account created successfully!', 'success');
                showAvatarDialog(username);
            } else {
                handleLoginError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            handleLoginError('Connection error. Please try again later.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerText = isRegisterMode ? 'SIGN UP' : 'ENTER SYSTEM';
        }
    }

    function showAvatarDialog(username) {
        // Form "fly out" to the right
        gsap.to(authForm, {
            x: 500,
            opacity: 0,
            scale: 0.8,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
                authForm.style.display = 'none';

                // Set initial avatar
                const initial = username.charAt(0).toUpperCase();
                avatarPreview.innerText = initial;
                avatarPreview.style.background = 'linear-gradient(135deg, #ff00ff, #7000ff)';

                // Show dialog
                avatarDialog.style.display = 'flex';
                setTimeout(() => {
                    avatarDialog.classList.add('show');
                }, 10);
            }
        });
    }

    // Avatar upload handling
    avatarUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Avatar">`;
                activateBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    skipBtn.addEventListener('click', () => {
        startSuccessSequence(true); // Pass true for registration
    });

    activateBtn.addEventListener('click', async () => {
        if (!selectedAvatarFile) return;

        activateBtn.disabled = true;
        activateBtn.innerText = 'ACTIVATING...';

        // Here you would normally upload the avatar
        // For now, we just proceed to success sequence
        startSuccessSequence(true); // Pass true for registration
    });

    function startSuccessSequence(isRegistration = false) {
        // Hide dialog if visible
        if (avatarDialog.classList.contains('show')) {
            avatarDialog.classList.remove('show');
            setTimeout(() => {
                avatarDialog.style.display = 'none';
            }, 600);
        }

        // Apply 3D exit animation to the active form/dialog container
        const target = (avatarDialog.style.display !== 'none' && avatarDialog.classList.contains('show')) ? avatarDialog : authForm;
        target.classList.add('form-exit-anim');

        // Start 3D sequence
        runComplex3DSequence(isRegistration);
    }

    async function runComplex3DSequence(isRegistration) {
        const tunnel = window.laserTunnel;
        if (!tunnel) return;

        // Phase 1: Access Granted (2D DOM)
        await accessGrantedAudio.play();
        const statusOverlay = document.getElementById('status-overlay');
        const statusMain = document.getElementById('status-main');
        const statusSub = document.getElementById('status-sub');

        statusMain.innerText = 'ACCESS GRANTED';
        statusSub.innerText = 'Verification Successful';

        gsap.to(statusOverlay, { opacity: 1, duration: 0.5 });
        gsap.from(statusMain, { scale: 1.5, opacity: 0, duration: 0.8, ease: 'back.out(2)' });

        // Enhance tunnel effects
        tunnel.isLoginSuccessful = true;

        if (!isRegistration) {
            // Short sequence for Login
            // Wait for audio to finish or at least play for a while
            await new Promise(r => {
                accessGrantedAudio.onended = r;
                setTimeout(r, 2500); // Fallback/Max wait
            });

            // Move camera to exit
            // We'll accelerate the cameraSpeed which is used in the tunnel's animate loop
            gsap.to(tunnel, {
                cameraSpeed: 250,
                duration: 2.5,
                ease: 'power2.in'
            });

            // FOV effect for speed sensation
            gsap.to(tunnel.camera, {
                fov: 140,
                duration: 2.5,
                ease: 'power2.in',
                onUpdate: () => tunnel.camera.updateProjectionMatrix()
            });

            // Fade out the "Access Granted" overlay
            gsap.to(statusOverlay, {
                opacity: 0,
                duration: 1,
                delay: 1
            });

            // Wait for the camera to reach the "exit" area
            await new Promise(r => setTimeout(r, 2200));

            // Final white out transition
            const whiteOverlay = document.createElement('div');
            Object.assign(whiteOverlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'white',
                zIndex: '5000',
                opacity: '0',
                pointerEvents: 'none'
            });
            document.body.appendChild(whiteOverlay);

            await gsap.to(whiteOverlay, {
                opacity: 1,
                duration: 0.6,
                ease: 'power1.in'
            });

            if (user_local === "admin" && password_local === "admin123"){
                window.location.href = '/admin/robots.html';
                return;
            }

            // Redirect to the system
            let path = window.location.href.substring(window.location.href.indexOf("?redirect="));
            let target = path.indexOf('=');
            window.location.href = '../' + target;
            return;
        }

        // Phase 2: Initializing Profile (2D DOM Update) - Only for Registration
        await new Promise(r => setTimeout(r, 2500));
        await restoreBackupAudio.play();

        // Animated text swap
        gsap.to(statusMain, {
            opacity: 0,
            y: -20,
            duration: 0.4,
            onComplete: () => {
                statusMain.innerText = 'INITIALIZING USER PROFILE';
                statusMain.style.fontSize = '40px';
                statusMain.style.color = '#ff00ff';
                statusMain.style.textShadow = '0 0 30px rgba(255, 0, 255, 0.8)';
                statusSub.innerText = 'Restoring environment data...';
                gsap.to(statusMain, { opacity: 1, y: 0, duration: 0.4 });
            }
        });

        // Add pink hexagons to background
        addHexagonsToTunnel(tunnel);

        await new Promise(r => setTimeout(r, 3000));

        // Phase 3: Initializing 10s
        await initializingAudio.play();
        gsap.to(tunnel.camera, { fov: 120, duration: 4, onUpdate: () => tunnel.camera.updateProjectionMatrix() });

        // Motion blur effect via bloom and speed
        const originalSpeed = 15;
        gsap.to({ speed: originalSpeed }, {
            speed: 70,
            duration: 9,
            onUpdate: function() {
                tunnel.cameraSpeed = this.targets()[0].speed;
            }
        });
        if (tunnel.bloomPass) {
            gsap.to(tunnel.bloomPass, { strength: 6, radius: 1.2, duration: 3 });
        }

        if (tunnel.lasers) {
            for (let i = 0; i < 60; i++) {
                setTimeout(() => {
                    const laserGeo = new THREE.CylinderGeometry(0.1, 0.1, 20, 8);
                    const color = Math.random() > 0.5 ? 0x00ff88 : 0xff00ff;
                    const laserGroup = new THREE.Group();
                    const core = new THREE.Mesh(laserGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
                    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 21, 8),
                        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7, side: THREE.BackSide }));
                    laserGroup.add(core, glow);
                    tunnel.resetLaser(laserGroup);
                    tunnel.scene.add(laserGroup);
                    tunnel.lasers.push(laserGroup);
                }, i * 25);
            }
        }
        await new Promise(r => setTimeout(r, 11000));

        // Phase 4: Activating Screen (White screen)
        const activatingScreen = document.getElementById('activating-screen');
        activatingScreen.style.display = 'flex';
        gsap.to(activatingScreen, { opacity: 1, duration: 0.3 });

        // Play the final audio and wait for it to complete
        await initiatingSimAudio.play();

        // Wait for the audio to finish (approximately 4 seconds based on previous logic)
        await new Promise(r => {
            initiatingSimAudio.onended = r;
            setTimeout(r, 4500); // Fallback
        });

        // Redirect to the system
        window.location.href = '../islands/index.html';
    }

    function addHexagonsToTunnel(tunnel) {
        const hexGeo = new THREE.CircleGeometry(3, 6);
        const hexMat = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const hex = new THREE.Mesh(hexGeo, hexMat.clone());
                const angle = Math.random() * Math.PI * 2;
                const radius = 8 + Math.random() * 5;
                const zDist = 100 + Math.random() * 300;

                hex.position.x = Math.cos(angle) * radius;
                hex.position.y = Math.sin(angle) * radius;
                hex.position.z = tunnel.camera.position.z - zDist;
                hex.lookAt(0, 0, hex.position.z);
                hex.rotation.z = Math.random() * Math.PI;
                tunnel.scene.add(hex);

                gsap.to(hex.material, { opacity: 0.5, duration: 1.5 });
                // Slow rotation
                gsap.to(hex.rotation, { z: hex.rotation.z + Math.PI, duration: 5 + Math.random() * 5, repeat: -1, ease: 'none' });
            }, i * 40);
        }
    }

    function startFinalPortalTransition(tunnel) {
        import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
            const loader = new GLTFLoader();
            const newScene = new THREE.Scene();
            newScene.background = new THREE.Color(0x000205);

            // Post-processing setup
            const composer = tunnel.composer;
            const renderPass = new RenderPass(newScene, tunnel.camera);
            composer.passes = [renderPass, tunnel.bloomPass];

            // Lights
            const ambient = new THREE.AmbientLight(0x222222, 1);
            newScene.add(ambient);

            const lights = [];
            const colors = [0xff00ff, 0x00ffff, 0x00ff88, 0xff0088];
            for(let i = 0; i < 8; i++) {
                const p = new THREE.PointLight(colors[i % 4], 150, 400);
                newScene.add(p);
                lights.push(p);
            }

            // Procedural Tunnel Segments (from login-tunnel.js)
            const proceduralGroup = new THREE.Group();
            newScene.add(proceduralGroup);
            const segmentMats = [
                new THREE.MeshStandardMaterial({ color: '#ff33aa', roughness: 0.1, metalness: 0.8 }),
                new THREE.MeshStandardMaterial({ color: '#33aaff', roughness: 0.1, metalness: 0.8 }),
                new THREE.MeshStandardMaterial({ color: '#33ffff', roughness: 0.1, metalness: 0.8 })
            ];

            const generateSegment = (z) => {
                const group = new THREE.Group();
                const points = 12;
                const radius = 8;
                for (let j = 0; j < points; j++) {
                    const angle = (j / points) * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    if (Math.random() > 0.4) {
                        const geo = Math.random() > 0.5 ? new THREE.BoxGeometry(0.2, 0.2, 4) : new THREE.CylinderGeometry(0.1, 0.1, 4, 4);
                        const mesh = new THREE.Mesh(geo, segmentMats[Math.floor(Math.random() * 3)]);
                        mesh.position.set(x, y, z);
                        mesh.lookAt(0, 0, z);
                        group.add(mesh);
                    }
                }
                return group;
            };

            for (let i = 0; i < 30; i++) {
                proceduralGroup.add(generateSegment(-i * 10));
            }

            // Waterfall Setup (to be added at 13s)
            let waterfallMesh = null;
            const createWaterfall = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 1024;
                const ctx = canvas.getContext('2d');
                const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                grad.addColorStop(0, '#0066ff');
                grad.addColorStop(0.5, '#002288');
                grad.addColorStop(1, '#0066ff');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < 800; i++) {
                    ctx.fillStyle = `rgba(150, 200, 255, ${Math.random() * 0.25})`;
                    ctx.beginPath();
                    ctx.ellipse(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2 + 1, Math.random() * 40 + 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                const tex = new THREE.CanvasTexture(canvas);
                tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                const geom = new THREE.CylinderGeometry(40, 40, 1000, 32, 1, true);
                const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
                const mesh = new THREE.Mesh(geom, mat);
                mesh.rotation.x = Math.PI / 2;
                return mesh;
            };

            Promise.all([
                loader.loadAsync('../models/PloyFramework.glb')
            ]).then(([glb1]) => {
                const modelGroup = new THREE.Group();
                newScene.add(modelGroup);

                const models = [];
                const rings = 20;
                const perRing = 8;
                const baseRadius = 25;

                for (let r = 0; r < rings; r++) {
                    for (let i = 0; i < perRing; i++) {
                        const model = glb1.scene.clone();
                        const angle = (i / perRing) * Math.PI * 2 + (r * 0.3);
                        const z = r * 50;
                        model.position.set(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius, z);
                        model.lookAt(0, 0, z);
                        model.scale.set(10, 10, 10);

                        model.traverse(node => {
                            if (node.isMesh) {
                                node.material = new THREE.MeshStandardMaterial({
                                    color: 0xffffff,
                                    emissive: colors[(i + r) % 4],
                                    emissiveIntensity: 13, // No glow
                                    roughness: 0.2,
                                    metalness: 0.9
                                });
                            }
                        });
                        modelGroup.add(model);
                        models.push({ mesh: model, angle, z, baseRadius });
                    }
                }

                tunnel.scene = newScene;
                tunnel.camera.position.set(0, 0, 50);
                tunnel.camera.fov = 75;
                tunnel.camera.updateProjectionMatrix();

                let portalTime = 0;
                const startTime = Date.now();
                let cameraZ = 0;
                let waterfallAdded = false;

                const animate = () => {
                    portalTime = (Date.now() - startTime) / 1000;
                    const expansion = 1 + Math.min(1, portalTime / 13) * 3;

                    cameraZ+= (1.5 + (portalTime / 40) * 5);
                    tunnel.camera.position.z = cameraZ;

                    // Procedural group follows camera
                    proceduralGroup.position.z = cameraZ;

                    models.forEach(m => {
                        const r = m.baseRadius * expansion;
                        m.mesh.position.x = Math.cos(m.angle + portalTime * 0.1) * r;
                        m.mesh.position.y = Math.sin(m.angle + portalTime * 0.1) * r;
                        m.mesh.rotation.z += 0.01;
                    });

                    lights.forEach((l, i) => {
                        const angle = portalTime * 0.8 + i * Math.PI / 4;
                        l.position.set(Math.cos(angle) * 30 * expansion, Math.sin(angle) * 30 * expansion, cameraZ - 50);
                    });

                    if (portalTime >= 13 && !waterfallAdded) {
                        waterfallMesh = createWaterfall();
                        newScene.add(waterfallMesh);
                        gsap.to(waterfallMesh.material, { opacity: 0.8, duration: 3 });
                        gsap.to(tunnel.bloomPass, { strength: 0.6, duration: 4 });
                        waterfallAdded = true;
                    }

                    if (waterfallMesh) {
                        // waterfallMesh.position.z = cameraZ - 200;
                        waterfallMesh.material.map.offset.y -= 0.01;
                    }

                    // 7. Final 3 seconds White Out (37s - 40s)
                    if (portalTime >= 37) {
                        const whiteVal = Math.min(1, (portalTime - 37) / 3);
                        if (!tunnel.whiteOverlay) {
                            tunnel.whiteOverlay = document.createElement('div');
                            tunnel.whiteOverlay.style.position = 'fixed';
                            tunnel.whiteOverlay.style.top = '0';
                            tunnel.whiteOverlay.style.left = '0';
                            tunnel.whiteOverlay.style.width = '100%';
                            tunnel.whiteOverlay.style.height = '100%';
                            tunnel.whiteOverlay.style.background = 'white';
                            tunnel.whiteOverlay.style.zIndex = '3000';
                            tunnel.whiteOverlay.style.opacity = '0';
                            document.body.appendChild(tunnel.whiteOverlay);
                        }
                        tunnel.whiteOverlay.style.opacity = whiteVal;

                        if (portalTime >= 40) {
                            window.location.href = '../islands/index.html';
                            return;
                        }
                    }

                    tunnel.composer.render();
                    requestAnimationFrame(animate);
                };

                animate();
            });
        });
    }

    function handleLoginError(message) {
        window.notify.show(message, 'error');
        errorAudio.currentTime = 0;
        errorAudio.play().catch(err => console.warn('Audio play failed:', err));

        authForm.classList.add('shake-anim');
        setTimeout(() => {
            authForm.classList.remove('shake-anim');
        }, 500);
    }

    // CSS for shake
    if (!document.getElementById('login-animations')) {
        const style = document.createElement('style');
        style.id = 'login-animations';
        style.innerHTML = `
            @keyframes shake {
                0%, 100% { transform: translate(-0%, -0%); }
                25% { transform: translate(-0%, -0%) translateX(-8px); }
                75% { transform: translate(-0%, -0%) translateX(8px); }
            }
            .shake-anim {
                animation: shake 0.2s ease-in-out 0s 2;
            }
        `;
        document.head.appendChild(style);
    }
})();