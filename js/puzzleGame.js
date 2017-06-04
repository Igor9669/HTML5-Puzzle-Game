'use strict';
var PuzzleGame = function () {
    this.init();
};

PuzzleGame.prototype = {
    init: function () {
        //Number of Rows and Cols of a puzzle
        this._numRows = 3;
        this._numClos = 4;

        //seting up width and height of our puzzle
        this._width = document.body.clientWidth;
        this._height = document.body.clientHeight;

        //source image size 1280x720
        this._originalWidth = 1280;
        this._originalHeight = 720;

        //original size of a single piece 
        this._originalPieceWidth = Math.round(this._originalWidth / this._numClos);
        this._originalPieceHeight = Math.round(this._originalHeight / this._numRows);



        this._puzzlePieces = [];

        this._pieceInUse = null; //the piece that we will drag
        this._candidateToSwap = null; // the piece to swap
        this._pointer = {}; //position of mouse click or touch

        this.setupImg();


        window.addEventListener("orientationchange", function () {
            location.reload();
        });
    },
    setupImg: function () {
        //setting up our image
        this._sourceImage = new Image();
        this._sourceImage.addEventListener('load', () => {
            //setting up our canvas when image has downloaded
            this.setupCanvas();
        });
        this._sourceImage.src = "https://s3-eu-west-1.amazonaws.com/wagawin-ad-platform/media/testmode/banner-landscape.jpg";
        this._sourceImage.width = this._width;
        this._sourceImage.height = this._height;
    },
    setupCanvas: function () {
        this.addCanvasToBody();
        this._canvas = document.getElementById("puzzle");
        this._ctx = this._canvas.getContext('2d');
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        this._ctx.drawImage(this._sourceImage, 0, 0, this._width, this._height);
        this.startCounter();
    },
    addCanvasToBody: function () {
        var node = document.createElement('canvas');
        node.setAttribute('id', 'puzzle');
        var textNode = document.createTextNode("Sorry, but your browser doesn't support canvas.");
        node.appendChild(textNode);
        document.body.insertBefore(node, document.body.firstChild);
    },
    startCounter: function () {
        this.addCounterToBody();
        this._timer = 3;
        var timer = document.getElementById("timer");
        timer.addEventListener('animationend', function () {
            timer.classList.remove("scale-anim");
        });
        var timer_id = setInterval(function () {

            if (this._timer === 0) {
                clearInterval(timer_id);
                document.body.removeChild(timer);

                //timer.innerText = "";
                this.generatePieces();
                return;
            }
            timer.innerText = this._timer;
            timer.classList += " scale-anim";
            this._timer--;
        }.bind(this), 1000);

    },
    addCounterToBody: function () {
        var node = document.createElement('div');
        node.setAttribute('id', 'timer');
        node.setAttribute('class', 'timer');
        document.body.insertBefore(node, document.body.firstChild);
    },
    generatePieces: function () {
        // (0,0) - initial pos in canvas
        var curX = 0;
        var curY = 0;

        this.updateWidhtAndHeight();
        //setting up width and height of a single piece of a puzzle
        this._pieceWidth = Math.round(this._width / this._numClos);
        this._pieceHeight = Math.round(this._height / this._numRows);

        var curPiece;
        var startX = 0;
        var startY = 0;
        for (let i = 0; i < this._numRows; ++i) {
            for (let j = 0; j < this._numClos; ++j) {
                curPiece = {};
                curPiece.x = curX;
                curPiece.y = curY;
                curPiece.startX = startX;
                curPiece.startY = startY;
                curX += this._originalPieceWidth;
                startX += this._pieceWidth;
                this._puzzlePieces.push(curPiece);
            }
            curX = 0;
            startX = 0;
            curY += this._originalPieceHeight;
            startY += this._pieceHeight;
        }
        this.shuffleAndDraw();
    },
    shuffleAndDraw: function () {
        this._ctx.clearRect(0, 0, this._width, this._height); //clear all in canvas

        this.updateCanvasWidthAndHeight();
        // this.generatePieces();

        this._puzzlePieces.shuffle();

        var curX = 0;
        var curY = 0;
        var curPiece;
        var pos = 0;
        this._ctx.strokeStyle = "#dcdcdc";
        for (let i = 0; i < this._numRows; ++i) {
            for (let j = 0; j < this._numClos; ++j) {
                curPiece = this._puzzlePieces[pos++];
                curPiece.inPuzzleX = curX;
                curPiece.inPuzzleY = curY;
                this._ctx.drawImage(this._sourceImage, curPiece.x, curPiece.y, this._originalPieceWidth, this._originalPieceHeight, curX, curY, this._pieceWidth, this._pieceHeight);

                this._ctx.strokeRect(curX, curY, this._pieceWidth, this._pieceHeight); //border 
                curX += this._pieceWidth;
            }
            curX = 0;
            curY += this._pieceHeight;
        }
        //console.log(this._puzzlePieces);
        this.addSidebarWithCounter();
        this.addEventsToCanvas();


    },
    updateWidhtAndHeight: function () {
        this._width -= 120;
        this._height -= 80;

    },
    updateCanvasWidthAndHeight: function () {
        this._canvas.width = this._width;
        this._canvas.height = this._height;
        document.body.style.padding = "40px 80px 40px 40px";
    },
    addEventsToCanvas: function () {

        this._canvas.onmousedown = this.mouseDownHandler.bind(this);
        this._canvas.ontouchstart = this.touchStartHandler.bind(this);


    },
    mouseDownHandler: function (e) {
        if (!e) {
            var e = event;
        }

        //console.log(event.pageX + " " + event.pageY);
        //console.log((event.pageX - this._canvas.offsetLeft) + " " + (event.pageY - this._canvas.offsetTop));
        this._pointer.x = e.pageX - this._canvas.offsetLeft;
        this._pointer.y = e.pageY - this._canvas.offsetTop;
        this._pieceInUse = this.getPieceClickedOrTouched();
        //console.log(this._pieceInUse);
        if (this._pieceInUse !== null) {
            this.setPieceToPointer();
            this._canvas.onmousemove = this.mouseMoveHandler.bind(this);
            this._canvas.onmouseup = this.mouseUpHandler.bind(this);


        }
    },
    touchStartHandler: function (e) {
        if (!e) {
            var e = event;
        }
        e.preventDefault();
        this._pointer.x = e.targetTouches[0].pageX - this._canvas.offsetLeft;
        this._pointer.y = e.targetTouches[0].pageY - this._canvas.offsetTop;
        this._pieceInUse = this.getPieceClickedOrTouched();
        if (this._pieceInUse !== null) {
            this.setPieceToPointer();
            this._canvas.ontouchmove = this.touchMoveHandler.bind(this);
            this._canvas.ontouchend = this.mouseUpHandler.bind(this);
            // console.log("touched");

        }
    },
    mouseMoveHandler: function (e) {
        if (!e) {
            var e = event;
        }
        e.preventDefault();
        this._pointer.x = e.pageX - this._canvas.offsetLeft;
        this._pointer.y = e.pageY - this._canvas.offsetTop;
        this.dragPiece();
    },
    touchMoveHandler: function (e) {
        if (!e) {
            var e = event;
        }
        e.preventDefault();
        this._pointer.x = e.targetTouches[0].pageX - this._canvas.offsetLeft;
        this._pointer.y = e.targetTouches[0].pageY - this._canvas.offsetTop;
        this.dragPiece();
    },
    mouseUpHandler: function () {
        this._canvas.onmousemove = null;
        this._canvas.onmouseup = null;

        if (this._candidateToSwap !== null) {
            this.swapPieces();
            if (this.checkResult()) {
                this.gameOver();
            }
        }

        this._ctx.clearRect(0, 0, this._width, this._height);
        for (let piece of this._puzzlePieces) {
            this._ctx.drawImage(this._sourceImage, piece.x, piece.y, this._originalPieceWidth, this._originalPieceHeight, piece.inPuzzleX, piece.inPuzzleY, this._pieceWidth, this._pieceHeight);
            this._ctx.strokeRect(piece.inPuzzleX, piece.inPuzzleY, this._pieceWidth, this._pieceHeight);
        }
    },
    touchEndHandler: function () {
        this._canvas.ontouchmove = null;
        this._canvas.ontouchend = null;

        if (this._candidateToSwap !== null) {
            this.swapPieces();
            if (this.checkResult()) {
                this.gameOver();
            }

        }

        this._ctx.clearRect(0, 0, this._width, this._height);
        for (let piece of this._puzzlePieces) {
            this._ctx.drawImage(this._sourceImage, piece.x, piece.y, this._originalPieceWidth, this._originalPieceHeight, piece.inPuzzleX, piece.inPuzzleY, this._pieceWidth, this._pieceHeight);
            this._ctx.strokeRect(piece.inPuzzleX, piece.inPuzzleY, this._pieceWidth, this._pieceHeight);
        }
    },
    getPieceClickedOrTouched: function () {
        //console.log(this._pointer);
        for (let piece of this._puzzlePieces) {
            //console.log("Cur piece " + piece.inPuzzleX + " " + piece.inPuzzleY);
            if (this._pointer.x >= piece.inPuzzleX && this._pointer.x <= (piece.inPuzzleX + this._pieceWidth) && this._pointer.y >= piece.inPuzzleY && this._pointer.y <= (piece.inPuzzleY + this._pieceHeight)) {
                return piece;
            }
        }
        return null;
    },
    setPieceToPointer: function () {
        this._ctx.clearRect(this._pieceInUse.inPuzzleX, this._pieceInUse.inPuzzleY, this._pieceWidth, this._pieceHeight);
        this._ctx.save();
        this._ctx.drawImage(this._sourceImage, this._pieceInUse.x, this._pieceInUse.y, this._originalPieceWidth, this._originalPieceHeight, this._pointer.x - Math.round(this._pieceWidth / 2), this._pointer.y - Math.round(this._pieceHeight / 2), this._pieceWidth, this._pieceHeight);
        this._ctx.restore();
        //this._ctx.strokeRect(this._pointer.x - Math.round(this._pieceWidth / 2), this._pointer.y - Math.round(this._pieceHeight / 2), this._pieceWidth, this._pieceHeight);
    },
    dragPiece: function () {
        this._candidateToSwap = null;
        this._ctx.clearRect(0, 0, this._width, this._height);
        for (let piece of this._puzzlePieces) {
            if (piece !== this._pieceInUse) {
                this._ctx.drawImage(this._sourceImage, piece.x, piece.y, this._originalPieceWidth, this._originalPieceHeight, piece.inPuzzleX, piece.inPuzzleY, this._pieceWidth, this._pieceHeight);
                this._ctx.strokeRect(piece.inPuzzleX, piece.inPuzzleY, this._pieceWidth, this._pieceHeight);
                if (this._candidateToSwap === null) {
                    if (this.isItOverThisPiece(piece)) {
                        this._candidateToSwap = piece;
                    }
                }
            }
        }
        this._ctx.save();
        this._ctx.drawImage(this._sourceImage, this._pieceInUse.x, this._pieceInUse.y, this._originalPieceWidth, this._originalPieceHeight, this._pointer.x - Math.round(this._pieceWidth / 2), this._pointer.y - Math.round(this._pieceHeight / 2), this._pieceWidth, this._pieceHeight);
        this._ctx.restore();
        this._ctx.strokeRect(this._pointer.x - Math.round(this._pieceWidth / 2), this._pointer.y - Math.round(this._pieceHeight / 2), this._pieceWidth, this._pieceHeight);

    },
    isItOverThisPiece: function (piece) {
        if (this._pointer.x >= piece.inPuzzleX && this._pointer.x <= (piece.inPuzzleX + this._pieceWidth) && this._pointer.y >= piece.inPuzzleY && this._pointer.y <= (piece.inPuzzleY + this._pieceHeight)) {
            return true;
        }
        return false;
    },
    swapPieces: function () {
        //console.log(this._candidateToSwap);
        if (this._candidateToSwap !== null) {
            var tmp = {
                inPuzzleX: this._pieceInUse.inPuzzleX,
                inPuzzleY: this._pieceInUse.inPuzzleY
            };
            this._pieceInUse.inPuzzleX = this._candidateToSwap.inPuzzleX;
            this._pieceInUse.inPuzzleY = this._candidateToSwap.inPuzzleY;
            this._candidateToSwap.inPuzzleX = tmp.inPuzzleX;
            this._candidateToSwap.inPuzzleY = tmp.inPuzzleY;
        }
        //console.log(this._candidateToSwap);
    },
    addSidebarWithCounter: function () {
        var parentNode = document.createElement('div');
        parentNode.setAttribute('class', 'sidebar');
        parentNode.style.height = this._height + "px";
        var childNode = document.createElement('div');
        childNode.setAttribute('class', 'close-btn');
        var btnImg = document.createElement('img');
        btnImg.setAttribute('src', './img/cancel_button.png');
        childNode.appendChild(btnImg);
        parentNode.appendChild(childNode);
        childNode = document.createElement('div');
        childNode.setAttribute('class', 'counter');
        var childNodeInner = document.createElement('div');
        childNodeInner.setAttribute('class', 'progress');
        childNodeInner.setAttribute('id', 'progress');
        var textCounter = document.createElement('span');
        textCounter.innerText = "";
        textCounter.setAttribute('id', 'counter');
        childNodeInner.appendChild(textCounter);
        childNode.appendChild(childNodeInner);
        parentNode.appendChild(childNode);

        document.body.insertBefore(parentNode, document.body.firstChild);
        setTimeout(function () {

            this.startGameCounter();
        }.bind(this), 1000);
    },
    startGameCounter: function () {
        var counter = document.getElementById("counter");

        var timer = 21;
        var progress = document.getElementById("progress");
        progress.classList += " counter-anim";
        var timer_id = setInterval(function () {
            counter.innerText = timer;
            if (timer === 0) {
                clearInterval(timer_id);
                progress.style.height = "0";
                this.gameOver();
                return;
            }

            timer--;

        }.bind(this), 1000);
    },
    gameOver: function () {
        this._canvas.ontouchstart = null;
        this._canvas.ontouchmove = null;
        this._canvas.ontouchend = null;
        this._canvas.onmousedown = null;
        this._canvas.onmousemove = null;
        this._canvas.onmouseup = null;
    },
    checkResult: function () {
        console.log(this._puzzlePieces);
        var solved = true;
        for (let i = 0; i < this._puzzlePieces.length; ++i) {
            if (this._puzzlePieces[i].startX!==this._puzzlePieces[i].inPuzzleX || this._puzzlePieces[i.startY !== this._puzzlePieces[i].inPuzzleY]) {
                solved = false;
                break;
            }
        }
        return solved;
    }

}

Array.prototype.shuffle = function () {
    var data = this;
    for (let i = 0; i < data.length; ++i) {
        let rng = Math.round(Math.random() * (i + 1));
        let temp = data[rng];
        data[rng] = data[i];
        data[i] = temp;
    }
}