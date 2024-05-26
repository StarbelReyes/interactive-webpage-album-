document.addEventListener('DOMContentLoaded', function () {
    var radius = 240; // how big of the radius
    var autoRotate = true; // auto rotate or not
    var rotateSpeed = 60; // unit: seconds/360 degrees
    var imgWidth = 120; // width of images (unit: px)
    var imgHeight = 170; // height of images (unit: px)

    // Link of background music - set 'null' if you don't want to play background music
    var bgMusicURL = null; // Update with your background music URL
    var bgMusicControls = true; // Show UI music control

    // ===================== start =======================
    // animation start after 1000 milliseconds
    setTimeout(init, 1000);

    var odrag = document.getElementById('drag-container');
    var ospin = document.getElementById('spin-container');
    var aImg = ospin.getElementsByTagName('img');
    var aVid = ospin.getElementsByTagName('video');
    var aEle = [...aImg, ...aVid]; // combine 2 arrays

    // Size of images
    ospin.style.width = imgWidth + "px";
    ospin.style.height = imgHeight + "px";

    // Size of ground - depend on radius
    var ground = document.getElementById('ground');
    ground.style.width = radius * 3 + "px";
    ground.style.height = radius * 3 + "px";

    function init(delayTime) {
        for (var i = 0; i < aEle.length; i++) {
            aEle[i].style.transform = "rotateY(" + (i * (360 / aEle.length)) + "deg) translateZ(" + radius + "px)";
            aEle[i].style.transition = "transform 1s";
            aEle[i].style.transitionDelay = delayTime || (aEle.length - i) / 4 + "s";
        }
    }

    function applyTranform(obj) {
        // Constrain the angle of camera (between 0 and 180)
        if(tY > 180) tY = 180;
        if(tY < 0) tY = 0;

        // Apply the angle
        obj.style.transform = "rotateX(" + (-tY) + "deg) rotateY(" + (tX) + "deg)";
    }

    function playSpin(yes) {
        ospin.style.animationPlayState = (yes?'running':'paused');
    }

    var sX, sY, nX, nY, desX = 0,
        desY = 0,
        tX = 0,
        tY = 10;

    // auto spin
    if (autoRotate) {
        var animationName = (rotateSpeed > 0 ? 'spin' : 'spinRevert');
        ospin.style.animation = `${animationName} ${Math.abs(rotateSpeed)}s infinite linear`;
    }

    // add background music
    if (bgMusicURL) {
        document.getElementById('music-container').innerHTML += `
        <audio src="${bgMusicURL}" ${bgMusicControls? 'controls': ''} autoplay loop>    
        <p>If you are reading this, it is because your browser does not support the audio element.</p>
        </audio>
        `;
    }

    // setup events
    document.onpointerdown = function (e) {
        clearInterval(odrag.timer);
        e = e || window.event;
        var sX = e.clientX,
            sY = e.clientY;

        this.onpointermove = function (e) {
            e = e || window.event;
            var nX = e.clientX,
                nY = e.clientY;
            desX = nX - sX;
            desY = nY - sY;
            tX += desX * 0.1;
            tY += desY * 0.1;
            applyTranform(odrag);
            sX = nX;
            sY = nY;
        };

        this.onpointerup = function (e) {
            odrag.timer = setInterval(function () {
                desX *= 0.95;
                desY *= 0.95;
                tX += desX * 0.1;
                tY += desY * 0.1;
                applyTranform(odrag);
                playSpin(false);
                if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
                    clearInterval(odrag.timer);
                    playSpin(true);
                }
            }, 17);
            this.onpointermove = this.onpointerup = null;
        };

        return false;
    };

    document.onmousewheel = function(e) {
        e = e || window.event;
        var d = e.wheelDelta / 20 || -e.detail;
        radius += d;
        init(1);
    };

    var currentlyPlayingAudio = null; // Variable to store the currently playing audio element

    // Add click event listeners to each image
    var aImg = document.querySelectorAll('#spin-container img');
    aImg.forEach(function(img) {
        img.addEventListener('click', function(event) {
            var imgId = this.id;
            // Call a function to play the corresponding song based on the image ID
            playSong(imgId);
        });
    });

    // Function to play the song based on the image ID
    function playSong(imageId) {
        // Define the mappings of image IDs to corresponding song URLs
        var songMap = {
            "img1": "music folder/Starbel - walk with me .wav",
            "img2": "music folder/Starbel - Michael Scott new.wav",
            "img3": "music folder/Starbel - Wouldn't Change This.wav",
            "img4": "music folder/Starbel - How I Live INTERLUDE.wav",
            "img5": "music folder/Starbel - Tickin Time Bomb 1st mix.wav",
            "img6": "music folder/Starbel - Animal.wav",
            "img7": "music folder/Starbel - Extra Track 2.wav"
        };

        // Retrieve the corresponding song URL from the songMap
        var songUrl = songMap[imageId];

        // Stop the currently playing song
        if (currentlyPlayingAudio) {
            currentlyPlayingAudio.pause();
            currentlyPlayingAudio.currentTime = 0; // Reset the playback position
        }

        // Play the new song
        var audioElement = document.getElementById('audio-element');
        audioElement.src = songUrl;
        audioElement.play();
        currentlyPlayingAudio = audioElement; // Store the reference to the currently playing audio element

        // Load and parse the lyrics for the selected song
        var lrcContent = songLyrics[imageId];
        currentLyrics = parseLRC(lrcContent);

        // Reset the lyrics display
        lyricsContainer.textContent = "";

        // Update the song duration once the metadata is loaded
        audioElement.addEventListener('loadedmetadata', function() {
            var duration = formatTime(audioElement.duration);
            document.getElementById('song-duration').textContent = "0:00 / " + duration;
        });

        // Ensure the lyrics are updated as the audio plays
        audioElement.addEventListener('timeupdate', updateLyrics);
    }

    // Function to parse LRC content
    function parseLRC(content) {
        var lines = content.split('\n');
        var result = [];
        var timePattern = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
        for (var i = 0; i < lines.length; i++) {
            var match = timePattern.exec(lines[i]);
            if (match) {
                var minutes = parseInt(match[1], 10);
                var seconds = parseInt(match[2], 10);
                var milliseconds = parseInt(match[3], 10) * 10;
                var time = minutes * 60 + seconds + milliseconds / 1000;
                var text = lines[i].replace(timePattern, '').trim();
                result.push({ time: time, text: text });
            }
        }
        return result;
    }

    // Update lyrics display based on the current playback time
    function updateLyrics() {
        var currentTime = audioElement.currentTime;
        var lyricsText = "";
        for (var i = 0; i < currentLyrics.length; i++) {
            if (currentTime >= currentLyrics[i].time) {
                lyricsText = currentLyrics[i].text;
            } else {
                break;
            }
        }
        lyricsContainer.textContent = lyricsText;

        // Update the current playback time display
        var currentTimeDisplay = formatTime(currentTime);
        var duration = formatTime(audioElement.duration);
        document.getElementById('song-duration').textContent = currentTimeDisplay + " / " + duration;
    }

    // Format time in minutes and seconds
    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        var seconds = Math.floor(seconds % 60);
        return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    }

    // Define the LRC content for each song
    var songLyrics = {
        "img1": `[00:01.00]Walk with me
                 [00:05.00]Let's go for a walk
                 [00:10.00]And talk about life`,
        "img2": `[00:01.00]Michael Scott new
                 [00:05.00]This is the office theme
                 [00:10.00]Enjoy the music`,
        "img3": `[00:01.00]Wouldn't Change This
                 [00:05.00]No, I wouldn't change this
                 [00:10.00]Even if I could`,
        "img4": `[00:01.00]How I Live INTERLUDE
                 [00:05.00]This is how I live
                 [00:10.00]An interlude for you`,
        "img5": `[00:11.94] Maybe in a different life
        [00:13.39] Today feeling different might 
        [00:14.96] Distance myself 
        [00:16.17] Cus those whose close to me 
        [00:17.27] Hit dislike 
        [00:18.07] Did I do it myself?
        [00:18.97] If self destruction 
        [00:19.91] You call this 
        [00:20.57] Than I’m a ticking time bomb 
        [00:22.26] I know it’s wicked 
        [00:23.04] Need help 
        [00:24.29] Feel like an album 
        [00:25.36] That never got off the shelf 
        [00:27.24] Feeling like Michael 
        [00:28.41] But not a Jackson 
        [00:29.37] I’m Phelps 
        [00:30.59] swim where its safe
        [00:31.56] Cus if I drown 
        [00:32.29] Then oh well
        [00:36.59] What’s the conclusion 
        [00:37.82] Well baby im inconclusive 
        [00:39.19] Thought I was 
        [00:39.86] drowning in water 
        [00:40.52] There was a drought 
        [00:41.37] In the pool and
        [00:42.19] Thought I was chocking 
        [00:43.07] From pressure 
        [00:43.69] But it’s the rope you was pulling 
        [00:45.17] My birthday month 
        [00:46.02] Yeah it’s April 
        [00:46.81] But who the fuck is you fooling 
        [00:48.26] Just got a message to cool it 
        [00:49.84] But  I don’t know when to do it 
        [00:51.31] My dawg addicted 
        [00:52.74] To metal 
        [00:53.17] But we ain’t talking a
        [00:54.52] bout music 
        [00:55.96] They made a deal with the devil 
        [00:57.51] Just pray your soul not included 
        [00:58.29] You chose 
        [00:58.64] Your lane 
        [00:59.51] Threw them deuces 
        [01:00.81] So when you see me in public 
        [01:01.44] Dont think it’s love 
        [01:02.29] Dont approve it 
        [01:03.66] I’m reconnecting the pieces 
        [01:05.29] I think I’m starting to lose it 
        [01:06.76] Cus if my life it’s a puzzle 
        [01:07.42] Please tell me
        [01:08.36] Im feeling clueless 
        [01:09.66] I’m looking back at my life 
        [01:11.34] And I swear the view it’s amusing 
        [01:11.96] Thank god 
        [01:12.97] For all that I’ve done 
        [01:14.46] Regret the things that I couldn’t
        [01:16.01] If everyday ls a lesson 
        [01:17.56] Then everyday im a student 
        [01:19.02] Man I was voted most likely 
        [01:19.92] To lose it all 
        [01:20.67] And recoup it 
        [01:21.34] They really thought
        [01:21.91] I was stupid 
        [01:22.86] I took a L 
        [01:23.71] But I used it 
        [01:24.19] To motivate 
        [01:25.84] In this music 
        [01:27.21] Maybe in a different life
        [01:28.81] Today feeling different might 
        [01:29.91] Distance myself 
        [01:30.92] Cus those whose close to me 
        [01:31.89] Hit dislike 
        [01:32.99] Did I do it myself?
        [01:34.01] If self destruction 
        [01:35.01] You call this 
        [01:35.59] Than I’m a ticking time bomb 
        [01:37.02] I know it’s wicked 
        [01:38.07] Need help 
        [01:39.16] Feel like an album 
        [01:40.94] That never got off the shelf 
        [01:42.09] Feeling like Michael 
        [01:43.06] But not a Jackson 
        [01:44.29] I’m Phelps 
        [01:45.36] Swim where it’s safe
        [01:46.04] Cus if I drown 
        [01:50.29] Then oh well
        [01:51.34] This not a diss song 
        [01:52.27] But we don’t talk 
        [01:53.02] It don’t seem 
        [01:53.47] Right 
        [01:54.41] My lil bro had a daughter 
        [01:55.03] To see her 
        [01:56.01] Can’t get an invite 
        [01:57.46] That shit done hurt in the inside 
        [01:58.94] Im trying to keep my composure 
        [02:00.52] But I break  down when it’s midnight 
        [02:01.94] But fuck I gotta move on 
        [02:02.42] Disgusted 
        [02:03.89] It’s hard to describe the feeling 
        [02:05.52] I swear this is not a gimmick 
        [02:07.12] Live life like I’m out of minutes 
        [02:08.73] Calm cus I’m not a menace 
        [02:10.34] Dawg I’m not trynna blend in 
        [02:11.76] Dawg I don’t want a hand it 
        [02:12.92] Whatever your offer 
        [02:13.64] I’m better off
        [02:15.03] Where I’m headed 
        [02:16.41] Maybe in a different life
        [02:17.91] Today feeling different might 
        [02:19.06] Distance myself 
        [02:20.14] Cus those whose close to me 
        [02:20.94] Hit dislike 
        [02:22.12] Did I do it myself?
        [02:22.99] If self destruction 
        [02:23.69] You call this 
        [02:25.21] Than I’m a ticking time bomb 
        [02:26.12] I know it’s wicked 
        [02:27.32] Need help 
        [02:28.24] Feel like an album 
        [02:30.23] That never got off the shelf 
        [02:31.43] Feeling like Michael 
        [02:32.24] But not a Jackson 
        [02:33.61] I’m Phelps 
        [02:34.64] Swim where it’s safe
        [02:35.41] Cus if I drown 
        [02:39.17] Then oh well
        `,
        "img6": `[00:01.00]Extra Track 1
                 [00:05.00]This is an extra track
                 [00:10.00]Just for you`,
        "img7": `[00:01.00]Extra Track 2
                 [00:05.00]Another extra track
                 [00:10.00]Enjoy it too`
    };

    // Variables to store the current lyrics and audio element
    var currentLyrics = [];
    var audioElement = document.getElementById('audio-element');
    var lyricsContainer = document.getElementById('lyrics');

    // Initial playback control button event listeners
    document.getElementById('play-button').addEventListener('click', function() {
        audioElement.play();
    });

    document.getElementById('pause-button').addEventListener('click', function() {
        audioElement.pause();
    });

    document.addEventListener('wheel', function (event) {
        if (event.ctrlKey === true) {
            event.preventDefault();
        }
    }, { passive: false });

 
        var container = document.getElementById('drag-container');
    
        // Add click event listeners to each image
        var images = container.querySelectorAll('img');
        images.forEach(function(img) {
            img.addEventListener('click', function() {
                var imageUrl = this.src;
                changeBackground(imageUrl);
            });
        });
        
    
        // Function to change the background image
        function changeBackground(imageUrl) {
            document.body.style.backgroundImage = "url('" + imageUrl + "')";
        }

        function changeBackgroundWithTransition(imageUrl, songTitle, artistSongInfo) {
            document.body.style.transition = "background-image 0.5s ease"; // Enable transition effect
            document.body.style.backgroundImage = "url('" + imageUrl + "')"; // Set new background image
            document.body.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,1) 30%, rgba(0,0,0,0)), url('" + imageUrl + "')";
            document.getElementById('song-title').innerText = songTitle;
            document.getElementById('artist-song-info').innerText = artistSongInfo;
        }
        
        
        // Add click event listeners to each image in the carousel
        var aImg = document.querySelectorAll('#spin-container img');
        aImg.forEach(function(img) {
            img.addEventListener('click', function(event) {
                var imgSrc = this.src; // Get the source of the clicked image
                changeBackgroundWithTransition(imgSrc,); // Change the background image with transition
       // Get the corresponding song information based on the clicked image

           // Apply linear gradient to the background
           applyLinearGradient();

       var songInfo = getSongInfo(this.id);
       if (songInfo) {
           // Update the song title and artist/album information
           document.getElementById('album-title').textContent = songInfo.album;
           document.getElementById('artist-song-info').textContent = `${songInfo.artist} - ${songInfo.title}`;
       }
   });
});

// Function to change the background image with transition
function changeBackgroundWithTransition(imageUrl) {
   document.body.style.transition = "background-image 0.5s ease"; // Enable transition effect
   document.body.style.backgroundImage = "url('" + imageUrl + "')"; // Set new background image
}   

function applyLinearGradient() {
    document.getElementById('background').style.background = "linear-gradient(to right, rgba(0,0,0,1) 20%, rgba(0,0,0,0))"; // Apply linear gradient
}

// Function to retrieve song information based on the image ID
function getSongInfo(imageId) {
   // Define the mappings of image IDs to corresponding song information
   var songInfoMap = {
       "img1": { title: "Walk With Me", artist: "Starbel", album: "Someone You Forgot" },
       "img2": { title: "Michael Scott", artist: "Starbel", album: "Someone You Forgot" },
       "img3": { title: "Song 3", artist: "Starbel", album: "Someone You Forgot" },
       // Add more mappings as needed for other images
   };

   // Retrieve the corresponding song information from the songInfoMap
   return songInfoMap[imageId];
}

});