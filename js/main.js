// Please, hack me!

// Config

// Colors to detect Red, Green, Blue
// Use the RGB values of the color you want to track

var cR = 240;
var cG = 92;
var cB = 160;

// Color offset  (+/-)
// A bigger offset will detect a bigger range of colors
var cOffset = 40;

// Detect only blocks bigger than this weight
// The script scans the video frames seeking for color blocks using the previous RGB config and offset,
// this value sets the minimum weight of the block to be tracked
var sizeOffset = 200;

//Main object
var processor = {

    // Init
    doLoad: function() {
        // Some init
        this.video = document.getElementById("video");
        this.mirrorVideo = document.getElementById("mirrorVideo");
        this.mirrorVideoCtx = this.mirrorVideo.getContext("2d");
        this.twElement = document.getElementById("tracked");
        var self = this;

        // If the videos end, play again
        this.video.addEventListener("ended", function() {
            try { clearTimeout(self.timeout); } catch(e) {}
            self.video.play(); 
            // Work around: https://bugzilla.mozilla.org/show_bug.cgi?id=488287
            self.videoIsPlaying();
        }, true);

        // Set the events listeners for the main video (update button)
        this.pageLoaded = true;
        this.startPlayer();
    },
    videoIsPlaying: function() {
        this.timerCallback();
    },
    videoIsReady: function() {
        this.videoLoaded = true;
        this.startPlayer();
    },
    startPlayer: function() {
        if (!this.videoLoaded || !this.pageLoaded) return;
        this.width = this.video.videoWidth;
        this.height = this.video.videoHeight;
        this.mirrorVideo.width = this.width;
        this.mirrorVideo.height =  this.height;
        this.mirrorVideoCtx.fillStyle = "white";
        this.mirrorVideoCtx.strokeStyle = "black";
        this.playVideo();
    },
    // Videos control
    playVideo: function() {
        this.video.play();
        this.videoIsPlaying();
    },
    stopVideo: function() {
        this.video.pause();
        clearTimeout(this.timeout);
    },
    // Main loop
    timerCallback: function() {
        if (this.video.paused || this.video.ended) {
            return;
        }
        this.computeFrame();
        var self = this;
        this.timeout = setTimeout(function () {
            self.timerCallback();
        }, 50);
    },
    dist: function(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    },
    computeFrame: function() {
        this.mirrorVideoCtx.clearRect(0, 0, this.width, this.height);
        try {
            this.mirrorVideoCtx.drawImage(this.video, 0, 0, this.width, this.height);
        } catch(e) {
            return;
        }
        var frame = this.mirrorVideoCtx.getImageData(0, 0, this.width, this.height);

        var x, y;

        var shape1 = null;

        var r, g, b, x, y;

        var D = 20;

        var l = frame.data.length / 4;

        // We dont' need to compute each pixels
        var step = 4;

        for (var i = 0; i < l; i += step) {


            r = frame.data[i * 4 + 0];
            g = frame.data[i * 4 + 1];
            b = frame.data[i * 4 + 2];


            x = i % this.width;
            y = Math.round(i / this.width);

            // Is the pixel in our color range?
            if ((r > (cR - cOffset) && r < (cR + cOffset) ) && (g > (cG - cOffset) && g < (cG + cOffset) ) && (b > (cB - cOffset) && b < (cB + cOffset) )) {
                if (!shape1) {
                    // no shape yet
                    shape1 = {};
                    shape1.x = x;
                    shape1.y = y;
                    shape1.rgb = r + ',' + g + ',' + b;
                    shape1.weight = 1;
                } else {
                    var d = this.dist(x, y, shape1.x, shape1.y);
                    if (d < D) {
                        shape1.x += 1/(shape1.weight + 1) * (x - shape1.x);
                        shape1.y += 1/(shape1.weight + 1) * (y - shape1.y);
                        shape1.rgb = r + ',' + g + ',' + b;
                        shape1.weight++;
                    } 
                } 
            }
            // Too shaking
            //if (x >= (this.width - step)) i+= step * this.width;
        }

        // We didn't find any shape
        if (!shape1) return;
      //  console.log(shape1.weight);
        if(shape1.weight > sizeOffset) {
            this.twElement.style.top = shape1.y;
            this.twElement.style.left = shape1.x; 
            this.twElement.style.backgroundColor = 'rgb('+shape1.rgb+')';
        }



        return;
    }
};

// ... cool, isn't it :)
