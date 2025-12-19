// ==========================================
// SHADOW STRIKE - FPS Game
// ==========================================

// ==========================================
// Game Configuration
// ==========================================
const CONFIG = {
    PLAYER: {
        MOVE_SPEED: 8,
        SPRINT_SPEED: 14,
        JUMP_FORCE: 12,
        GRAVITY: 30,
        HEIGHT: 1.8,
        COLLISION_RADIUS: 0.5,
        MAX_HEALTH: 100,
        MAX_ARMOR: 100
    },
    WEAPONS: {
        PISTOL: {
            name: 'ピストル',
            damage: 25,
            fireRate: 400,
            magSize: 12,
            reserveAmmo: 48,
            reloadTime: 1500,
            spread: 0.02,
            range: 100,
            automatic: false
        },
        ASSAULT_RIFLE: {
            name: 'アサルトライフル',
            damage: 20,
            fireRate: 100,
            magSize: 30,
            reserveAmmo: 90,
            reloadTime: 2000,
            spread: 0.04,
            range: 150,
            automatic: true
        },
        SHOTGUN: {
            name: 'ショットガン',
            damage: 15,
            fireRate: 800,
            magSize: 8,
            reserveAmmo: 32,
            reloadTime: 2500,
            spread: 0.15,
            range: 30,
            pellets: 8,
            automatic: false
        }
    },
    ENEMY: {
        BASIC: {
            health: 50,
            damage: 10,
            speed: 3,
            attackRange: 2,
            attackRate: 1000,
            points: 100
        },
        FAST: {
            health: 30,
            damage: 8,
            speed: 6,
            attackRange: 2,
            attackRate: 800,
            points: 150
        },
        TANK: {
            health: 150,
            damage: 20,
            speed: 2,
            attackRange: 2.5,
            attackRate: 1500,
            points: 300
        },
        RANGED: {
            health: 40,
            damage: 15,
            speed: 2,
            attackRange: 20,
            attackRate: 2000,
            points: 200
        }
    },
    MAP: {
        SIZE: 100,
        WALL_HEIGHT: 4
    }
};

// ==========================================
// Global Variables
// ==========================================
let scene, camera, renderer;
let player, controls;
let enemies = [];
let bullets = [];
let pickups = [];
let obstacles = [];
let lights = [];

let gameState = 'title'; // title, playing, paused, gameover
let isPaused = false;
let isPointerLocked = false;

let currentWave = 1;
let score = 0;
let totalKills = 0;
let headshots = 0;

let clock = new THREE.Clock();
let audioContext = null;

// Settings
let settings = {
    sensitivity: 1.0,
    bgmVolume: 0.5,
    seVolume: 0.7,
    graphicsQuality: 'medium'
};

// ==========================================
// Player Class
// ==========================================
class Player {
    constructor() {
        this.position = new THREE.Vector3(0, CONFIG.PLAYER.HEIGHT, 0);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

        this.health = CONFIG.PLAYER.MAX_HEALTH;
        this.armor = 0;

        this.isOnGround = true;
        this.isSprinting = false;
        this.isAiming = false;
        this.isReloading = false;

        this.weapons = [
            { ...CONFIG.WEAPONS.PISTOL, currentAmmo: CONFIG.WEAPONS.PISTOL.magSize, reserveAmmo: CONFIG.WEAPONS.PISTOL.reserveAmmo },
            { ...CONFIG.WEAPONS.ASSAULT_RIFLE, currentAmmo: CONFIG.WEAPONS.ASSAULT_RIFLE.magSize, reserveAmmo: CONFIG.WEAPONS.ASSAULT_RIFLE.reserveAmmo },
            { ...CONFIG.WEAPONS.SHOTGUN, currentAmmo: CONFIG.WEAPONS.SHOTGUN.magSize, reserveAmmo: CONFIG.WEAPONS.SHOTGUN.reserveAmmo }
        ];
        this.currentWeaponIndex = 1;

        this.lastShot = 0;
        this.canShoot = true;
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }

    takeDamage(amount) {
        let remainingDamage = amount;

        if (this.armor > 0) {
            const armorDamage = Math.min(this.armor, remainingDamage * 0.5);
            this.armor -= armorDamage;
            remainingDamage -= armorDamage;
        }

        this.health -= remainingDamage;
        this.health = Math.max(0, this.health);

        showDamageIndicator();
        playSound('hurt');

        if (this.health <= 0) {
            gameOver();
        }

        updateHUD();
    }

