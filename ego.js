/**
 * Creates a new Ego. This is the main character whom the player controls. The
 * name originates with the old Sierra On-Line 3D animated adventure games. There
 * should be only one instance of this class.
 * 
 * @constructor
 */
$.Ego = function() {
  this.reset();
  this.size = $.Constants.CELL_WIDTH - 1;
  this.texture = 0.95;
  this.canvas = this.buildCanvas();
};

/**
 * Resets Ego's state back to the game start state.
 */
$.Ego.prototype.reset = function() {
  this.x = 357;
  this.y = 63;
  this.power = 0;
  this.health = 0;
  this.leftRightVelocity = 0.0;
  this.upDownVelocity = 0.0;
  this.fallingBlocked = false;
  this.direction = 0;
  this.facing = 3;
  this.playerAngle = 0;
  this.jumpHeight = 54;
  this.powerUp(694);
};

/**
 * Builds the background image canvas for the Ego.
 */
$.Ego.prototype.buildCanvas = function() {
  // Create a single canvas to render the sprite sheet for the four directions.
  var ctx = $.Util.create2dContext(this.size * 4, this.size);
  
  for (var f = 0; f < 4; f++) {
    //ctx.drawImage($.Util.renderSphere(this.size, f + 1, 'rgb(197,179,88)', this.texture, 'black'), f * this.size, 0);
    ctx.drawImage($.Util.renderSphere(this.size, f + 1, 'rgb(0,0,0)', this.texture, 'black'), f * this.size, 0);
  }
  
  return ctx.canvas;
};

/**
 * Adjusts the power property by the given amount, which could be either
 * negative or positive. It is invoked whenever Ego's power is set at reset, 
 * and also when Ego is hit by the Glitch.
 * 
 * @param {number} amount The amount to adjust the power by.
 */
$.Ego.prototype.powerUp = function(amount) {
  this.power += amount;
  
  if (this.power < 0) {
    // If the power goes below 0, it is the end of the game.
    this.power = 0;
    $.Game.gameover();
  }
  
  // Removing the style at this point ensures that we clear any previous 
  // transition. We don't what positive changes to use a transition since 
  // the change does't render while the absorb key is pressed down.
  $.power.removeAttribute('style');
  
  if (amount < 0) {
    // If the change was negative, then we apply a CSS transition since the
    // change for a hit is quite larger. This stops the power bar from making
    // quite jarring jumps in value. The transition makes this change smoother.
    $.power.style.transition = 'width 0.5s';
  }
  
  // Adjust the size of the power bar on screen to represent the new power value.
  $.power.style.width = this.power + 'px';
};

/**
 * Draws the main player.
 */
$.Ego.prototype.draw = function() {
  //var diam = $.Constants.CELL_WIDTH - 1; //2;
  //$.Util.fillCircle($.sctx, 0, 0, diam, '#000000');
  $.sctx.drawImage(this.canvas, 
      (this.size * this.facing), 0, this.size, this.size,
      -(this.size/2), -(this.size/2), this.size, this.size);
};

/**
 * Updates Ego for the current frame. Checks the direction keys to see if
 * Ego's direction and movement needs to change. It also handles jumping,
 * firing bullets, and hitting the Glitch.
 */
