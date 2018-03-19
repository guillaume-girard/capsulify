/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * Guillaume G. wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return.
 * Guillaume G.
 * ----------------------------------------------------------------------------
 * Helped by:
 * Close Pixelate v2.0.00 beta (http://desandro.com/resources/close-pixelate/)
 * By John Schulz (http://twitter.com/jfsiii) & David DeSandro (http://desandro.com)
 * Under MIT Licence.
 */
"use strict";

(function() {
    /*
     * CONSTANTES
     */
    const AVAILABLE_COLORS_OBJECT_PICKED = [
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
    
    const TWO_PI = Math.PI * 2;
    const DIAMETRE_CAPSULE_MM = 26;
    
    /*
     * UTILITY FUNCTIONS
     */
    function getClosestColor(color) {
        var r = color.red;
        var g = color.green;
        var b = color.blue;
        
        var colors = AVAILABLE_COLORS_OBJECT_PICKED;
        
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
    };
    
    function nextY(oldY, radius) {
        return oldY + Math.sqrt((Math.pow(2*radius, 2)) - Math.pow(radius, 2));
    };
    
    /*
     * CLASSES
     */
    class Logger {
        constructor(htmlElement) {
            this.element = htmlElement;
            this.content = htmlElement.innerHTML;
            this.text = htmlElement.innerText;
        };
        
        info(message) {
            this.content += "<p class='info'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        };
        
        success(message) {
            this.content += "<p class='success'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        };
        
        warning(message) {
            this.content += "<p class='warning'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        };
        
        error(message) {
            this.content += "<p class='error'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        };
        
        refresh() {
            this.element.innerHTML = this.content;
            this.element.scrollTop = this.element.scrollTopMax;
        };
    };
    
    class Capsulificator {
        constructor(image) {
            this.image = image;
            this.workWidth = null;
            this.workHeight = null;
            this.workOpacity = null;
            this.backgroundWidth = null;
            this.backgroundHeight = null;
            this.backgroundColor = null;
            this.capsAlignment = null;
            this.points = [];
        };
        
        computeFormValues(formElements) {
            this.workWidth = formElements["workWidth"].value || this.image.width;
            this.workHeight = formElements["workHeight"].value || this.image.height;
            this.workOpacity = formElements["workOpacity"].value || 30;
            this.backgroundWidth = formElements["bgWidth"].value || this.workWidth;
            this.backgroundHeight = formElements["bgHeight"].value || this.workHeight;
            this.backgroundColor = Color.parseHexa(formElements["bgColor"].value) || Color.parseHexa("#A4825B");
            // Force background to be at least the size of the working area
            this.backgroundWidth = this.backgroundWidth < this.workWidth ? this.workWidth : this.backgroundWidth;
            this.backgroundHeight = this.backgroundHeight < this.workHeight ? this.workHeight : this.backgroundHeight;

            this.capsAlignment = formElements["caps-alignment"].value;
            if (this.capsAlignment !== "row-quinconce") {
                logger.warning("\"" + this.capsAlignment + "\" alignment selected. Sorry but I don't give a damn. It will be row-quinconce. Kiss you.");
            }
        }
    };
    
    class Image {
        constructor() {
            this.image = null;
            this.name = null;
            this.width = null;
            this.height = null;
            this.data = null;
        };
        
        computeData(image) {
            this.image = image;
            this.width = image.naturalWidth;
            this.height = image.naturalHeight;
            
            var canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this.image, 0, 0, this.width, this.height);
            
            this.data = ctx.getImageData(0, 0, this.width, this.height).data;
            ctx.clearRect(0, 0, this.width, this.height);
            
            canvas.remove();
        }
    };
    
    class Point {
        constructor() {
            this.x = null;
            this.y = null;
            this.initialColor = null;
        };
    };
    
    class Color {
        constructor(red, green, blue, alpha) {
            this.red = red || 0;
            this.green = green || 0;
            this.blue = blue || 0;
            this.alpha = alpha || 1;
        };
        
        get_rgb() {
            return "rgb(" + 
                    this.red + "," + 
                    this.green + "," + 
                    this.blue + 
                    ")";
        }
        
        get_rgba() {
            return "rgba(" + 
                    this.red + "," + 
                    this.green + "," + 
                    this.blue + "," + 
                    this.alpha + 
                    ")";
        }
        
        static parseHexa(hexa) {
            var cutted = hexa[0] === "#" ? hexa.slice(1) : hexa;
            if (cutted.length !== 6) {
                return null;
            } else {
                var red = parseInt(cutted.slice(0, 2), 16);
                var green = parseInt(cutted.slice(2, 4), 16);
                var blue = parseInt(cutted.slice(4, 6), 16);
                return new Color(red, green, blue);
            }
        }
    };
    
    class Caps {
        constructor() {
            this.image = null;
            this.averageColor = null;
            this.pickedColor = null;
        };
    };
    
    /*
    function followCursor(event) {
        var x = event.layerX;
        var y = event.layerY;
        var animatedCursor = document.getElementById("cursor-animation");
        animatedCursor.style.top = y + "px";
        animatedCursor.style.left = x + "px";
    }*/

    document.addEventListener("DOMContentLoaded", function(event) {
        var fileInput = document.getElementById("input-image-file");
        var imageReceiver = document.getElementById("input-image-receiver");
        var formCapsulify = document.getElementById("form-capsulify");
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        var logger = new Logger(document.getElementById("console"));
        var oImage = new Image();
        var oCapsulificator = new Capsulificator(oImage);
        
        /*
        canvas.addEventListener("mouseenter", function(event) {
            this.addEventListener("mousemove", followCursor, false);
        }, false);
        canvas.addEventListener("mouseleave", function(event) {
            this.removeEventListener("mousemove", followCursor, false);
        }, false);*/
        
        // Handle load event on image
        imageReceiver.addEventListener('load', function(evt) {
            oImage.computeData(this);
            formCapsulify.className = "show";
        }, false);
        
        // Handle event change on the file input
        fileInput.addEventListener("change", function(evt) {
            var file = this.files[0];
            var fileName = file.name;
            // @todo Should verify file type
            
            var reader = new FileReader();
            // Waiting image data to be loaded before creating the image object
            reader.addEventListener("load", function (evt) {
                imageReceiver.src = evt.target.result;
                imageReceiver.alt = fileName;
            }, false);
            reader.readAsDataURL(file);
        }, false);
        
        // Handle Capsulify Form submit event
        formCapsulify.addEventListener("submit", function(evt) {
            // Prevent default submit (redirect to same page)
            evt.preventDefault();
            evt.stopPropagation();
            
            logger.info("Init capsulification...");
            
            // Get form input values
            oCapsulificator.computeFormValues(this.elements);
            
            // Compute resolution depending on the ratio imageSize/workSize
            var res, ratio;
            var ratioX = oCapsulificator.workWidth / oImage.width;
            var ratioY = oCapsulificator.workHeight / oImage.height;
            ratio = Math.min(ratioX, ratioY);
            
            if (ratioX <= ratioY) {
                logger.info("Image will be displayed in width");
                // On prend en fonction de la largeur
                var maxCapsWidth = Math.floor(oCapsulificator.workWidth / DIAMETRE_CAPSULE_MM);
                res = oImage.width / maxCapsWidth;
            } else {
                logger.info("Image will be displayed in height");
                // On prend en fonction de la hauteur
                var maxCapsHeight = Math.floor(oCapsulificator.workHeight / DIAMETRE_CAPSULE_MM);
                res = oImage.height / maxCapsHeight;
            }
    
            var mmLeftWidth = oCapsulificator.workWidth % DIAMETRE_CAPSULE_MM;
            var mmLeftHeight = mmLeftWidth; // faire calcul en quinconce
            var decalX = (mmLeftWidth / DIAMETRE_CAPSULE_MM * res) / 2;
            var decalY = (mmLeftHeight / DIAMETRE_CAPSULE_MM * res) / 2;
            
            // Calcul des nouvelles dimensions avec zone de travail et arriere plan
            var heightWork = oCapsulificator.workHeight / ratio;
            var widthWork = oCapsulificator.workWidth / ratio;
            var heightBackground = heightWork + 70;
            var widthBackground = widthWork + 120;
            
            canvas.height = heightBackground;
            canvas.width = widthBackground;
            
            decalX += 50; // bullshit
            decalY += 30; // bullshit
            
            logger.info("Init printing of caps...");
            // Actual print on the canvas
            ctx.clearRect(0, 0, widthBackground, heightBackground);
            ctx.fillStyle = oCapsulificator.backgroundColor.get_rgb();
            ctx.fillRect(0, 0, widthBackground, heightBackground);
            
            // Print de chaque capsule
            var w, h, x, y, pixelY, pixelX, pixelIndex, yCounter, capsCounter;
            w = oImage.width;
            h = oImage.height;
            
            // premier point, au centre de la capsule
            x = res / 2;
            y = res / 2;
            yCounter = capsCounter = 0;
            
            while (y < h) {
                pixelY = Math.floor(Math.max(Math.min(y, h - 1), 0));
                
                while (x + res / 2 < w) {
                    // On retrouve la couleur du pixel courant
                    pixelX = Math.floor(Math.max(Math.min(x, w - 1), 0));
                    pixelIndex = (pixelX + pixelY * w) * 4;
                    
                    var red = oImage.data[ pixelIndex + 0 ];
                    var green = oImage.data[ pixelIndex + 1 ];
                    var blue = oImage.data[ pixelIndex + 2 ];
                    var alpha = oImage.data[ pixelIndex + 3 ] / 255; // useless
                    
                    var colorObj = {
                        red: red,
                        green: green,
                        blue: blue
                    };
                    
                    var closestColor = getClosestColor(colorObj);
                    var img = document.createElement("img");
                    img.alt = closestColor.name;

                    var centerX = x + decalX;
                    var centerY = y + decalY;

                    var bindObject = {
                        img: img,
                        radius: res / 2,
                        centerX: centerX,
                        centerY: centerY,
                        imageX: centerX - res / 2,
                        imageY: centerY- res / 2
                    };
                    img.addEventListener("load", function() {
                        ctx.save();
                        ctx.beginPath(); // si on met pas ça ça fait des trucs chelous au moment du clip()
                            ctx.arc(this.centerX, this.centerY, this.radius, 0, TWO_PI, true);
                            ctx.clip();
                            ctx.drawImage(this.img, this.imageX, this.imageY, res, res);
                        ctx.restore();
                    }.bind(bindObject), false);
                        
                    img.src = "img/capsules/" + closestColor.name + ".jpg";
                    
                    capsCounter++;
                    x += res;
                }
                yCounter++;
                
                y = nextY(y, res / 2);
                if (yCounter % 2 === 0) {
                    // Ligne paire
                    x = res / 2;
                } else {
                    // Ligne impaire, on décale
                    x = res;
                }
            }
            
            logger.info("Total caps: " + capsCounter);
            
            // Print de la zone de travail en defer pour être par dessus les capsules
            // mais c'est de la merde, faut faire un truc pour attendre que toutes
            // les capsules soient print
            setTimeout(function() {
                ctx.fillStyle = (new Color(0, 0, 0, oCapsulificator.workOpacity / 100)).get_rgba();
                ctx.fillRect(50, 30, widthWork, heightWork);
            }, 500);
            
        }, false);
        
        (function(){var k,p;k=[38,38,40,40,37,39,37,39,66,65];p=0;document.addEventListener('keydown',function(e){if(e.keyCode==k[p]){p++;if(p==10){logger.info("Konami code. Bravo.");p=0;}}else{p=0;}});})();
    }, false);
})();