    heal(amount) {
        this.health = Math.min(CONFIG.PLAYER.MAX_HEALTH, this.health + amount);
        playSound('pickup');
        updateHUD();
    }

    addArmor(amount) {
        this.armor = Math.min(CONFIG.PLAYER.MAX_ARMOR, this.armor + amount);
        playSound('pickup');
        updateHUD();
    }

    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length && !this.isReloading) {
            this.currentWeaponIndex = index;
            playSound('weaponSwitch');
            updateHUD();
            updateWeaponSlots();
        }
    }

    shoot() {
        const now = Date.now();
        const weapon = this.currentWeapon;

        if (this.isReloading) return;
        if (now - this.lastShot < weapon.fireRate) return;
        if (weapon.currentAmmo <= 0) {
            playSound('empty');
            return;
        }

        this.lastShot = now;
        weapon.currentAmmo--;

        playSound('shoot');
        showMuzzleFlash();

        const pelletCount = weapon.pellets || 1;

        for (let i = 0; i < pelletCount; i++) {
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyEuler(this.rotation);

            // Add spread
            const spread = this.isAiming ? weapon.spread * 0.5 : weapon.spread;
            direction.x += (Math.random() - 0.5) * spread;
            direction.y += (Math.random() - 0.5) * spread;
            direction.normalize();

            // Create bullet
            const bullet = new Bullet(
                this.position.clone().add(new THREE.Vector3(0, -0.2, 0)),
                direction,
                weapon.damage,
                weapon.range
            );
            bullets.push(bullet);
        }

        updateHUD();

        if (weapon.currentAmmo <= 0 && weapon.reserveAmmo > 0) {
            this.reload();
        }
    }

    reload() {
        const weapon = this.currentWeapon;

        if (this.isReloading) return;
        if (weapon.currentAmmo >= weapon.magSize) return;
        if (weapon.reserveAmmo <= 0) return;

        this.isReloading = true;
        playSound('reload');
        document.body.classList.add('reloading');

        setTimeout(() => {
            const needed = weapon.magSize - weapon.currentAmmo;
            const available = Math.min(needed, weapon.reserveAmmo);
            weapon.currentAmmo += available;
            weapon.reserveAmmo -= available;
            this.isReloading = false;
            document.body.classList.remove('reloading');
            updateHUD();
        }, weapon.reloadTime);
    }

    addAmmo(amount) {
        this.weapons.forEach(weapon => {
            weapon.reserveAmmo += amount;
        });
        playSound('pickup');
        updateHUD();
    }
}