$.Ego.prototype.update = function() {
  // Handle left & right movement.
  if ($.Game.keys[65]) {
    this.leftRightVelocity = -$.Constants.MAX_HORIZ_VELOCITY;
  } else if ($.Game.keys[68]) {
    this.leftRightVelocity = $.Constants.MAX_HORIZ_VELOCITY;
  } else {
    this.leftRightVelocity = 0;
  }

  // Handle player firing.
  if ($.Game.mouseButton) {
    $.Game.mouseButton = 0;
    
    // Player can only 5 three bullets at once.
    for (var bulletNum = 0; bulletNum < 5; bulletNum++) {
      if ($.Game.bullets[bulletNum] == null) {
        // The player is always in the middle of the window, so we calculate the heading from that point.
        var playerScreenX = (~~($.Constants.WRAP_WIDTH / 2));
        var playerScreenY = (~~($.Constants.WRAP_HEIGHT / 2));
        var bulletHeading = Math.atan2(playerScreenY - $.Game.yMouse, playerScreenX - $.Game.xMouse) + ((($.Game.rotateAngle + 180) % 360) * Math.PI / 180);
        $.Game.bullets[bulletNum] = new $.Bullet(this.x, this.y, bulletHeading);
        $.Sound.play('bomb');
        break;
      }
    }
  }

  // Jump (space bar)
  if ($.Game.keys[32] && (this.jumpHeight < $.Constants.MAX_JUMP_HEIGHT)) {
    // Handle jump. There are multiple levels of jumping. It depends how long
    // the player holds down the up key.
    this.upDownVelocity = -$.Constants.MAX_VERT_VELOCITY;
    this.jumpHeight++;
    
  } else {
    // When not jumping, natural behaviour is to fall (player might be blocked later on though)
    if (!this.fallingBlocked) {
      this.upDownVelocity = $.Constants.MAX_VERT_VELOCITY;
    }

    // Keeping the jump height above 8 when player is falling means that
    // he can't jump up from mid air.
    if ((this.jumpHeight > 0) && (this.jumpHeight < $.Constants.MAX_JUMP_HEIGHT)) {
      this.jumpHeight = 100;
    }
  }

  var velocities = [ this.leftRightVelocity, -this.upDownVelocity, -this.leftRightVelocity, this.upDownVelocity ];

  // Attempt to move.
  var newXPos = this.x + (velocities[this.direction] * $.Game.stepFactor);
  var newYPos = this.y + (velocities[(this.direction + 3) % 4] * $.Game.stepFactor);

  // General block check.
  var bottomRightBlock = $.Map.getBlockAt(newXPos + $.Constants.BLOCK_SIZE, newYPos + $.Constants.BLOCK_SIZE);
  var topRightBlock = $.Map.getBlockAt(newXPos + $.Constants.BLOCK_SIZE, newYPos - $.Constants.BLOCK_SIZE);
  var topLeftBlock = $.Map.getBlockAt(newXPos - $.Constants.BLOCK_SIZE, newYPos - $.Constants.BLOCK_SIZE);
  var bottomLeftBlock = $.Map.getBlockAt(newXPos - $.Constants.BLOCK_SIZE, newYPos + $.Constants.BLOCK_SIZE);
  var blocked = 
      (bottomRightBlock.type == '#') || (topRightBlock.type == '#') || (topLeftBlock.type == '#') || (bottomLeftBlock.type == '#');

  if (blocked) {
    if (this.playerAngle % 180) {
      newYPos = this.y;
    } else {
      newXPos = this.x;
    }

    if (this.upDownVelocity < 0) {
      // Jumping up but blocked, so new Y will be the current Y.
      if (this.playerAngle % 180) {
        newXPos = this.x;
      } else {
        newYPos = this.y;
      }
      this.upDownVelocity = 0;
      this.jumpHeight = 100;
    }
  }

  // Check if it is blocked underneath the player.
  this.fallingBlocked = false;
  switch (this.playerAngle) {
    case 0:  // ^  works
      this.fallingBlocked = $.Map.isBlocked(newXPos - $.Constants.FALL_SIZE, newYPos + $.Constants.FALL_SIZE + 1) || $.Map.isBlocked(newXPos + $.Constants.FALL_SIZE, newYPos + $.Constants.FALL_SIZE + 1);
      break;
    case 90: // >
      this.fallingBlocked = $.Map.isBlocked(newXPos - $.Constants.FALL_SIZE - 1, newYPos - $.Constants.FALL_SIZE) || $.Map.isBlocked(newXPos - $.Constants.FALL_SIZE - 1, newYPos + $.Constants.FALL_SIZE);
      break;
    case 180: // v 
      this.fallingBlocked = $.Map.isBlocked(newXPos - $.Constants.FALL_SIZE, newYPos - $.Constants.FALL_SIZE - 1) || $.Map.isBlocked(newXPos + $.Constants.FALL_SIZE, newYPos - $.Constants.FALL_SIZE - 1);
      break;
    case 270: // <  
      this.fallingBlocked = $.Map.isBlocked(newXPos + $.Constants.FALL_SIZE + 1, newYPos - $.Constants.FALL_SIZE) || $.Map.isBlocked(newXPos + $.Constants.FALL_SIZE + 1, newYPos + $.Constants.FALL_SIZE);
      break;
  }

  // Is the player currently falling?
  if (this.upDownVelocity > 0) {
    if (this.fallingBlocked) {
      if (this.upDownVelocity > 1.0) {
        this.upDownVelocity--;
      } else {
        this.jumpHeight = 0;
        this.upDownVelocity = 0;
      }
      
      if (this.playerAngle % 180) {
        newXPos = this.x;
      } else {
        newYPos = this.y;
      }
      
    } else {
      this.jumpHeight = 100;
    }
  }

  // Apply the new position.
  this.y = newYPos;
  this.x = newXPos;

  // Check the map bounds for wrap around.
  if (this.x < 0) {
    // Increment by width of room in pixels.
    this.x += $.Constants.ROOM_X_PIXELS;
  }
  if (this.y < 0) {
    // Increment by height of room in pixels.
    this.y += $.Constants.ROOM_Y_PIXELS;
  }
  if (this.x >= $.Constants.ROOM_X_PIXELS) {
    // Decrement by width of room in pixels.
    this.x -= $.Constants.ROOM_X_PIXELS;
  }
  if (this.y >= $.Constants.ROOM_Y_PIXELS) {
    // Decrement by height of room in pixels.
    this.y -= $.Constants.ROOM_Y_PIXELS;
  }
  
  // Is the player touching the glitch?
  if ((bottomRightBlock.type == '*') || (topRightBlock.type == '*') || 
      (topLeftBlock.type == '*') || (bottomLeftBlock.type == '*')) {
    // If so, reduce health and play hit noise.
    this.powerUp(-5);
    $.Sound.play('hit');
  }
  
  if (this.leftRightVelocity < 0) {
    this.facing = 0;
  } else if (this.leftRightVelocity > 0) {
    this.facing = 1;
  } else {
    this.facing = 3;
  }
};
