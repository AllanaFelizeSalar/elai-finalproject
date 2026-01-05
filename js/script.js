// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {

    // ===== Interactive Dots Background =====
    const interactiveDotsCanvas = document.getElementById('interactive-dots-canvas');
    const interactiveDotsContainer = document.getElementById('interactive-dots-container');

    if (interactiveDotsCanvas && interactiveDotsContainer) {
        const ctx = interactiveDotsCanvas.getContext('2d');

        // Configuration
        const DOTS_CONFIG = {
            backgroundColor: '#0a0a0a',
            dotColor: '#666666',
            gridSpacing: 30,
            animationSpeed: 0.005,
            removeWaveLine: true
        };

        // State
        let timeValue = 0;
        let animationFrameId = null;
        let dpr = 1;
        const mousePos = { x: 0, y: 0, isDown: false };
        let ripples = [];
        let dots = [];

        // Get mouse influence on a dot
        const getMouseInfluence = (x, y) => {
            const dx = x - mousePos.x;
            const dy = y - mousePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 150;
            return Math.max(0, 1 - distance / maxDistance);
        };

        // Get ripple influence on a dot
        const getRippleInfluence = (x, y, currentTime) => {
            let totalInfluence = 0;
            ripples.forEach((ripple) => {
                const age = currentTime - ripple.time;
                const maxAge = 3000;
                if (age < maxAge) {
                    const dx = x - ripple.x;
                    const dy = y - ripple.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const rippleRadius = (age / maxAge) * 300;
                    const rippleWidth = 60;
                    if (Math.abs(distance - rippleRadius) < rippleWidth) {
                        const rippleStrength = (1 - age / maxAge) * ripple.intensity;
                        const proximityToRipple = 1 - Math.abs(distance - rippleRadius) / rippleWidth;
                        totalInfluence += rippleStrength * proximityToRipple;
                    }
                }
            });
            return Math.min(totalInfluence, 2);
        };

        // Initialize dots grid
        const initializeDots = () => {
            const canvasWidth = interactiveDotsCanvas.clientWidth;
            const canvasHeight = interactiveDotsCanvas.clientHeight;

            dots = [];

            // Create grid of dots
            for (let x = DOTS_CONFIG.gridSpacing / 2; x < canvasWidth; x += DOTS_CONFIG.gridSpacing) {
                for (let y = DOTS_CONFIG.gridSpacing / 2; y < canvasHeight; y += DOTS_CONFIG.gridSpacing) {
                    dots.push({
                        x,
                        y,
                        originalX: x,
                        originalY: y,
                        phase: Math.random() * Math.PI * 2
                    });
                }
            }
        };

        // Resize canvas for high DPI displays
        const resizeDotsCanvas = () => {
            dpr = window.devicePixelRatio || 1;

            const displayWidth = window.innerWidth;
            const displayHeight = window.innerHeight;

            // Set the actual size in memory (scaled up for high DPI)
            interactiveDotsCanvas.width = displayWidth * dpr;
            interactiveDotsCanvas.height = displayHeight * dpr;

            // Scale the canvas back down using CSS
            interactiveDotsCanvas.style.width = displayWidth + 'px';
            interactiveDotsCanvas.style.height = displayHeight + 'px';

            // Scale the drawing context so everything draws at the correct size
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            initializeDots();
        };

        // Mouse event handlers
        const handleDotsMouseMove = (e) => {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
        };

        const handleDotsMouseDown = (e) => {
            mousePos.isDown = true;
            const x = e.clientX;
            const y = e.clientY;

            ripples.push({
                x,
                y,
                time: Date.now(),
                intensity: 2
            });

            // Cleanup old ripples
            const now = Date.now();
            ripples = ripples.filter((ripple) => now - ripple.time < 3000);
        };

        const handleDotsMouseUp = () => {
            mousePos.isDown = false;
        };

        // Parse hex color to RGB
        const parseHexColor = (hex) => {
            const red = parseInt(hex.slice(1, 3), 16);
            const green = parseInt(hex.slice(3, 5), 16);
            const blue = parseInt(hex.slice(5, 7), 16);
            return { red, green, blue };
        };

        // Animation loop
        const animateDots = () => {
            timeValue += DOTS_CONFIG.animationSpeed;
            const currentTime = Date.now();

            // Use CSS pixel dimensions for calculations
            const canvasWidth = interactiveDotsCanvas.clientWidth;
            const canvasHeight = interactiveDotsCanvas.clientHeight;

            // Clear canvas
            ctx.fillStyle = DOTS_CONFIG.backgroundColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Gradient colors (purple to pink)
            const color1 = { r: 109, g: 40, b: 217 };  // #6d28d9 (purple)
            const color2 = { r: 219, g: 39, b: 119 };  // #db2777 (pink)

            // Update and draw dots
            dots.forEach((dot) => {
                const mouseInfluence = getMouseInfluence(dot.originalX, dot.originalY);
                const rippleInfluence = getRippleInfluence(dot.originalX, dot.originalY, currentTime);
                const totalInfluence = mouseInfluence + rippleInfluence;

                // Keep dots at original positions - no movement
                dot.x = dot.originalX;
                dot.y = dot.originalY;

                // Calculate dot properties based on influences - only scaling
                const baseDotSize = 2;
                const dotSize = baseDotSize + totalInfluence * 6 + Math.sin(timeValue + dot.phase) * 0.5;
                const opacity = Math.max(
                    0.3,
                    0.6 + totalInfluence * 0.4 + Math.abs(Math.sin(timeValue * 0.5 + dot.phase)) * 0.1
                );

                // Calculate gradient color based on horizontal position
                const t = dot.originalX / canvasWidth;
                const r = Math.round(color1.r + (color2.r - color1.r) * t);
                const g = Math.round(color1.g + (color2.g - color1.g) * t);
                const b = Math.round(color1.b + (color2.b - color1.b) * t);

                // Draw dot
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                ctx.fill();
            });

            // Draw ripple effects
            if (!DOTS_CONFIG.removeWaveLine) {
                ripples.forEach((ripple) => {
                    const age = currentTime - ripple.time;
                    const maxAge = 3000;
                    if (age < maxAge) {
                        const progress = age / maxAge;
                        const radius = progress * 300;
                        const alpha = (1 - progress) * 0.3 * ripple.intensity;

                        // Outer ripple
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
                        ctx.lineWidth = 2;
                        ctx.arc(ripple.x, ripple.y, radius, 0, 2 * Math.PI);
                        ctx.stroke();

                        // Inner ripple
                        const innerRadius = progress * 150;
                        const innerAlpha = (1 - progress) * 0.2 * ripple.intensity;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(120, 120, 120, ${innerAlpha})`;
                        ctx.lineWidth = 1;
                        ctx.arc(ripple.x, ripple.y, innerRadius, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                });
            }

            // Cleanup old ripples
            ripples = ripples.filter((ripple) => currentTime - ripple.time < 3000);

            animationFrameId = requestAnimationFrame(animateDots);
        };

        // Event listeners
        window.addEventListener('resize', resizeDotsCanvas);
        window.addEventListener('mousemove', handleDotsMouseMove);
        window.addEventListener('mousedown', handleDotsMouseDown);
        window.addEventListener('mouseup', handleDotsMouseUp);

        // Initialize and start animation
        resizeDotsCanvas();
        animateDots();
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.85)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Mobile Menu Toggle (Basic implementation)
    // Note: For a production app, you'd want a more robust slide-out menu.
    const hamburger = document.querySelector('.hamburger');
    // Currently just a placeholder for interaction as mobile menu structure wasn't fully fleshed out in HTML for brevity,
    // but this ensures the click works.
    hamburger.addEventListener('click', () => {
        alert("Mobile menu functionality would go here!");
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;

        revealElements.forEach((reveal) => {
            const elementTop = reveal.getBoundingClientRect().top;

            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    // Trigger once on load
    revealOnScroll();

    // ===== Delicate ASCII Dots Animation =====
    const asciiCanvas = document.getElementById('ascii-canvas');
    const asciiContainer = document.getElementById('ascii-container');

    if (asciiCanvas && asciiContainer) {
        const ctx = asciiCanvas.getContext('2d');

        // Configuration
        const CONFIG = {
            backgroundColor: '#0a0a0a',
            textColor: '109, 40, 217', // Purple to match theme
            gridSize: 50,
            removeWaveLine: true,
            animationSpeed: 0.75
        };

        // Braille characters for wave visualization
        const CHARS = '⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿⠁⠂⠄⠈⠐⠠⡀⢀⠃⠅⠘⠨⠊⠋⠌⠍⠎⠏⠑⠒⠓⠔⠕⠖⠗⠙⠚⠛⠜⠝⠞⠟⠡⠢⠣⠤⠥⠦⠧⠩⠪⠫⠬⠭⠮⠯⠱⠲⠳⠴⠵⠶⠷⠹⠺⠻⠼⠽⠾⠿⡁⡂⡃⡄⡅⡆⡇⡉⡊⡋⡌⡍⡎⡏⡑⡒⡓⡔⡕⡖⡗⡙⡚⡛⡜⡝⡞⡟⡡⡢⡣⡤⡥⡦⡧⡩⡪⡫⡬⡭⡮⡯⡱⡲⡳⡴⡵⡶⡷⡹⡺⡻⡼⡽⡾⡿⢁⢂⢃⢄⢅⢆⢇⢉⢊⢋⢌⢍⢎⢏⢑⢒⢓⢔⢕⢖⢗⢙⢚⢛⢜⢝⢞⢟⢡⢢⢣⢤⢥⢦⢧⢩⢪⢫⢬⢭⢮⢯⢱⢲⢳⢴⢵⢶⢷⢹⢺⢻⢼⢽⢾⢿⣀⣁⣂⣃⣄⣅⣆⣇⣉⣊⣋⣌⣍⣎⣏⣑⣒⣓⣔⣕⣖⣗⣙⣚⣛⣜⣝⣞⣟⣡⣢⣣⣤⣥⣦⣧⣩⣪⣫⣬⣭⣮⣯⣱⣲⣳⣴⣵⣶⣷⣹⣺⣻⣼⣽⣾⣿';

        // State
        const mousePos = { x: 0, y: 0, isDown: false };
        const dimensions = { width: 0, height: 0 };
        let timeValue = 0;
        let waves = [];
        let clickWaves = [];
        let animationId = null;

        // Initialize background waves
        const initWaves = () => {
            waves = [];
            for (let i = 0; i < 4; i++) {
                waves.push({
                    x: CONFIG.gridSize * (0.25 + Math.random() * 0.5),
                    y: CONFIG.gridSize * (0.25 + Math.random() * 0.5),
                    frequency: 0.2 + Math.random() * 0.3,
                    amplitude: 0.5 + Math.random() * 0.5,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5
                });
            }
        };

        // Resize canvas
        const resizeAsciiCanvas = () => {
            const rect = asciiContainer.getBoundingClientRect();
            dimensions.width = rect.width;
            dimensions.height = rect.height;

            const dpr = window.devicePixelRatio || 1;
            asciiCanvas.width = dimensions.width * dpr;
            asciiCanvas.height = dimensions.height * dpr;
            asciiCanvas.style.width = dimensions.width + 'px';
            asciiCanvas.style.height = dimensions.height + 'px';
            ctx.scale(dpr, dpr);
        };

        // Get click wave influence
        const getClickWaveInfluence = (x, y, currentTime) => {
            let totalInfluence = 0;
            clickWaves.forEach(wave => {
                const age = currentTime - wave.time;
                const maxAge = 4000;
                if (age < maxAge) {
                    const dx = x - wave.x;
                    const dy = y - wave.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const waveRadius = (age / maxAge) * CONFIG.gridSize * 0.8;
                    const waveWidth = CONFIG.gridSize * 0.15;

                    if (Math.abs(distance - waveRadius) < waveWidth) {
                        const waveStrength = (1 - age / maxAge) * wave.intensity;
                        const proximityToWave = 1 - Math.abs(distance - waveRadius) / waveWidth;
                        totalInfluence += waveStrength * proximityToWave * Math.sin((distance - waveRadius) * 0.5);
                    }
                }
            });
            return totalInfluence;
        };

        // Animation loop
        const animateAscii = () => {
            const currentTime = Date.now();
            timeValue += CONFIG.animationSpeed * 0.016;

            if (dimensions.width === 0 || dimensions.height === 0) {
                animationId = requestAnimationFrame(animateAscii);
                return;
            }

            // Clear canvas
            ctx.fillStyle = CONFIG.backgroundColor;
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            const cellWidth = dimensions.width / CONFIG.gridSize;
            const cellHeight = dimensions.height / CONFIG.gridSize;

            // Mouse grid coordinates
            const mouseGridX = mousePos.x / cellWidth;
            const mouseGridY = mousePos.y / cellHeight;

            // Mouse wave
            const mouseWave = {
                x: mouseGridX,
                y: mouseGridY,
                frequency: 0.3,
                amplitude: 1,
                phase: timeValue * 2,
                speed: 1
            };

            const allWaves = waves.concat([mouseWave]);

            // Calculate optimal font size
            const fontSize = Math.min(cellWidth, cellHeight) * 0.8;
            ctx.font = `${fontSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw characters
            for (let y = 0; y < CONFIG.gridSize; y++) {
                for (let x = 0; x < CONFIG.gridSize; x++) {
                    let totalWave = 0;

                    // Sum wave contributions
                    allWaves.forEach(wave => {
                        const dx = x - wave.x;
                        const dy = y - wave.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const falloff = 1 / (1 + dist * 0.1);
                        const value = Math.sin(dist * wave.frequency - timeValue * wave.speed + wave.phase) * wave.amplitude * falloff;
                        totalWave += value;
                    });

                    // Add click wave influence
                    totalWave += getClickWaveInfluence(x, y, currentTime);

                    // Enhanced mouse interaction
                    const mouseDistance = Math.sqrt((x - mouseGridX) ** 2 + (y - mouseGridY) ** 2);
                    if (mouseDistance < CONFIG.gridSize * 0.3) {
                        const mouseEffect = (1 - mouseDistance / (CONFIG.gridSize * 0.3)) * 0.8;
                        totalWave += mouseEffect * Math.sin(timeValue * 3);
                    }

                    // Map to characters
                    if (Math.abs(totalWave) > 0.2) {
                        const normalizedWave = (totalWave + 2) / 4;
                        const charIndex = Math.min(CHARS.length - 1, Math.max(0, Math.floor(normalizedWave * (CHARS.length - 1))));
                        const opacity = Math.min(0.9, Math.max(0.4, 0.4 + normalizedWave * 0.5));

                        ctx.fillStyle = `rgba(${CONFIG.textColor}, ${opacity})`;
                        ctx.fillText(CHARS[charIndex], x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
                    }
                }
            }

            // Draw click wave ripples
            if (!CONFIG.removeWaveLine) {
                clickWaves.forEach(wave => {
                    const age = currentTime - wave.time;
                    const maxAge = 4000;
                    if (age < maxAge) {
                        const progress = age / maxAge;
                        const radius = progress * Math.min(dimensions.width, dimensions.height) * 0.5;
                        const alpha = (1 - progress) * 0.3 * wave.intensity;

                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${CONFIG.textColor}, ${alpha})`;
                        ctx.lineWidth = 1;
                        ctx.arc(wave.x * cellWidth, wave.y * cellHeight, radius, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                });
            }

            // Cleanup old click waves
            clickWaves = clickWaves.filter(wave => currentTime - wave.time < 4000);

            animationId = requestAnimationFrame(animateAscii);
        };

        // Event handlers
        asciiCanvas.addEventListener('mousemove', (e) => {
            const rect = asciiCanvas.getBoundingClientRect();
            mousePos.x = e.clientX - rect.left;
            mousePos.y = e.clientY - rect.top;
        });

        asciiCanvas.addEventListener('mousedown', (e) => {
            mousePos.isDown = true;
            const rect = asciiCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const cellWidth = dimensions.width / CONFIG.gridSize;
            const cellHeight = dimensions.height / CONFIG.gridSize;

            clickWaves.push({
                x: x / cellWidth,
                y: y / cellHeight,
                time: Date.now(),
                intensity: 2
            });
        });

        asciiCanvas.addEventListener('mouseup', () => {
            mousePos.isDown = false;
        });

        window.addEventListener('resize', () => {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            resizeAsciiCanvas();
        });

        // Initialize
        initWaves();
        resizeAsciiCanvas();
        animateAscii();
    }

    // ===== Follow Cursor Effect =====
    const initFollowCursor = () => {
        const cursorColor = '#323232a6';
        let canvas;
        let context;
        let animationFrame;
        let width = window.innerWidth;
        let height = window.innerHeight;
        let cursor = { x: width / 2, y: height / 2 };
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Dot class for the cursor follower
        class Dot {
            constructor(x, y, dotWidth, lag) {
                this.position = { x, y };
                this.width = dotWidth;
                this.lag = lag;
            }

            moveTowards(x, y, ctx) {
                this.position.x += (x - this.position.x) / this.lag;
                this.position.y += (y - this.position.y) / this.lag;
                ctx.fillStyle = cursorColor;
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.width, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
            }
        }

        const dot = new Dot(width / 2, height / 2, 10, 10);

        const onMouseMove = (e) => {
            cursor.x = e.clientX;
            cursor.y = e.clientY;
        };

        const onWindowResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            if (canvas) {
                canvas.width = width;
                canvas.height = height;
            }
        };

        const updateDot = () => {
            if (context) {
                context.clearRect(0, 0, width, height);
                dot.moveTowards(cursor.x, cursor.y, context);
            }
        };

        const loop = () => {
            updateDot();
            animationFrame = requestAnimationFrame(loop);
        };

        const init = () => {
            if (prefersReducedMotion.matches) {
                console.log('Reduced motion enabled, cursor effect skipped.');
                return;
            }

            canvas = document.createElement('canvas');
            context = canvas.getContext('2d');
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '9999';
            canvas.width = width;
            canvas.height = height;
            document.body.appendChild(canvas);

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('resize', onWindowResize);
            loop();
        };

        const destroy = () => {
            if (canvas) canvas.remove();
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', onWindowResize);
        };

        prefersReducedMotion.onchange = () => {
            if (prefersReducedMotion.matches) {
                destroy();
            } else {
                init();
            }
        };

        init();
    };

    initFollowCursor();
});