// ==========================================
// Enemy Class
// ==========================================
class Enemy {
    constructor(type, position) {
        this.type = type;
        this.config = CONFIG.ENEMY[type];
        this.health = this.config.health;
        this.position = position.clone();
        this.lastAttack = 0;
        this.isAlive = true;

        // Create mesh
        const geometry = this.createGeometry();
        const material = new THREE.MeshPhongMaterial({
            color: this.getColor()
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Create health bar
        this.createHealthBar();

        scene.add(this.mesh);
    }

    createGeometry() {
        switch (this.type) {
            case 'FAST':
                return new THREE.ConeGeometry(0.4, 1.5, 8);
            case 'TANK':
                return new THREE.BoxGeometry(1.2, 2, 1.2);
            case 'RANGED':
                return new THREE.OctahedronGeometry(0.6);
            default:
                return new THREE.CapsuleGeometry(0.4, 1, 8, 16);
        }
    }

    getColor() {
        switch (this.type) {
            case 'FAST': return 0x00ff00;
            case 'TANK': return 0xff0000;
            case 'RANGED': return 0xff00ff;
            default: return 0xff8800;
        }
    }

    createHealthBar() {
        const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);

        const fgGeometry = new THREE.PlaneGeometry(1, 0.1);
        const fgMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBarFg = new THREE.Mesh(fgGeometry, fgMaterial);

        this.healthBarBg.position.y = 2;
        this.healthBarFg.position.y = 2;
        this.healthBarFg.position.z = 0.01;

        this.mesh.add(this.healthBarBg);
        this.mesh.add(this.healthBarFg);
    }

    update(deltaTime) {
        if (!this.isAlive) return;

        const direction = new THREE.Vector3();
        direction.subVectors(player.position, this.position);
        const distance = direction.length();
        direction.normalize();

        // Move towards player
        if (distance > this.config.attackRange) {
            this.position.x += direction.x * this.config.speed * deltaTime;
            this.position.z += direction.z * this.config.speed * deltaTime;
        }

        // Keep on ground
        this.position.y = this.getHeight();

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.lookAt(player.position.x, this.position.y, player.position.z);

        // Update health bar orientation
        this.healthBarBg.lookAt(camera.position);
        this.healthBarFg.lookAt(camera.position);

        // Attack player
        if (distance <= this.config.attackRange) {
            this.attack();
        }
    }

    getHeight() {
        switch (this.type) {
            case 'FAST': return 0.75;
            case 'TANK': return 1;
            case 'RANGED': return 1;
            default: return 0.9;
        }
    }

    attack() {
        const now = Date.now();
        if (now - this.lastAttack < this.config.attackRate) return;

        this.lastAttack = now;

        if (this.type === 'RANGED') {
            // Ranged attack - create projectile
            const direction = new THREE.Vector3();
            direction.subVectors(player.position, this.position);
            direction.normalize();

            const projectile = new EnemyProjectile(
                this.position.clone(),
                direction,
                this.config.damage
            );
            bullets.push(projectile);
            playSound('enemyShoot');
        } else {
            // Melee attack
            player.takeDamage(this.config.damage);
        }
    }

    takeDamage(amount, isHeadshot = false) {
        if (!this.isAlive) return;

        const finalDamage = isHeadshot ? amount * 2 : amount;
        this.health -= finalDamage;

        // Update health bar
        const healthPercent = Math.max(0, this.health / this.config.health);
        this.healthBarFg.scale.x = healthPercent;
        this.healthBarFg.position.x = -(1 - healthPercent) * 0.5;

        if (isHeadshot) {
            headshots++;
        }

        showHitMarker();

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        scene.remove(this.mesh);

        score += this.config.points;
        totalKills++;

        addKillFeed(this.type);
        playSound('kill');

        // Chance to drop pickup
        if (Math.random() < 0.3) {
            spawnPickup(this.position.clone());
        }

        updateHUD();
    }
}

// ==========================================
// Bullet Class
// ==========================================
class Bullet {
    constructor(position, direction, damage, range) {
        this.position = position;
        this.direction = direction;
        this.damage = damage;
        this.range = range;
        this.distanceTraveled = 0;
        this.speed = 100;
        this.isActive = true;
        this.isPlayerBullet = true;

        const geometry = new THREE.SphereGeometry(0.05);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        scene.add(this.mesh);
    }

    update(deltaTime) {
        if (!this.isActive) return;

        const moveDistance = this.speed * deltaTime;
        this.position.add(this.direction.clone().multiplyScalar(moveDistance));
        this.mesh.position.copy(this.position);
        this.distanceTraveled += moveDistance;

        // Check range
        if (this.distanceTraveled >= this.range) {
            this.destroy();
            return;
        }

        // Check enemy collision
        if (this.isPlayerBullet) {
            for (const enemy of enemies) {
                if (!enemy.isAlive) continue;

                const distance = this.position.distanceTo(enemy.position);
                if (distance < 0.8) {
                    // Check for headshot (upper third of enemy)
                    const isHeadshot = this.position.y > enemy.position.y + 0.5;
                    enemy.takeDamage(this.damage, isHeadshot);
                    this.destroy();
                    return;
                }
            }
        }

        // Check obstacle collision
        for (const obstacle of obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            if (box.containsPoint(this.position)) {
                this.destroy();
                return;
            }
        }
    }

    destroy() {
        this.isActive = false;
        scene.remove(this.mesh);
    }
}

// ==========================================
// Enemy Projectile Class
// ==========================================
class EnemyProjectile extends Bullet {
    constructor(position, direction, damage) {
        super(position, direction, damage, 50);
        this.isPlayerBullet = false;
        this.speed = 30;
        this.mesh.material.color.setHex(0xff0000);
    }

