import * as THREE from 'three';

export default class Environment {
    constructor(experience) {
        this.experience = experience;
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.debug = this.experience.debug;

        // Create starry night sky immediately
        this.createStarryNightSky();
        
        // Initialize lights
        this.setLights();

        // Wait for resources for environment map
        this.resources.on('ready', () => {
            console.log("Resources ready in Environment");
            this.setEnvironmentMap();
        });
    }
    
    createStarryNightSky() {
        // Set the scene background to black first
        this.scene.background = new THREE.Color(0x000011); // Very dark blue-black
        
        // Create stars as individual points
        this.createStarField();
        
        console.log('🌟 Starry night sky created!');
    }
    
    createStarField() {
        // Create star geometry
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 10000;
        
        // Create arrays for positions and colors
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        // Generate random star positions in a sphere around the scene
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Generate random positions in a large sphere
            const radius = 1000 + Math.random() * 500; // Between 1000 and 1500 units away
            const theta = Math.random() * Math.PI * 2; // Random angle around Y axis
            const phi = Math.random() * Math.PI; // Random angle from top to bottom
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);     // x
            positions[i3 + 1] = radius * Math.cos(phi);                   // y
            positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta); // z
            
            // Set star colors (mostly white with some colored ones)
            if (Math.random() < 0.95) {
                // 95% white stars with varying brightness
                const brightness = 0.5 + Math.random() * 0.5; // 0.5 to 1.0
                colors[i3] = brightness;     // r
                colors[i3 + 1] = brightness; // g
                colors[i3 + 2] = brightness; // b
            } else {
                // 5% colored stars
                const starColors = [
                    [1, 0.7, 0.7], // Light red
                    [0.7, 0.7, 1], // Light blue
                    [1, 1, 0.7],   // Light yellow
                    [0.7, 1, 0.7], // Light green
                    [1, 0.7, 1]    // Light purple
                ];
                const color = starColors[Math.floor(Math.random() * starColors.length)];
                colors[i3] = color[0];
                colors[i3 + 1] = color[1];
                colors[i3 + 2] = color[2];
            }
        }
        
        // Set the position and color attributes
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Create star material
        const starMaterial = new THREE.PointsMaterial({
            size: 2.0,
            sizeAttenuation: false, // Keep stars same size regardless of distance
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        // Create the star field
        this.starField = new THREE.Points(starGeometry, starMaterial);
        this.starField.name = 'starField';
        
        // Add to scene
        this.scene.add(this.starField);
        
        // Add some bigger, brighter stars
        this.createBrightStars();
    }
    
    createBrightStars() {
        // Create fewer but brighter stars
        const brightStarGeometry = new THREE.BufferGeometry();
        const brightStarCount = 500;
        
        const positions = new Float32Array(brightStarCount * 3);
        const colors = new Float32Array(brightStarCount * 3);
        
        for (let i = 0; i < brightStarCount; i++) {
            const i3 = i * 3;
            
            // Generate positions
            const radius = 800 + Math.random() * 700;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.cos(phi);
            positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Bright white colors
            colors[i3] = 1.0;
            colors[i3 + 1] = 1.0;
            colors[i3 + 2] = 1.0;
        }
        
        brightStarGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        brightStarGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const brightStarMaterial = new THREE.PointsMaterial({
            size: 4.0,
            sizeAttenuation: false,
            vertexColors: true,
            transparent: true,
            opacity: 1.0
        });
        
        this.brightStars = new THREE.Points(brightStarGeometry, brightStarMaterial);
        this.brightStars.name = 'brightStars';
        this.scene.add(this.brightStars);
    }

    setEnvironmentMap() {
        try {
            this.environmentMap = {};
            this.environmentMap.intensity = 0.4;
            this.environmentMap.texture = this.resources.items.environmentMapTexture;
            this.environmentMap.texture.encoding = THREE.sRGBEncoding;
            
            this.scene.environment = this.environmentMap.texture;
            
            this.environmentMap.updateMaterials = () => {
                this.scene.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.envMap = this.environmentMap.texture;
                        child.material.envMapIntensity = this.environmentMap.intensity;
                        child.material.needsUpdate = true;
                    }
                });
            };

            this.environmentMap.updateMaterials();
            
            if(this.debug.active) {
                this.debugFolder = this.debug.ui.addFolder('environment');
                this.debugFolder.add(this.environmentMap, 'intensity').name('envMapIntensity').min(0).max(4).step(0.001).onChange(this.environmentMap.updateMaterials);
            }
        } catch (error) {
            console.warn('Error setting environment map:', error);
        }
    }

    setLights() {
        try {
            this.lightsGroup = new THREE.Group();
            this.scene.add(this.lightsGroup);
            
            // Reduced ambient light for night effect
            const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // Dim blue ambient
            this.lightsGroup.add(ambientLight);
            
            // Moon-like directional light
            const moonLight = new THREE.DirectionalLight(0x8888ff, 0.5); // Soft blue moonlight
            moonLight.position.set(-1, 2, 1);
            moonLight.castShadow = true;
            moonLight.shadow.mapSize.set(1024, 1024);
            moonLight.shadow.camera.far = 15;
            moonLight.shadow.camera.left = -7;
            moonLight.shadow.camera.top = 7;
            moonLight.shadow.camera.right = 7;
            moonLight.shadow.camera.bottom = -7;
            this.lightsGroup.add(moonLight);
            
            // Very subtle hemisphere light
            const hemisphereLight = new THREE.HemisphereLight(0x4444bb, 0x080820, 0.2); // Night sky colors
            this.lightsGroup.add(hemisphereLight);
            
            if (this.debug.active) {
                this.debugFolder.add(ambientLight, 'intensity').name('ambientIntensity').min(0).max(2).step(0.001);
                this.debugFolder.add(moonLight, 'intensity').name('moonIntensity').min(0).max(2).step(0.001);
                this.debugFolder.add(moonLight.position, 'x').name('moonX').min(-5).max(5).step(0.001);
                this.debugFolder.add(moonLight.position, 'y').name('moonY').min(-5).max(5).step(0.001);
                this.debugFolder.add(moonLight.position, 'z').name('moonZ').min(-5).max(5).step(0.001);
            }
        } catch (error) {
            console.warn('Error setting lights:', error);
            const fallbackLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(fallbackLight);
        }
    }
} 