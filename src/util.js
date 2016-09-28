/** 
 * @namespace Holds utility functions.
 */
$.Util = {};

$.Util._random = 481731;

/**
 * Linear congruential generator algorithm with a fixed seed. Gives the appearance
 * of being random but always generates the numbers in the same sequence. This has
 * been done deliberately.
 */
$.Util.random = function(n) {
  this._random = (this._random * 1664525 + 1013904223) & 0xFFFFFFFF;
  return (this._random % n);
};

/**
 * Draws a filled circle of the given diameter. 
 *
 * @param {Object} ctx The 2D canvas context to draw the filled circle on.
 * @param {number} x The x position of the filled circle.
 * @param {number} y The y position of the filled circle.
 * @param {number} d The diameter of the filled circle.
 */
$.Util.fillCircle = function(ctx, x, y, d, colour) {
  var r = d / 2;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
};

/**
 * Utility function for obtaining a 2D canvas from a newly created canvas of the 
 * given width and height.
 *  
 * @param {number} w The width of the canvas.
 * @param {number} h The height of the canvas.
 */
$.Util.create2dContext = function(w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h || w;
  return (canvas.getContext('2d'));
};

/**
 * Renders a sphere with eyes.
 * 
 * @param {number} size
 * @param {number} direction
 * @param {string} colour
 * @param {number} texture
 * @param {string} eye
 */
$.Util.renderSphere = function(size, direction, colour, texture, eye, sclera) {
  var ctx = $.Util.create2dContext(size, size);
  
  // Draw the sphere itself. The colour determines the base colour of the
  // sphere. It is filled with a radial gradient so as to appear spherical.
  var cx = size / 2;
  var cy = size / 10;
  var grd = ctx.createRadialGradient(cx, cy, size/10, cx, cy, size * 0.95);
  grd.addColorStop(0, colour);
  grd.addColorStop(1, '#000000');
  ctx.fillStyle = grd;
  $.Util.fillCircle(ctx, 0, 0, size);
  
  // If the texture parameter is defined, it is used randomly adjust ever
  // pixel in the drawn sphere. The texture value is either multiplied with
  // the rgb components, or it the rgb components are divided by it. This
  // adjusts the brightness of the colour and creates a textured or speckled
  // look.
  if (texture) {
    var imgData = ctx.getImageData(0, 0, size, size);
    for (var i=0; i<imgData.data.length; i+=4) {
      if (Math.random() < 0.5) {
        imgData.data[i]=Math.floor(imgData.data[i] * texture);
        imgData.data[i+1]=Math.floor(imgData.data[i+1] * texture);
        imgData.data[i+2]=Math.floor(imgData.data[i+2] * texture);
      } else {
        imgData.data[i]=Math.floor(imgData.data[i] / texture);
        imgData.data[i+1]=Math.floor(imgData.data[i+1] / texture);
        imgData.data[i+2]=Math.floor(imgData.data[i+2] / texture);
      }
    }
    ctx.putImageData(imgData,0,0);
  }
  
  var eyeFactor = size / 50;
  
  // Draw left eye.
  if ((direction == 4) || (direction == 1)) {
    ctx.fillStyle=(sclera || "orange");
    $.Util.fillCircle(ctx, 8 * eyeFactor, 12 * eyeFactor, 13 * eyeFactor);
    ctx.fillStyle=(eye || colour);
    $.Util.fillCircle(ctx, 10 * eyeFactor, 14 * eyeFactor, 9 * eyeFactor);
  }
  
  // Draw right eye.
  if ((direction == 4) || (direction == 2)) {
    ctx.fillStyle=(sclera || "orange");
    $.Util.fillCircle(ctx, 29 * eyeFactor, 12 * eyeFactor, 13 * eyeFactor);
    ctx.fillStyle=(eye || colour);
    $.Util.fillCircle(ctx, 31 * eyeFactor, 14 * eyeFactor, 9 * eyeFactor);
  }
  
  return ctx.canvas;
};