    update(deltaTime) {
        if (!this.isActive) return;

        const moveDistance = this.speed * deltaTime;
        this.position.add(this.direction.clone().multiplyScalar(moveDistance));
        this.mesh.position.copy(this.position);
        this.distanceTraveled += moveDistance;

        if (this.distanceTraveled >= this.range) {
            this.destroy();
            return;
        }

        // Check player collision
        const distance = this.position.distanceTo(player.position);
        if (distance < CONFIG.PLAYER.COLLISION_RADIUS) {
            player.takeDamage(this.damage);
            this.destroy();
            return;
        }

        // Check obstacle collision
        for (const obstacle of obstacles) {
            const box = new THREE.Box3().setFromObject(obstacle);
            if (box.containsPoint(this.position)) {
                this.destroy();
                return;
            }
        }
    }
}

// ==========================================
// Pickup Class
// ==========================================
class Pickup {
    constructor(position, type) {
        this.position = position;
        this.type = type;
        this.isActive = true;

        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({
            color: this.getColor(),
            emissive: this.getColor(),
            emissiveIntensity: 0.3
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.position.y = 0.5;
        scene.add(this.mesh);
    }

    getColor() {
        switch (this.type) {
            case 'health': return 0x00ff00;
            case 'armor': return 0x0088ff;
            case 'ammo': return 0xffff00;
            default: return 0xffffff;
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Rotate
        this.mesh.rotation.y += deltaTime * 2;
        this.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.1;

        // Check player collision
        const distance = this.position.distanceTo(player.position);
        if (distance < 1.5) {
            this.collect();
        }
    }

    collect() {
        this.isActive = false;
        scene.remove(this.mesh);

        switch (this.type) {
            case 'health':
                player.heal(25);
                break;
            case 'armor':
                player.addArmor(25);
                break;
            case 'ammo':
                player.addAmmo(30);
                break;
        }
    }
}

// ==========================================
// Input Handling
// ==========================================
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
    r: false,
    e: false
};

let mouseDown = false;
let rightMouseDown = false;

function setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
        if (gameState !== 'playing') return;

        switch (e.code) {
            case 'KeyW': keys.w = true; break;
            case 'KeyA': keys.a = true; break;
            case 'KeyS': keys.s = true; break;
            case 'KeyD': keys.d = true; break;
            case 'Space':
                keys.space = true;
                e.preventDefault();
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                keys.shift = true;
                player.isSprinting = true;
                document.body.classList.add('sprinting');
                break;
            case 'KeyR':
                player.reload();
                break;
            case 'Digit1': player.switchWeapon(0); break;
            case 'Digit2': player.switchWeapon(1); break;
            case 'Digit3': player.switchWeapon(2); break;
            case 'Escape':
                togglePause();
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': keys.w = false; break;
            case 'KeyA': keys.a = false; break;
            case 'KeyS': keys.s = false; break;
            case 'KeyD': keys.d = false; break;
            case 'Space': keys.space = false; break;
            case 'ShiftLeft':
            case 'ShiftRight':
                keys.shift = false;
                player.isSprinting = false;
                document.body.classList.remove('sprinting');
                break;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isPointerLocked || gameState !== 'playing') return;

        const sensitivity = settings.sensitivity * 0.002;
        player.rotation.y -= e.movementX * sensitivity;
        player.rotation.x -= e.movementY * sensitivity;
        player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));
    });

    document.addEventListener('mousedown', (e) => {
        if (gameState !== 'playing') return;

        if (e.button === 0) {
            mouseDown = true;
            player.shoot();
        } else if (e.button === 2) {
            rightMouseDown = true;
            player.isAiming = true;
            document.body.classList.add('aiming');
        }
    });

    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            mouseDown = false;
        } else if (e.button === 2) {
            rightMouseDown = false;
            player.isAiming = false;
            document.body.classList.remove('aiming');
        }
    });

    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === document.body;
        if (!isPointerLocked && gameState === 'playing') {
            togglePause();
        }
    });
}

