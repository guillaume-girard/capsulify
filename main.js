/*
 * Original script: 
 * Close Pixelate v2.0.00 beta
 * http://desandro.com/resources/close-pixelate/
 * 
 * Developed by
 * - David DeSandro  http://desandro.com
 * - John Schulz  http://twitter.com/jfsiii
 * 
 * Licensed under MIT license
 */

/*jshint asi: true, browser: true, eqeqeq: true, forin: false, immed: false, newcap: true, noempty: true, strict: true, undef: true */

/* global canvas, HTMLImageElement */

(function (window, undefined) {
    'use strict';

    // util vars
    var TWO_PI = Math.PI * 2;
    var QUARTER_PI = Math.PI * 0.25;
    var DIAMETRE_CAPSULE_MM = 26;
    var AVAILABLE_COLORS = [
        "rgba(140,132,133,255)",    // kro (blanc)
        "rgba(72,83,114,255)",      // 1664 (bleu)
        "rgba(159,153,122,255)",    // leffe (dorée)
        "rgba(175,172,127,255)",    // triple karmeliet (jaune)
        "rgba(185,171,39,255)",     // chouffe jaune
        "rgba(177,117,51,255)",     // chouffe orange
        "rgba(67,102,99,255)",      // carlsberg (vert)
        "rgba(80,77,67,255)",       // guiness (noir)
        "rgba(173,183,153,255)",    // heineken (argent)
        "rgba(236,208,210,255)",    // 33 (blanc)
        "rgba(191,79,76,255)",      // pelforth (rouge)
        "rgba(129,146,120,255)"     // heineken (verte)
    ];
    var AVAILABLE_COLORS_OBJECT = [
        {name: "kro", red: 140, green: 132, blue: 133},    // kro (blanc)
        {name: "1664", red: 72, green: 83, blue: 114},      // 1664 (bleu)
        {name: "leffe", red: 159, green: 153, blue: 122},    // leffe (dorée)
        {name: "triple-karmeliet", red: 175, green: 172, blue: 127},    // triple karmeliet (jaune)
        {name: "chouffe-jaune", red: 185, green: 171, blue: 39},     // chouffe jaune
        {name: "chouffe-orange", red: 177, green: 117, blue: 51},     // chouffe orange
        {name: "carlsberg", red: 67, green: 102, blue: 99},      // carlsberg (vert)
        {name: "guiness", red: 80, green: 77, blue: 67},       // guiness (noir)
        {name: "heineken", red: 173, green: 183, blue: 153},    // heineken (argent)
        {name: "33", red: 236, green: 208, blue: 210},    // 33 (blanc)
        {name: "pelforth", red: 191, green: 79, blue: 76},       // pelforth (rouge)
        {name: "heineken-verte", red: 129, green: 146, blue: 120}       // heineken (verte)
    ];
    var AVAILABLE_COLORS_OBJECT_PICKED = [
        {name: "kro", red: 243, green: 251, blue: 254},    // kro (blanc)
        {name: "1664", red: 84, green: 103, blue: 143},      // 1664 (bleu)
        {name: "leffe", red: 209, green: 204, blue: 149},    // leffe (dorée)
        {name: "triple-karmeliet", red: 231, green: 234, blue: 179},    // triple karmeliet (jaune)
        {name: "chouffe-jaune", red: 255, green: 249, blue: 17},     // chouffe jaune
        {name: "chouffe-orange", red: 237, green: 154, blue: 36},     // chouffe orange
        {name: "carlsberg", red: 72, green: 108, blue: 94},      // carlsberg (vert)
        {name: "guiness", red: 34, green: 32, blue: 35},       // guiness (noir)
        {name: "heineken", red: 220, green: 226, blue: 216},    // heineken (argent)
        {name: "33", red: 255, green: 255, blue: 255},    // 33 (blanc)
        {name: "pelforth", red: 216, green: 62, blue: 60},       // pelforth (rouge)
        {name: "heineken-verte", red: 39, green: 108, blue: 53}       // heineken (verte)
    ];

    // utility functions
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }

    function isObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]";
    }
    
    function nextY(oldY, radius) {
        return oldY + Math.sqrt((Math.pow(2*radius, 2)) - Math.pow(radius, 2));
    }

    var console = window.console;

    // check for canvas support
    var canvas = document.createElement('canvas');
    var isCanvasSupported = canvas.getContext && canvas.getContext('2d');

    // don't proceed if canvas is no supported
    if (!isCanvasSupported) {
        return;
    }

    function getClosestColor(color, pickedColor) {
        var r = color.red;
        var g = color.green;
        var b = color.blue;
        
        var colors = pickedColor ? AVAILABLE_COLORS_OBJECT_PICKED : AVAILABLE_COLORS_OBJECT;
        
        var closestColor = null;
        var minDiff = null;
        
        for (var i = 0 ; i < colors.length ; i++) {
            var colorToTest = colors[i];
            var diffRed, diffGreen, diffBlue, totalDiff;
            
            diffRed = Math.pow(r - colorToTest.red, 2);
            diffGreen = Math.pow(g - colorToTest.green, 2);
            diffBlue = Math.pow(b - colorToTest.blue, 2);
            totalDiff = diffRed + diffGreen + diffBlue;
            
            if (minDiff === null || totalDiff < minDiff) {
                closestColor = colorToTest;
                minDiff = totalDiff;
            }
        }

        return closestColor;
    }
    
    function getClosestColorRGB(color, pickedColor) {
        var closestColor = getClosestColor(color, pickedColor);
        var colorRGB = "rgb(" + closestColor.red + "," + closestColor.green +  "," + closestColor.blue + ")";
        return colorRGB;
    }

    function ClosePixelation(img, options) {
        this.img = img;
        
        // creat canvas
        var canvas = this.canvas = document.createElement('canvas');
        this.ctx = canvas.getContext('2d');
        // copy attributes from img to canvas
        canvas.className = img.className;
        canvas.id = img.id;

        this.render(options);

        // replace image with canvas
        img.parentNode.replaceChild(canvas, img);
//        document.body.appendChild(canvas);
    }
    
    function getAverageColor(imgData) {
        var totalRed, totalGreen, totalBlue, totalAlpha, nbColors;
        totalRed = totalGreen = totalBlue = totalAlpha = nbColors = 0;
        
        for (var i = 0; i < imgData.length; i += 4) {
            var pixelRed = imgData[i];
            var pixelGreen = imgData[i + 1];
            var pixelBlue = imgData[i + 2];
            var pixelAlpha = imgData[i + 3];
            
            // Si le pixel est visible
            if (pixelAlpha > 0) {
                totalRed += pixelRed;
                totalGreen += pixelGreen;
                totalBlue += pixelBlue;
                totalAlpha += pixelAlpha;
                nbColors++;
            }
        }
            
        var averageColor = [
            Math.round(totalRed / nbColors),
            Math.round(totalGreen / nbColors),
            Math.round(totalBlue / nbColors),
            Math.round(totalAlpha / nbColors)
        ];
        
        return averageColor;
    }
    
    function getAverageColorInCircle(imgData, img) {
        var width = img.width;
        var height = img.height;
        var radius = Math.min(width, height) / 2;
        var centerX = width / 2;
        var centerY = height / 2;
        
        var totalRed, totalGreen, totalBlue, totalAlpha, nbColors;
        totalRed = totalGreen = totalBlue = totalAlpha = nbColors = 0;
        
        for (var i = 0; i < height ; i++) {
            for (var j = 0 ; j < width ; j++) {
                var distance = Math.sqrt(Math.pow((centerX - j), 2) + Math.pow(centerY - i, 2));
                if (distance <= radius) {
                    var pixelIndex = (width * i + j) * 4;
                    var pixelRed = imgData[pixelIndex];
                    var pixelGreen = imgData[pixelIndex + 1];
                    var pixelBlue = imgData[pixelIndex + 2];
                    var pixelAlpha = imgData[pixelIndex + 3];
                    
                    // Si le pixel est visible
                    if (pixelAlpha > 0) {
                        totalRed += pixelRed;
                        totalGreen += pixelGreen;
                        totalBlue += pixelBlue;
                        totalAlpha += pixelAlpha;
                        nbColors++;
                    }
                }
            }
        }
        
        var averageColor = [
            Math.round(totalRed / nbColors),
            Math.round(totalGreen / nbColors),
            Math.round(totalBlue / nbColors),
            Math.round(totalAlpha / nbColors)
        ];
        
        return averageColor;
    }

    ClosePixelation.prototype.render = function (options) {
        this.options = options;
        // set size
        var w = this.width = this.canvas.width = this.img.width;
        var h = this.height = this.canvas.height = this.img.height;
        // draw image on canvas
        this.ctx.drawImage(this.img, 0, 0);

        // get imageData
        try {
            this.imgData = this.ctx.getImageData(0, 0, w, h).data;
        } catch (error) {
            if (console) {
                console.error(error);
            }
            return;
        }
        
//        var avgColor = getAverageColor(this.imgData);
//        var avgColorCircled = getAverageColorInCircle(this.imgData, this.img);
////        var avgColorRGBA = "rgba(" + avgColor[0] + ", " + avgColor[1] + ", " + avgColor[2] + ", " + avgColor[3] + ")";
//        var avgColorCircledRGBA = "rgba(" + avgColorCircled.join(",") + ")";
//        document.body.style.backgroundColor = avgColorCircledRGBA;
//        console.log("Average color: ", avgColorCircledRGBA);

        this.ctx.clearRect(0, 0, w, h);

        for (var i = 0, len = options.length; i < len; i++) {
            this.renderClosePixels(options[i]);
        }
    };

    ClosePixelation.prototype.renderClosePixels = function (opts) {
        var w = this.width;
        var h = this.height;
        var ctx = this.ctx;
        var imgData = this.imgData;
        /* Le tableau imgData contient, pour chaque pixel (de gauche à droite et de 
         * haut en bas), les valeurs RED, GREEN, BLUE et ALPHA. Les données sont
         * les unes à la suite des autres, dans un seul tableau. La valeur ALPHA
         * est donnée sur une base de 0 à 255 (et non de 0 à 1). 
         * 
         * Exemple pour une image de 4x4 pixels : 
         * colors = [
         *     Pixel0-0_red, Pixel0-0_green, Pixel0-0_blue, Pixel0-0_alpha,
         *     Pixel0-1_red, Pixel0-1_green, Pixel0-1_blue, Pixel0-1_alpha,
         *     Pixel1-0_red, Pixel1-0_green, Pixel1-0_blue, Pixel1-0_alpha,
         *     Pixel1-1_red, Pixel1-1_green, Pixel1-1_blue, Pixel1-1_alpha
         * ]
         * // colors.length => 16;
         */

        // option defaults
        var res = opts.resolution || 16;
        var size = opts.size || res;
        var alpha = opts.alpha || 1;
        var offset = opts.offset || 0;
        var offsetX = 0;
        var offsetY = 0;
        var cols = w / res + 1;
        var rows = h / res + 1;
        var halfSize = size / 2;
        var diamondSize = size / Math.SQRT2;
        var halfDiamondSize = diamondSize / 2;
        
        // custom opts
        var longueur = opts.longueur;
        var largeur = opts.largeur;
        var nbCapsLongueur = Math.floor(longueur / DIAMETRE_CAPSULE_MM);
        var nbCapsLargeur = Math.floor(largeur / DIAMETRE_CAPSULE_MM);
        var totalCaps = nbCapsLongueur * nbCapsLargeur;
        
        console.log("Normalement : " + nbCapsLongueur + " (longueur), " + nbCapsLargeur + " (largeur). Environ " + totalCaps + " capsules");

        if (isObject(offset)) {
            offsetX = offset.x || 0;
            offsetY = offset.y || 0;
        } else if (isArray(offset)) {
            offsetX = offset[0] || 0;
            offsetY = offset[1] || 0;
        } else {
            offsetX = offsetY = offset;
        }

        var row, col, x, y, oldY, pixelY, pixelX, pixelIndex, red, green, blue, pixelAlpha;
        
        if (opts.shape === 'caps') {
            var yCounter = 0;
            var totalCounter = 0;
            var objectCounter = {};
            x = y = res / 2; // premier point
            
            var pickedColors = opts.pickedColor || false;
            var quinconce = opts.quinconce || false;
            
            while (y < h) {
                pixelY = Math.floor(Math.max(Math.min(y, h - 1), 0));
                var xCounter = 0;
                
                while (x < w) {
                    // On retrouve la couleur du pixel courant
                    pixelX = Math.floor(Math.max(Math.min(x, w - 1), 0));
                    pixelIndex = (pixelX + pixelY * w) * 4;
                    
                    red = imgData[ pixelIndex + 0 ];
                    green = imgData[ pixelIndex + 1 ];
                    blue = imgData[ pixelIndex + 2 ];
                    pixelAlpha = alpha * (imgData[ pixelIndex + 3 ] / 255);
                    
                    var colorObj = {
                        red: red,
                        green: green,
                        blue: blue
                    };

                    if (opts.realCaps) {
                        var closestColor = getClosestColor(colorObj, pickedColors);
                        var img = document.createElement("img");
                        img.alt = closestColor.name;
                        img.src = "img/capsules/" + closestColor.name + ".jpg";
                        
                        if (objectCounter[closestColor.name]) {
                            objectCounter[closestColor.name]++;
                        } else {
                            objectCounter[closestColor.name] = 1;
                        }
                        var radius = res/2;
                        var betterX = x - res / 2;
                        var betterY = y - res / 2;

                        this.ctx.save();
                            this.ctx.beginPath(); // si on met pas ça ça fait des trucs chelous au moment du clip()
                            this.ctx.arc(x, y, radius, 0,  TWO_PI, true);
                            this.ctx.clip();
                            this.ctx.drawImage(img, betterX, betterY, res, res);
                        this.ctx.restore();
                    } else {
                        var fillColor;
                        if (opts.closestColor) {
                            fillColor = getClosestColorRGB(colorObj, pickedColors);
                        } else {
                            fillColor = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha + ')';
                        }
                        ctx.fillStyle = fillColor;

                        // Print du point en x et y définis
                        ctx.beginPath();
                            ctx.arc(x, y, halfSize, 0, TWO_PI, true);
                            ctx.fill();
                        ctx.closePath();
                    }
                    
                    totalCounter++;
                    x += res;
                    xCounter++;
                }
                // Calcul de la prochaine valeur de y
                yCounter++;
                if (quinconce) {
                    y = nextY(y, res / 2);
                    if (yCounter % 2 === 0) {
                        // Ligne paire
                        x = res / 2;
                    } else {
                        // Ligne impaire, on décale
                        x = res;
                    }
                } else {
                    y += res;
                    x = res / 2;
                }
            }
            console.log(xCounter + " (longueur) x " + yCounter + " (largeur). Total : " + totalCounter + " capsules");
            console.log("Capsules: ", objectCounter);
        } else {
            for (row = 0; row < rows; row++) {
                y = (row - 0.5) * res + offsetY;
                // normalize y so shapes around edges get color
                pixelY = Math.max(Math.min(y, h - 1), 0);

                for (col = 0; col < cols; col++) {
                    x = (col - 0.5) * res + offsetX;
                    // normalize x so shapes around edges get color
                    pixelX = Math.max(Math.min(x, w - 1), 0);
                    pixelIndex = (pixelX + pixelY * w) * 4;
                    red = imgData[ pixelIndex + 0 ];
                    green = imgData[ pixelIndex + 1 ];
                    blue = imgData[ pixelIndex + 2 ];
                    pixelAlpha = alpha * (imgData[ pixelIndex + 3 ] / 255);

                    ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha + ')';

                    switch (opts.shape) {
                        case 'circle':
                            ctx.beginPath();
                                ctx.arc(x, y, halfSize, 0, TWO_PI, true);
                                ctx.fill();
                            ctx.closePath();
                            break;
                        case 'diamond':
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate(QUARTER_PI);
                            ctx.fillRect(-halfDiamondSize, -halfDiamondSize, diamondSize, diamondSize);
                            ctx.restore();
                            break;
                        default :
                            // square
                            ctx.fillRect(x - halfSize, y - halfSize, size, size);
                    } // switch
                } // col
            } // row
        }
    };

    // enable img.closePixelate
    HTMLImageElement.prototype.closePixelate = function (options) {
        return new ClosePixelation(this, options);
    };

    // put in global namespace
    window.ClosePixelation = ClosePixelation;

})(window);
