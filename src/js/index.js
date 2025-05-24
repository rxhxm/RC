import * as THREE from 'three';
// Unused imports: GLTFLoader, OrbitControls, gsap

// Experience class
import Experience from './Experience.js';

// Minimal logging
// console.log("Starting application..."); // Removed general startup log

// Function to show error messages
function showError(message) {
    console.error("Application Error:", message);
    const fallbackMessage = document.querySelector('.fallback-message');
    if (fallbackMessage) fallbackMessage.style.display = 'block';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check WebGL support
        const tempCanvas = document.createElement('canvas');
        const gl = tempCanvas.getContext('webgl2') || tempCanvas.getContext('webgl') || tempCanvas.getContext('experimental-webgl');
        if (!gl) throw new Error("WebGL not supported or disabled.");

        // Create and append main canvas
        const canvas3D = document.createElement('canvas');
        canvas3D.className = 'webgl-canvas';
        let container = document.querySelector('.webgl-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'webgl-container';
            document.body.appendChild(container);
        }
        container.appendChild(canvas3D);
        
        initExperience(canvas3D);

    } catch (error) {
        showError(error.message);
    }
});

// Function to initialize the experience
function initExperience(canvas) {
    try {
        // Prevent debug mode via URL hash
        if (window.location.hash === '#debug') {
            history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
        
        // Simplified patch for CatmullRomCurve3 to prevent debug lines (if still needed)
        if (THREE.CatmullRomCurve3 && THREE.CatmullRomCurve3.prototype.createLineGeometry) {
            THREE.CatmullRomCurve3.prototype.createLineGeometry = () => new THREE.BufferGeometry();
        }
        if (THREE.CatmullRomCurve3 && THREE.CatmullRomCurve3.prototype.createPointsGeometry) {
             THREE.CatmullRomCurve3.prototype.createPointsGeometry = () => new THREE.BufferGeometry();
        }
        
        const experience = new Experience(canvas);
        window.experience = experience; // Keep for console access if needed
        
        // Global error handler
        window.addEventListener('error', (event) => {
            if (event.message.includes('WebGL') || event.message.includes('THREE')) {
                showError("A 3D rendering error occurred. Please try refreshing.");
            }
        });

    } catch (error) {
        console.error("Critical error initializing Experience:", error);
        showError("Failed to create the 3D experience. Please ensure your browser is up to date.");
    }
        }
        
// The removeDebugLines function is no longer needed here as it's handled in Track.js
// and Three.js has internal ways of managing debug visualization. 