// ==========================================
// Game Initialization
// ==========================================
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 80);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Create renderer
    const canvas = document.getElementById('game-canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create player
    player = new Player();

    // Setup input
    setupInputHandlers();

    // Setup UI
    setupUI();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function setupUI() {
    // Title screen buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('controls-btn').addEventListener('click', () => showScreen('controls-screen'));
    document.getElementById('settings-btn').addEventListener('click', () => showScreen('settings-screen'));
    document.getElementById('controls-back-btn').addEventListener('click', () => showScreen('title-screen'));
    document.getElementById('settings-back-btn').addEventListener('click', () => showScreen('title-screen'));

    // Pause menu buttons
    document.getElementById('resume-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('quit-btn').addEventListener('click', quitToTitle);

    // Game over buttons
    document.getElementById('retry-btn').addEventListener('click', restartGame);
    document.getElementById('title-btn').addEventListener('click', quitToTitle);

    // Settings
    document.getElementById('sensitivity').addEventListener('input', (e) => {
        settings.sensitivity = parseFloat(e.target.value);
        document.getElementById('sensitivity-value').textContent = settings.sensitivity.toFixed(1);
    });

    document.getElementById('bgm-volume').addEventListener('input', (e) => {
        settings.bgmVolume = parseFloat(e.target.value);
        document.getElementById('bgm-volume-value').textContent = Math.round(settings.bgmVolume * 100) + '%';
    });

    document.getElementById('se-volume').addEventListener('input', (e) => {
        settings.seVolume = parseFloat(e.target.value);
        document.getElementById('se-volume-value').textContent = Math.round(settings.seVolume * 100) + '%';
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

// ==========================================
// Game State Management
// ==========================================
function startGame() {
    showScreen('loading-screen');

    // Simulate loading
    let progress = 0;
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    const loadingMessages = [
        'マップを生成中...',
        '武器をロード中...',
        '敵を配置中...',
        'ライティングを設定中...',
        '準備完了！'
    ];

    const loadInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadInterval);

            setTimeout(() => {
                initGame();
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('game-container').classList.remove('hidden');
                document.body.requestPointerLock();
                gameState = 'playing';
            }, 500);
        }

        loadingBar.style.width = progress + '%';
        loadingText.textContent = loadingMessages[Math.floor(progress / 25)];
    }, 100);
}

function initGame() {
    // Reset game state
    score = 0;
    totalKills = 0;
    headshots = 0;
    currentWave = 1;

    // Reset player
    player = new Player();
    player.position.set(0, CONFIG.PLAYER.HEIGHT, 0);

    // Clear entities
    enemies.forEach(e => scene.remove(e.mesh));
    bullets.forEach(b => scene.remove(b.mesh));
    pickups.forEach(p => scene.remove(p.mesh));
    obstacles.forEach(o => scene.remove(o));

    enemies = [];
    bullets = [];
    pickups = [];
    obstacles = [];

    // Create map
    createMap();

    // Start first wave
    startWave();

    // Update HUD
    updateHUD();
    updateWeaponSlots();

    // Start game loop
    clock.start();
    animate();
}

function createMap() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(CONFIG.MAP.SIZE, CONFIG.MAP.SIZE);
    const floorMaterial = new THREE.MeshPhongMaterial({
        color: 0x333344,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add grid texture to floor
    const gridHelper = new THREE.GridHelper(CONFIG.MAP.SIZE, 50, 0x444455, 0x444455);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Walls
    createWalls();

    // Obstacles
    createObstacles();

    // Lighting
    createLighting();
}

function createWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x555566 });
    const halfSize = CONFIG.MAP.SIZE / 2;

    const walls = [
        { pos: [0, CONFIG.MAP.WALL_HEIGHT / 2, -halfSize], size: [CONFIG.MAP.SIZE, CONFIG.MAP.WALL_HEIGHT, 1] },
        { pos: [0, CONFIG.MAP.WALL_HEIGHT / 2, halfSize], size: [CONFIG.MAP.SIZE, CONFIG.MAP.WALL_HEIGHT, 1] },
        { pos: [-halfSize, CONFIG.MAP.WALL_HEIGHT / 2, 0], size: [1, CONFIG.MAP.WALL_HEIGHT, CONFIG.MAP.SIZE] },
        { pos: [halfSize, CONFIG.MAP.WALL_HEIGHT / 2, 0], size: [1, CONFIG.MAP.WALL_HEIGHT, CONFIG.MAP.SIZE] }
    ];

    walls.forEach(wall => {
        const geometry = new THREE.BoxGeometry(...wall.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    });
}

