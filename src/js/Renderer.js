import * as THREE from 'three';

export default class Renderer {
    constructor(experience) {
        this.experience = experience;
        this.canvas = this.experience.canvas;
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.camera = this.experience.camera;

        this.setInstance();
    }

    setInstance() {
        try {
            console.log("Creating WebGL renderer with canvas:", this.canvas);
            this.instance = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: true
            });
            
            this.instance.setSize(this.sizes.width, this.sizes.height);
            this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            // Handle different THREE.js versions
            if (THREE.REVISION >= 149) {
                // For THREE.js r149+
                try {
                    this.instance.outputColorSpace = THREE.SRGBColorSpace;
                } catch (e) {
                    console.warn("Could not set outputColorSpace, falling back to legacy", e);
                    this.instance.outputEncoding = THREE.sRGBEncoding;
                }
            } else {
                // For older THREE.js versions
                this.instance.outputEncoding = THREE.sRGBEncoding;
            }
            
            // Set tone mapping if available
            try {
                this.instance.toneMapping = THREE.ACESFilmicToneMapping;
                this.instance.toneMappingExposure = 1.2;
            } catch (e) {
                console.warn("Could not set tone mapping", e);
            }
            
            this.instance.shadowMap.enabled = true;
            this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
            this.instance.setClearColor(0xffffff); // White background
            
            // Make sure debug line rendering is disabled
            if (this.instance.debug) {
                this.instance.debug.enabled = false;
            }
            
            // Disable any built-in helpers
            if (THREE.CameraHelper) {
                const camHelper = new THREE.CameraHelper(this.experience.camera.instance);
                camHelper.visible = false;
            }
            
            console.log("WebGL renderer created successfully");
        } catch (error) {
            console.error("Failed to create WebGL renderer:", error);
            throw error;
        }
    }

    resize() {
        if (this.instance) {
            this.instance.setSize(this.sizes.width, this.sizes.height);
            this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    }

    update() {
        if (this.instance && this.scene && this.camera && this.camera.instance) {
            this.instance.render(this.scene, this.camera.instance);
        }
    }
} 