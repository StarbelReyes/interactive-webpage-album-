class Loader {
    constructor() {
      this.callback = null;
    }
  
    load(file) {
      const request = new XMLHttpRequest();
  
      request.open('GET', file, true);
      request.onprogress = (evt) => {
        const percent = Math.floor((evt.loaded / evt.total) * 100);
  
        this.callback(percent);
      };
  
      request.onload = () => { this.complete(file) };
      request.send();
    }
  
    progress(callback) { this.callback = callback };
  
    complete() { }
  }
  
  class App {
    constructor() {
      this.songFile = 'https://iondrimbafilho.me/3d5/ocean_drive.mp3';
      this.percent = 0;
      this.playing = false;
      this.volume = 1;
      this.sceneBackGroundColor = 0x1878de;
      this.objectsColor = 0xfff700;
      this.rowTiles = [];
      this.groupTiles = new THREE.Object3D();
  
      this.loader = new Loader();
      this.loader.progress((percent) => { this.progress(percent); });
      this.loaderBar = document.querySelector('.loader');
      this.loader.load(this.songFile);
      this.playIntro = document.querySelector('.play-intro');
      this.loader.complete = this.complete.bind(this);
  
    }
  
    progress(percent) {
      this.loaderBar.style.transform = `scale(${(percent / 100) + .1}, 1.1)`;
      
      if (percent === 100) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            this.playIntro.classList.add('control-show');
            this.loaderBar.classList.add('removeLoader');
            this.loaderBar.style.transform = 'scale(1, 0)';
          })
        }, 800);
      }
    }
  
    complete(file) {
      this.groupTiles = new THREE.Object3D();
      this.groupTiles2 = new THREE.Object3D();
      this.groupTiles3 = new THREE.Object3D();
      this.groupTiles4 = new THREE.Object3D();
  
      this.tiles = [];
  
      this.setupAudio();
      this.addSoundControls();
      this.createScene();
      this.createCamera();
      this.addAmbientLight();
      this.addSpotLight(new THREE.SpotLight(this.objectsColor), 0, 30, 0);
      this.addCameraControls();
      this.addFloor();
  
      this.playSound(file);
      this.addEventListener();
  
      this.addEnvMap();
  
      this.addGroupTiles(this.groupTiles);
      this.addGroupTiles(this.groupTiles2);
      this.addGroupTiles(this.groupTiles3);
      this.addGroupTiles(this.groupTiles4);
  
      this.groupTiles.position.set(-9, 0, 9);
      this.groupTiles2.position.set(-27, 0, -9);
      this.groupTiles3.position.set(9, 0, -9);
      this.groupTiles4.position.set(-9, 0, -27);
  
      this.addGrid();
  
      this.animate();
      
      document.addEventListener('visibilitychange', (evt) => {
        if(evt.target.hidden) {
          this.pause();
        } else {
          this.play();
        }
        
      }, false);
    }
  
    addEnvMap() {
      const urls = [
        'https://iondrimbafilho.me/3d5/img/negy.jpg',
        'https://iondrimbafilho.me/3d5/img/negx.jpg',
        'https://iondrimbafilho.me/3d5/img/negz.jpg',
        'https://iondrimbafilho.me/3d5/img/posy.jpg',
        'https://iondrimbafilho.me/3d5/img/posz.jpg',
        'https://iondrimbafilho.me/3d5/img/posx.jpg',
      ];
  
      const cubemap = new THREE.CubeTextureLoader().load(urls);
      cubemap.format = THREE.RGBAFormat;
  
      const geometry = new THREE.OctahedronGeometry(3, 0);
      const sphereMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00, 
        emissive: 0x0,
        roughness: 0.4,
        metalness: 0.6,
        envMap: cubemap
      });
  
      this.reflectingObject = new THREE.Mesh(geometry, sphereMaterial);
      this.reflectingObject.position.y = 8;
      this.reflectingObject.castShadow = true;
      this.reflectingObject.receiveShadow = true;
  
      this.scene.add(this.reflectingObject);
    }
  
    addGroupTiles(group) {
      let positions = [];
      const gutter = 2;
      const cols = 10;
      const rows = 10;
  
      const geometry = new THREE.CylinderGeometry(.4, .4, 10, 59);
      const material = new THREE.MeshStandardMaterial({
        color: this.objectsColor,
        emissive: 0x586300,
        roughness: 0.15,
        metalness: 0.64
      });
      
      for (let col = 0; col < cols; col++) {
        positions[col] = [];
  
        for (let row = 0; row < rows; row++) {
          const pos = {
            z: row,
            y: 0,
            x: col
          };
  
          positions[col][row] = pos;
  
          const plane = this.create3DObj(this.objectsColor, geometry, material);
  
          plane.scale.set(1, 0.001, 1);
  
          if (col > 0) {
            pos.x = (positions[col - 1][row].x * 1) + gutter;
          }
  
          if (row > 0) {
            pos.z = (positions[col][row - 1].z * 1) + gutter;
          }
  
          plane.position.set(pos.x, pos.y, pos.z);
  
          group.add(plane);
  
          this.tiles.push(plane);
        }
      }
  
      positions = null;
  
      this.scene.add(group);
    }
  
    addGrid() {
      const size = 25;
      const divisions = size;
      const gridHelper = new THREE.GridHelper(size, divisions);
      
      gridHelper.position.set(0, 0, 0);
      gridHelper.material.opacity = 0;
      gridHelper.material.transparent = true;
      
      this.scene.add(gridHelper);
    }
  
    playSound(file) {
      this.audioElement.src = file;
    }
  
    map(value, start1, stop1, start2, stop2) {
      return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2
    }
  
    drawWave() {
      let scale = 0;
      let freq = 0;
  
      if (this.playing) {
        this.analyser.getByteFrequencyData(this.frequencyData);
  
        for (let i = 0; i <this.frequencyData.length; i++) {
          freq = this.frequencyData[i];
          scale = this.map(freq, 0, 255, 0.001, 1);
  
          if(this.tiles[i]) {
            TweenMax.to(this.tiles[i].scale, .3, { y: scale });  
          }
        }
      }
    }
  
    addSoundControls() {
      this.btnPlay = document.querySelector('.play');
      this.btnPause = document.querySelector('.pause');
  
      this.btnPlay.addEventListener('click', this.play.bind(this));
      this.btnPause.addEventListener('click', this.pause.bind(this));
    }
  
    pause() { 
      this.audioElement.pause();
      this.btnPause.classList.remove('control-show');
      this.btnPlay.classList.add('control-show');
    }
  
    play() {
      this.audioCtx.resume();
      this.audioElement.play();
      this.btnPlay.classList.remove('control-show');
      this.btnPause.classList.add('control-show');
    }
  
    createScene() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.sceneBackGroundColor);
  
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
  
      this.scene1 = new THREE.Scene();
  
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
      document.body.appendChild(this.renderer.domElement);
    }
  
    addEventListener() {
      this.playIntro.addEventListener('click', (evt) => {
        evt.currentTarget.classList.remove('control-show');
        this.play();
      });
  
      document.body.addEventListener('mouseup', () => {
        requestAnimationFrame(() => {
          document.body.style.cursor = '-moz-grab';
          document.body.style.cursor = '-webkit-grab';
        });
      });
  
      document.body.addEventListener('mousedown', () => {
        requestAnimationFrame(() => {
          document.body.style.cursor = '-moz-grabbing';
          document.body.style.cursor = '-webkit-grabbing';
        });
      });
  
      document.body.addEventListener('keyup', (evt) => {
        if (evt.keyCode === 32 || evt.code === 'Space') {
          this.playIntro.classList.remove('control-show');
          this.playing ? this.pause() : this.play();
        }
      });
    }
  
    createCamera() {
      this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
      this.camera.position.set(40, 40, -40);
      this.scene.add(this.camera);
  
      this.cameraCube = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100000);
    }
  
    addCameraControls() {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
              this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.04;
      
      document.body.style.cursor = "-moz-grabg";
      document.body.style.cursor = "-webkit-grab";
  
      this.controls.addEventListener("start", () => {
        requestAnimationFrame(() => {
          document.body.style.cursor = "-moz-grabbing";
          document.body.style.cursor = "-webkit-grabbing";
        });
      });
  
      this.controls.addEventListener("end", () => {
        requestAnimationFrame(() => {
          document.body.style.cursor = "-moz-grab";
          document.body.style.cursor = "-webkit-grab";
        });
      });
    }
  
    create3DObj(color, geometry, material) {
      const obj = new THREE.Mesh(geometry, material);
      
      obj.castShadow = true;
      obj.receiveShadow = true;
      obj.position.y = 5;
  
      const pivot = new THREE.Object3D();
      
      pivot.add(obj);
      pivot.size = 2;
      
      return pivot;
    }
  
    onResize() {
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      
      this.camera.aspect = ww / wh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(ww, wh);
    }
  
    addFloor() {
      const planeGeometry = new THREE.PlaneGeometry(250, 250);
      const planeMaterial = new THREE.ShadowMaterial({ opacity: .05 });
  
      this.floor = new THREE.Mesh(planeGeometry, planeMaterial);
  
      planeGeometry.rotateX(- Math.PI / 2);
  
      this.floor.position.y = 0;
      this.floor.receiveShadow = true;
  
      this.scene.add(this.floor);
    }
  
    addSpotLight(spotLight, x, y, z) {
      this.spotLight = spotLight;
      this.spotLight.position.set(x, y, z);
      this.spotLight.castShadow = true;
  
      this.scene.add(this.spotLight);
    }
  
    addAmbientLight() {
      const light = new THREE.AmbientLight(0xffffff);
      
      this.scene.add(light);
    }
  
    animate() {
      this.controls.update();
  
      this.renderer.render(this.scene, this.camera);
  
      this.drawWave();
  
      this.reflectingObject.rotation.y += .05;
  
      requestAnimationFrame(this.animate.bind(this));
    }
  
    radians(degrees) {
      return degrees * Math.PI / 180;
    }
  
    setupAudio() {
      this.audioElement = document.getElementById('audio');
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.smoothingTimeConstant = 0.4;
  
      this.source = this.audioCtx.createMediaElementSource(this.audioElement);
      this.source.connect(this.analyser);
      this.source.connect(this.audioCtx.destination);
  
      this.bufferLength = this.analyser.frequencyBinCount;
  
      this.waveform = new Uint8Array(this.analyser.fftSize);
      this.frequencyData = new Uint8Array(this.analyser.fftSize);
      this.audioElement.volume = this.volume;
  
      this.audioElement.addEventListener('playing', () => {
        this.playing = true;
      });
      
      this.audioElement.addEventListener('pause', () => {
        this.playing = false;
      });
      
      this.audioElement.addEventListener('ended', () => {
        this.playing = false;
        this.pause();
      });
    }
  }
  
  window.app = new App();
  
  window.addEventListener('resize', app.onResize.bind(app));