function createObstacles() {
    const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0x666677 });

    // Create random obstacles
    const obstaclePositions = [
        { x: -15, z: -15, w: 4, h: 3, d: 4 },
        { x: 15, z: -15, w: 3, h: 2, d: 6 },
        { x: -15, z: 15, w: 5, h: 2.5, d: 3 },
        { x: 15, z: 15, w: 4, h: 3.5, d: 4 },
        { x: 0, z: -25, w: 8, h: 2, d: 2 },
        { x: 0, z: 25, w: 6, h: 2.5, d: 3 },
        { x: -25, z: 0, w: 3, h: 3, d: 8 },
        { x: 25, z: 0, w: 2, h: 2, d: 6 },
        { x: -8, z: -8, w: 2, h: 1.5, d: 2 },
        { x: 8, z: -8, w: 2, h: 1.5, d: 2 },
        { x: -8, z: 8, w: 2, h: 1.5, d: 2 },
        { x: 8, z: 8, w: 2, h: 1.5, d: 2 },
        { x: 0, z: 0, w: 3, h: 1, d: 3 }
    ];

    obstaclePositions.forEach(obs => {
        const geometry = new THREE.BoxGeometry(obs.w, obs.h, obs.d);
        const mesh = new THREE.Mesh(geometry, obstacleMaterial);
        mesh.position.set(obs.x, obs.h / 2, obs.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    });

    // Add some pillars
    const pillarMaterial = new THREE.MeshPhongMaterial({ color: 0x778899 });
    const pillarPositions = [
        { x: -30, z: -30 },
        { x: 30, z: -30 },
        { x: -30, z: 30 },
        { x: 30, z: 30 },
        { x: 0, z: -35 },
        { x: 0, z: 35 },
        { x: -35, z: 0 },
        { x: 35, z: 0 }
    ];

    pillarPositions.forEach(pos => {
        const geometry = new THREE.CylinderGeometry(1, 1, 5, 8);
        const mesh = new THREE.Mesh(geometry, pillarMaterial);
        mesh.position.set(pos.x, 2.5, pos.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        obstacles.push(mesh);
    });
}

function createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);

    // Point lights for atmosphere
    const pointLightColors = [0xff6b6b, 0x4a9eff, 0x00ff00, 0xffff00];
    const pointLightPositions = [
        { x: -30, y: 3, z: -30 },
        { x: 30, y: 3, z: -30 },
        { x: -30, y: 3, z: 30 },
        { x: 30, y: 3, z: 30 }
    ];

    pointLightPositions.forEach((pos, i) => {
        const light = new THREE.PointLight(pointLightColors[i], 0.5, 30);
        light.position.set(pos.x, pos.y, pos.z);
        scene.add(light);
        lights.push(light);
    });
}

// ==========================================
// Wave System
// ==========================================
function startWave() {
    showWaveAnnouncement();

    const enemyCount = 3 + currentWave * 2;
    const types = getWaveEnemyTypes();

    for (let i = 0; i < enemyCount; i++) {
        setTimeout(() => {
            if (gameState !== 'playing') return;
            spawnEnemy(types[Math.floor(Math.random() * types.length)]);
        }, i * 500);
    }

    updateHUD();
}

function getWaveEnemyTypes() {
    if (currentWave <= 2) return ['BASIC'];
    if (currentWave <= 4) return ['BASIC', 'FAST'];
    if (currentWave <= 6) return ['BASIC', 'FAST', 'RANGED'];
    return ['BASIC', 'FAST', 'RANGED', 'TANK'];
}

function spawnEnemy(type) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 15;
    const position = new THREE.Vector3(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
    );

    const enemy = new Enemy(type, position);
    enemies.push(enemy);
    updateHUD();
}

function checkWaveComplete() {
    const aliveEnemies = enemies.filter(e => e.isAlive);
    if (aliveEnemies.length === 0) {
        currentWave++;
        setTimeout(startWave, 3000);
    }
}

function showWaveAnnouncement() {
    const announcement = document.createElement('div');
    announcement.className = 'wave-announcement';
    announcement.textContent = `WAVE ${currentWave}`;
    document.body.appendChild(announcement);

    setTimeout(() => {
        announcement.remove();
    }, 2000);
}

// ==========================================
// Pickup System
// ==========================================
function spawnPickup(position) {
    const types = ['health', 'armor', 'ammo'];
    const type = types[Math.floor(Math.random() * types.length)];
    const pickup = new Pickup(position, type);
    pickups.push(pickup);
}

// ==========================================
// Game Loop
// ==========================================
function animate() {
    if (gameState !== 'playing' || isPaused) {
        requestAnimationFrame(animate);
        return;
    }

    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);

    // Update player
    updatePlayer(deltaTime);

    // Update camera
    camera.position.copy(player.position);
    camera.rotation.copy(player.rotation);

    // Update enemies
    enemies.forEach(enemy => enemy.update(deltaTime));

    // Update bullets
    bullets.forEach(bullet => bullet.update(deltaTime));
    bullets = bullets.filter(b => b.isActive);

    // Update pickups
    pickups.forEach(pickup => pickup.update(deltaTime));
    pickups = pickups.filter(p => p.isActive);

    // Check wave completion
    checkWaveComplete();

    // Handle automatic weapons
    if (mouseDown && player.currentWeapon.automatic) {
        player.shoot();
    }

    // Update minimap
    updateMinimap();

    // Render
    renderer.render(scene, camera);
}

