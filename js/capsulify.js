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
    }
    
    function nextY(oldY, radius) {
        return oldY + Math.sqrt((Math.pow(2*radius, 2)) - Math.pow(radius, 2));
    }
    
    class Logger {
        constructor(htmlElement) {
            this.element = htmlElement;
            this.content = htmlElement.innerHTML;
            this.text = htmlElement.innerText;
        }
        
        info(message) {
            this.content += "<p class='info'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        }
        
        success(message) {
            this.content += "<p class='success'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        }
        
        warning(message) {
            this.content += "<p class='warning'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        }
        
        error(message) {
            this.content += "<p class='error'><span>&gt;</span>" + message + "<p>";
            this.refresh();
        }
        
        refresh() {
            this.element.innerHTML = this.content;
            this.element.scrollTop = this.element.scrollTopMax;
        }
    }
    
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
        
        /*
        canvas.addEventListener("mouseenter", function(event) {
            this.addEventListener("mousemove", followCursor, false);
        }, false);
        canvas.addEventListener("mouseleave", function(event) {
            this.removeEventListener("mousemove", followCursor, false);
        }, false);*/
        
        // Handle event change on the file input
        fileInput.addEventListener("change", function(evt) {
            var file = this.files[0];
            var fileName = file.name;
            // @todo Should verify file type
            
            var reader = new FileReader();
            // Waiting for the image to be load before showing the form
            reader.onload = (function (img) {
                return function (e) {
                    img.src = e.target.result;
                    img.alt = fileName;
                    formCapsulify.className = "show";
                    logger.success("Image loaded: " + fileName);
                };
            })(imageReceiver);
            reader.readAsDataURL(file);
        }, false);
        
        // Handle Capsulify Form submit event
        formCapsulify.addEventListener("submit", function(evt) {
            // Prevent default submit (redirect to same page)
            evt.preventDefault();
            evt.stopPropagation();
            
            logger.info("Init capsulification...");
            
            // Compute image size
            var imageHeight = imageReceiver.naturalHeight;
            var imageWidth = imageReceiver.naturalWidth;
            
            // Get form input values
            var bgWidth, bgHeight, bgColor, workWidth, workHeight, workOpacity;
            var formElements = this.elements;
            workWidth = formElements["workWidth"].value || imageWidth;
            workHeight = formElements["workHeight"].value || imageHeight;
            workOpacity = formElements["workOpacity"].value || 30;
            bgWidth = formElements["bgWidth"].value || workWidth;
            bgHeight = formElements["bgHeight"].value || workHeight;
            bgColor = formElements["bgColor"].value || "#A4825B";
            // Force background to be at least the size of the working area
            bgWidth = bgWidth < workWidth ? workWidth : bgWidth;
            bgHeight = bgHeight < workHeight ? workHeight : bgHeight;
            
            // Retrieve imageData from the input file
            canvas.height = imageHeight;
            canvas.width = imageWidth;
            ctx.drawImage(imageReceiver, 0, 0, imageWidth, imageHeight);
            var imgData = ctx.getImageData(0, 0, imageWidth, imageHeight).data;
            ctx.clearRect(0, 0, imageWidth, imageHeight); // instant clear: we don't give a shit about displaying the image here
            logger.info("Image data retrieved...");
            
            // Compute resolution depending on the ratio imageSize/workSize
            var res, ratio;
            var ratioX = workWidth / imageWidth;
            var ratioY = workHeight / imageHeight;
            ratio = Math.min(ratioX, ratioY);
            
            if (ratioX <= ratioY) {
                logger.info("Image will be displayed in width");
                // On prend en fonction de la largeur
                var maxCapsWidth = Math.floor(workWidth / DIAMETRE_CAPSULE_MM);
                res = imageWidth / maxCapsWidth;
            } else {
                logger.info("Image will be displayed in height");
                // On prend en fonction de la hauteur
                var maxCapsHeight = Math.floor(workHeight / DIAMETRE_CAPSULE_MM);
                res = imageHeight / maxCapsHeight;
            }
    
            var mmLeftWidth = workWidth % DIAMETRE_CAPSULE_MM;
            var mmLeftHeight = mmLeftWidth; // faire calcul en quinconce
            var decalX = (mmLeftWidth / DIAMETRE_CAPSULE_MM * res) / 2;
            var decalY = (mmLeftHeight / DIAMETRE_CAPSULE_MM * res) / 2;
            
            // Calcul des nouvelles dimensions avec zone de travail et arriere plan
            var heightWork = workHeight / ratio;
            var widthWork = workWidth / ratio;
            var heightBackground = heightWork + 70;
            var widthBackground = widthWork + 120;
            
            canvas.height = heightBackground;
            canvas.width = widthBackground;
            
            decalX += 50; // bullshit
            decalY += 30; // bullshit
            
            // Couleur de la zone de travail et de l'arriere plan
            var colorBackground = bgColor;
            var colorWork = "rgba(0, 0, 0, " + workOpacity / 100 + ")";
            
            logger.info("Init printing of caps...")
            // Actual print on the canvas
            ctx.clearRect(0, 0, widthBackground, heightBackground);
            ctx.fillStyle = colorBackground;
            ctx.fillRect(0, 0, widthBackground, heightBackground);
            
            // Print de chaque capsule
            var w, h, x, y, pixelY, pixelX, pixelIndex, yCounter, capsCounter;
            w = imageWidth;
            h = imageHeight;
            
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
                    
                    var red = imgData[ pixelIndex + 0 ];
                    var green = imgData[ pixelIndex + 1 ];
                    var blue = imgData[ pixelIndex + 2 ];
                    var alpha = imgData[ pixelIndex + 3 ] / 255; // useless
                    
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
                ctx.fillStyle = colorWork;
                ctx.fillRect(50, 30, widthWork, heightWork);
            }, 500);
            
        }, false);
    }, false);
})();