function updatePlayer(deltaTime) {
    // Calculate movement direction
    const moveDirection = new THREE.Vector3();

    if (keys.w) moveDirection.z -= 1;
    if (keys.s) moveDirection.z += 1;
    if (keys.a) moveDirection.x -= 1;
    if (keys.d) moveDirection.x += 1;

    moveDirection.normalize();

    // Rotate movement to match camera direction
    moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);

    // Apply movement speed
    const speed = player.isSprinting ? CONFIG.PLAYER.SPRINT_SPEED : CONFIG.PLAYER.MOVE_SPEED;
    player.velocity.x = moveDirection.x * speed;
    player.velocity.z = moveDirection.z * speed;

    // Apply gravity
    if (!player.isOnGround) {
        player.velocity.y -= CONFIG.PLAYER.GRAVITY * deltaTime;
    }

    // Jump
    if (keys.space && player.isOnGround) {
        player.velocity.y = CONFIG.PLAYER.JUMP_FORCE;
        player.isOnGround = false;
        playSound('jump');
    }

    // Apply velocity
    const newPosition = player.position.clone();
    newPosition.x += player.velocity.x * deltaTime;
    newPosition.z += player.velocity.z * deltaTime;
    newPosition.y += player.velocity.y * deltaTime;

    // Collision detection
    if (!checkCollision(newPosition)) {
        player.position.copy(newPosition);
    } else {
        // Try sliding along walls
        const slideX = player.position.clone();
        slideX.x += player.velocity.x * deltaTime;
        if (!checkCollision(slideX)) {
            player.position.x = slideX.x;
        }

        const slideZ = player.position.clone();
        slideZ.z += player.velocity.z * deltaTime;
        if (!checkCollision(slideZ)) {
            player.position.z = slideZ.z;
        }

        player.position.y = newPosition.y;
    }

    // Ground check
    if (player.position.y <= CONFIG.PLAYER.HEIGHT) {
        player.position.y = CONFIG.PLAYER.HEIGHT;
        player.velocity.y = 0;
        player.isOnGround = true;
    }

    // Map boundaries
    const halfSize = CONFIG.MAP.SIZE / 2 - 2;
    player.position.x = Math.max(-halfSize, Math.min(halfSize, player.position.x));
    player.position.z = Math.max(-halfSize, Math.min(halfSize, player.position.z));

    // Low health warning
    if (player.health <= 25) {
        document.body.classList.add('low-health');
    } else {
        document.body.classList.remove('low-health');
    }
}

function checkCollision(position) {
    for (const obstacle of obstacles) {
        const box = new THREE.Box3().setFromObject(obstacle);
        const playerBox = new THREE.Box3(
            new THREE.Vector3(
                position.x - CONFIG.PLAYER.COLLISION_RADIUS,
                position.y - CONFIG.PLAYER.HEIGHT,
                position.z - CONFIG.PLAYER.COLLISION_RADIUS
            ),
            new THREE.Vector3(
                position.x + CONFIG.PLAYER.COLLISION_RADIUS,
                position.y,
                position.z + CONFIG.PLAYER.COLLISION_RADIUS
            )
        );

        if (box.intersectsBox(playerBox)) {
            return true;
        }
    }
    return false;
}

// ==========================================
// HUD Updates
// ==========================================
function updateHUD() {
    const weapon = player.currentWeapon;

    document.getElementById('health-text').textContent = Math.round(player.health);
    document.getElementById('health-bar').style.width = (player.health / CONFIG.PLAYER.MAX_HEALTH * 100) + '%';

    document.getElementById('armor-text').textContent = Math.round(player.armor);
    document.getElementById('armor-bar').style.width = (player.armor / CONFIG.PLAYER.MAX_ARMOR * 100) + '%';

    document.getElementById('current-ammo').textContent = weapon.currentAmmo;
    document.getElementById('reserve-ammo').textContent = weapon.reserveAmmo;
    document.getElementById('weapon-name').textContent = weapon.name;

    document.getElementById('score-value').textContent = score;
    document.getElementById('wave-value').textContent = currentWave;
    document.getElementById('enemies-value').textContent = enemies.filter(e => e.isAlive).length;
}

function updateWeaponSlots() {
    document.querySelectorAll('.weapon-slot').forEach((slot, index) => {
        slot.classList.toggle('active', index === player.currentWeaponIndex);
    });
}

function updateMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / CONFIG.MAP.SIZE;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    ctx.fillStyle = '#444';
    obstacles.forEach(obstacle => {
        const box = new THREE.Box3().setFromObject(obstacle);
        const x = (box.min.x + box.max.x) / 2;
        const z = (box.min.z + box.max.z) / 2;
        const w = box.max.x - box.min.x;
        const d = box.max.z - box.min.z;

        const relX = (x - player.position.x) * scale + centerX;
        const relZ = (z - player.position.z) * scale + centerY;

        ctx.fillRect(relX - w * scale / 2, relZ - d * scale / 2, w * scale, d * scale);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        if (!enemy.isAlive) return;

        const relX = (enemy.position.x - player.position.x) * scale + centerX;
        const relZ = (enemy.position.z - player.position.z) * scale + centerY;

        if (relX >= 0 && relX <= canvas.width && relZ >= 0 && relZ <= canvas.height) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(relX, relZ, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw pickups
    pickups.forEach(pickup => {
        if (!pickup.isActive) return;

        const relX = (pickup.position.x - player.position.x) * scale + centerX;
        const relZ = (pickup.position.z - player.position.z) * scale + centerY;

        if (relX >= 0 && relX <= canvas.width && relZ >= 0 && relZ <= canvas.height) {
            ctx.fillStyle = pickup.getColor();
            ctx.fillRect(relX - 2, relZ - 2, 4, 4);
        }
    });

    // Draw player direction
    const indicator = document.getElementById('player-indicator');
    indicator.style.transform = `translate(-50%, -50%) rotate(${-player.rotation.y * 180 / Math.PI}deg)`;
}

// ==========================================
// Visual Effects
// ==========================================
function showDamageIndicator() {
    const indicator = document.getElementById('damage-indicator');
    indicator.classList.add('active');
    setTimeout(() => indicator.classList.remove('active'), 200);
}

function showHitMarker() {
    const hitMarker = document.getElementById('hit-marker');
    hitMarker.classList.remove('hidden');
    hitMarker.classList.add('show');
    setTimeout(() => {
        hitMarker.classList.remove('show');
        hitMarker.classList.add('hidden');
    }, 200);
}

function showMuzzleFlash() {
    const flash = document.createElement('div');
    flash.className = 'muzzle-flash active';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 50);
}

function addKillFeed(enemyType) {
    const feed = document.getElementById('kill-feed');
    const entry = document.createElement('div');
    entry.className = 'kill-entry';
    entry.textContent = `${enemyType} を撃破！`;
    feed.appendChild(entry);

    setTimeout(() => entry.remove(), 3000);

    // Limit feed entries
    while (feed.children.length > 5) {
        feed.removeChild(feed.firstChild);
    }
}

// ==========================================
// Sound System
// ==========================================
function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
    if (!audioContext) initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.value = settings.seVolume * 0.1;

    switch (type) {
        case 'shoot':
            oscillator.frequency.value = 150;
            oscillator.type = 'sawtooth';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'empty':
            oscillator.frequency.value = 200;
            oscillator.type = 'sine';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'reload':
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'hurt':
            oscillator.frequency.value = 100;
            oscillator.type = 'sawtooth';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'kill':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'pickup':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'weaponSwitch':
            oscillator.frequency.value = 300;
            oscillator.type = 'triangle';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'jump':
            oscillator.frequency.value = 250;
            oscillator.type = 'sine';
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'enemyShoot':
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.08);
            break;
    }
}

// ==========================================
// Pause & Game Over
// ==========================================
function togglePause() {
    if (gameState !== 'playing' && gameState !== 'paused') return;

    isPaused = !isPaused;
    gameState = isPaused ? 'paused' : 'playing';

    document.getElementById('pause-menu').classList.toggle('hidden', !isPaused);

    if (!isPaused) {
        document.body.requestPointerLock();
        clock.start();
    } else {
        document.exitPointerLock();
    }
}

function gameOver() {
    gameState = 'gameover';
    document.exitPointerLock();

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-wave').textContent = currentWave;
    document.getElementById('total-kills').textContent = totalKills;
    document.getElementById('headshots').textContent = headshots;

    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
}

function restartGame() {
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');

    isPaused = false;
    initGame();

    document.body.requestPointerLock();
    gameState = 'playing';
}

function quitToTitle() {
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');

    gameState = 'title';
    isPaused = false;
    document.exitPointerLock();
}

// ==========================================
// Window Resize
// ==========================================
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// Start
// ==========================================
init();
