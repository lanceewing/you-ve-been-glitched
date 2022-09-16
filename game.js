/**
 * The is the core Game object that manages the starting of the game loop and the
 * core functions of the game that don't relate directly to an individual game
 * object, such as Ego or an Enemy.
 */
$.Game = {

  // The current input state.
  keys: {},
  oldkeys: {},
  xMouse: 0,
  yMouse: 0,
  mouseButton: 0,
    
  /**
   * The time of the last animation frame. 
   */ 
  lastTime: 0,
  
  /**
   * The time difference between the last animation frame and the current animaton frame.
   */  
  delta: 0,
  
  /**
   * Says whether the game currently has focus or not. Is updated by focus/blur listeners.
   */
  hasFocus: true,
  
  /**
   * Says whether the game is currently paused or not.
   */
  paused: true,
  
  /**
   * Says whether the game loop is currently counting down or not.
   */
  counting: false,
  
  /**
   * Says whether there is a game currently in progress or not.
   */
  running: false,
  
  /**
   * Says whether the start up sequence is currently in progress or not.
   */
  starting: false,
  
  /**
   * The countdown time for when the game unpauses.
   */
  countdown: 0,
  
  /**
   * Keeps track of when the screen should rotate by 90 degress.
   */
  rotateTimer: 0,
  
  /**
   * The start time in milliseconds of the current rotation.
   */
  rotateStartTime: 0,
  
  /**
   * The angle at which the rotation started.
   */
  rotateStartAngle: 0,
  
  /**
   * Whether or not the screen is currently rotating.
   */
  rotating: false,
  
  /**
   * Current angle of rotation of the screen.
   */
  rotateAngle: 0,
  
  /**
   * Holds a reference to all Bullet's on the screen.
   */
  bullets: [],
  
  /**
   * The current number of Enemies on the screen (AKA the "Glitch").
   */
  enemyCount: 0,
  
  /**
   * An key-value map holding all enemies.
   */
  enemyMap: {},
  
  /**
   * The time in milliseconds since the current game started.
   */
  time: 0,
  
  /**
   * The current record time for game completion (like a hi score). Defaults
   * to a second below one hour.
   */
  lowTime: 3599000,
  
  /**
   * Adds the given Enemy to the enemy Map in which we hold all enemies in 
   * the game.
   * 
   * @param {$.Enemy} enemy The Enemy to add to the Game's enemy map.
   */
  addEnemy: function(enemy) {
    if (!this.enemyMap[enemy.key]) {
      this.enemyMap[enemy.key] = enemy;
      this.enemyCount++;
    }
  },
  
  /**
   * Gets the Enemy at the given column and row.
   * 
   * @param {number} col The column to get the Enemy from.
   * @param {number} row The row to get the Enemy from.
   * 
   * @returns {$.Enemy} The Enemy at the given position.
   */
  getEnemy: function(col, row) {
    return this.enemyMap['e_' + (col % 152) + '_' + (row % 104)];
  },
  
  /**
   * Removes the given Enemy from the Game's enemy map.
   * 
   * @param {$.Enemy} enemy The Enemy to remove from the Game's enemy map.
   */
  removeEnemy: function(enemy) {
    if (this.enemyMap[enemy.key]) {
      delete this.enemyMap[enemy.key]; 
      this.enemyCount--;
    }
  },
  
  /**
   * Starts the game. 
   */
  start: function() {
    // Get a reference to each of the elements in the DOM that we'll need to update.
    $.power = document.getElementById('power');
    $.msg1 = document.getElementById('msg1');
    $.msg2 = document.getElementById('msg2');
    $.enemies = document.getElementById('enemies');
    $.time = document.getElementById('time');
    $.lowTime = document.getElementById('lowTime');
    $.wrapper = document.getElementById('wrap');
    
    // Set up the graphics objects we'll need
    $.screen = document.getElementById('s');
    $.sctx = $.screen.getContext('2d');
    $.sctx.imageSmoothingEnabled = false;
    
    // Background canvas, for the rainbow gradient.
    $.background = document.createElement('canvas');
    $.background.width = 152 * $.Constants.CELL_WIDTH * 2;
    $.background.height = 104 * $.Constants.CELL_WIDTH * 2;
    $.bgCtx = $.background.getContext('2d');
    
    // Set up the keyboard & mouse event handlers (size reduced way)
    document.onmousedown = function(e) {
      $.Game.mouseButton = 1;
      e.preventDefault();
    };
    document.onmouseup = function(e) {
      $.Game.mouseButton = 0;
      e.preventDefault();
    };
    document.onmousemove = function(e) {
      $.Game.xMouse = e.pageX - $.wrapper.offsetLeft;
      $.Game.yMouse = e.pageY - $.wrapper.offsetTop;
    };

    // Register the event listeners for handling auto pause when the game loses focus.
    window.addEventListener('blur', function(e) {
      $.Game.hasFocus = false;
    });
    window.addEventListener('focus', function(e) {
      $.Game.hasFocus = true;
    });
    
    this.renderFavicon();
    
    // Draw the colourful rainbow gradient background.
    var grd = $.bgCtx.createLinearGradient(0, 0, 0, $.background.height);
    grd.addColorStop(0, 'red');
    grd.addColorStop(1 / 14, 'orange');
    grd.addColorStop(2 / 14, 'yellow');
    grd.addColorStop(3 / 14, 'green');
    grd.addColorStop(4 / 14, 'blue');
    grd.addColorStop(5 / 14, 'indigo');
    grd.addColorStop(6 / 14, 'violet');
    grd.addColorStop(7 / 14, 'red');
    grd.addColorStop(8 / 14, 'orange');
    grd.addColorStop(9 / 14, 'yellow');
    grd.addColorStop(10 / 14, 'green');
    grd.addColorStop(11 / 14, 'blue');
    grd.addColorStop(12 / 14, 'indigo');
    grd.addColorStop(13 / 14, 'violet');
    grd.addColorStop(1, 'red');
    $.bgCtx.fillStyle = grd;
    $.bgCtx.fillRect(0, 0, $.background.width, $.background.height);

    $.ego = new $.Ego();
    
    // The sound generation might be a bit time consuming on slower machines.
    $.Sound.init();
    
    $.Game.disableKeys();
        
    setTimeout(function() {
      // Show the title screen.
      $.Game.showText(1, "You've Been Glitched");
          
      // Initialise and then start the game loop.
      $.Game.init(false);
      $.Sound.play('music');
      $.Game.loop();
      
      $.Game.fadeIn($.wrapper);
      
      // Re-enable keyboard input after a short delay.
      setTimeout(function() {
        $.Game.showText(2, 'Press SPACE to start');
        $.Game.enableKeys();
      }, 1000);
    }, 500);
  },
  
  /**
   * Initialises the Game.
   * 
   * @param {Boolean} running Whether or not we should say that the Game is now running.
   */
  init: function(running) {
    $.ego.reset();

    this.time = 0;
    this.rotateTimer = $.Constants.ROTATE_INTERVAL;
    this.rotateAngle = 0;
    this.rotateStartTime = 0;
    this.rotateStartAngle = 0;
    this.rotating = false;
    
    this.health = 9;
    this.bullets = [];
    
    // Load the current low time from local storage (equivalent to hi score).
    this.lowTime = (localStorage? localStorage.getItem('lowTime') || 3599000 : 3599000);
    this.lowTimeStr = this.buildTimeString(this.lowTime);
    
    // Clear the enemies
    this.enemyCount = 0;
    this.enemyMap = {};
    
    $.Map.init();
    
    // Tells the game loop that the game is now running. During the game over state,
    // this flag is false.
    this.running = running;
    this.starting = true;
    
    // Clear any pre-existing rotate class.
    $.screen.className = '';
  },
  
  /**
   * Enables keyboard input. 
   */
  enableKeys: function() {
    document.addEventListener('keydown', this.keydown, false);
    document.addEventListener('keyup', this.keyup, false);
    $.screen.focus();
  },
  
  /**
   * Disables keyboard input. 
   */
  disableKeys: function() {
    $.Game.oldkeys = $.Game.keys = {};
    document.removeEventListener('keydown', this.keydown, false);
    document.removeEventListener('keyup', this.keyup, false);
  },
  
  /**
   * Invoked when a key is pressed down.
   *  
   * @param {Object} e The key down event containing the key code.
   */
  keydown: function(e) {
    $.Game.keys[e.keyCode] = 1;
  },
  
  /**
   * Invoked when a key is released.
   *  
   * @param {Object} e The key up event containing the key code.
   */
  keyup: function(e) {
    $.Game.keys[e.keyCode] = 0;
  },
  
  /**
   * This is a wrapper around the main game loop whose primary purpose is to make
   * the this reference point to the Game object within the main game loop. This 
   * is the method invoked by requestAnimationFrame and it quickly delegates to 
   * the main game loop.
   *  
   * @param {number} now Time in milliseconds.
   */
  _loop: function(now) {
    $.Game.loop(now);
  },
  
  /**
   * This is the main game loop, in theory executed on every animation frame.
   * 
   * @param {number} now Time. The delta of this value is used to calculate the movements of Sprites.
   */
  loop: function(now) {
    // Immediately request another invocation on the next
    requestAnimationFrame(this._loop);
    
    // Calculates the time since the last invocation of the game loop.
    this.updateDelta(now);
    
    if (!this.paused) {
      if ($.Game.keys[80] || !this.hasFocus) {
        // Pause the game if the player has pressed the pause key, or if the game
        // has lost focus. This includes pausing the music.
        $.Sound.pause('music');
        this.paused = true;
        this.showText(1, 'Paused');
        this.showText(2, 'Press SPACE to start');
      } else {
        // Game has focus and is not paused, so execute normal game loop, which is
        // to update all objects on the screen.
        this.updateObjects();
      }
    } else if (this.hasFocus) {
      // We're paused, and have focus.
      if (this.countdown) {
        // If we're in countdown mode, update the countdown based on elapsed time.
        this.countdown = Math.max(this.countdown - this.delta, 0);
        
        // Calculate count value (i.e. countdown / 1000) then compare with currently displayed count.
        var count = Math.ceil(this.countdown / 1000);
        if (count != $.msg1.innerHTML) {
          if (count > 0) {
            // If count is above zero, we simply display it.
            $.Sound.play('count');
            this.showText(1, count, true);
          } else {
            // Otherwise countdown has completed, so we un-pause the game.
            $.Sound.play('count');
            this.showText(1, 'Go', true);
            
            // Unpause the game after "Go" has faded.
            setTimeout(function() {
              $.Game.paused = false;
              $.Game.counting = false;
              if ($.Game.starting) {
                $.Game.time = 0;
                $.Game.starting = false;
                $.Game.running = true;
              }
            }, 500);
          }
        }
      } else if (!this.counting) {
        // We're paused and have focus, but haven't started countdown yet. Check for space key.
        if ($.Game.keys[32]) {
          // The space key was pressed, so we start the countdown process. This gives the player
          // some time to get ready.
          this.fadeOut($.msg1);
          this.fadeOut($.msg2);
          
          // This says countdown is about to start (in 1 second).
          this.counting = true;
          
          // Start the countdown in 1 second. Gives the previous messages time to fade.
          setTimeout(function() {
            if (!$.Game.running) $.Game.init(false);
            $.Game.countdown = 3000;
            $.Game.showText(2, 'Get ready', true, 2500);
          }, 1000);
          $.Sound.play('music');
        }
      }
      if ($.Game.starting) {
        this.updateObjects();
      }
      
    } else {
      // In paused state and does not have focus.
      this.countdown = 0;
      this.counting = false;
    }
    
    // Keep track of what the previous state of each key was.
    $.oldkeys = {};
    for ( var k in $.keys) {
      $.oldkeys[k] = $.keys[k];
    }
  },
  
  /**
   * Invoked when the player has killed all of the enemies (Yay!!).
   */
  won: function() {
    // Remove the keyboard input temporarily, just in case the player was rapid
    // firing when they died. We don't want them to immediately trigger a game
    // restart if they didn't want to.
    this.disableKeys();
    
    // This tells the game loop that the game needs to be re-initialised the next 
    // time the player unpauses the game.
    this.running = false;
    
    // Did we beat the lowest time?
    if (this.time < this.lowTime) {
      this.lowTime = this.time;
      this.lowTimeStr = this.buildTimeString(this.lowTime);
      $.lowTime.innerHTML = this.lowTimeStr;
    }
    
    // Store the low time (aka. hi score) in local storage for next time.
    if (localStorage) {
      localStorage.setItem('lowTime', this.lowTime);
    }
    
    // Pause the game and tell the player it is all over.
    this.paused = true;
    this.showText(1, "You've Won!!");
    
    // After 5 seconds, enable keyboard input again and ask the player to press 
    // SPACE to restart.
    setTimeout(function() {
      $.Game.showText(2, 'Press SPACE to restart');
      $.Game.enableKeys();
    }, 3000);
  },
  
  /**
   * Invoked when the player dies.  
   */
  gameover: function() {
    // Remove the keyboard input temporarily, just in case the player was rapid
    // firing when they died. We don't want them to immediately trigger a game
    // restart if they didn't want to.
    this.disableKeys();
    
    // This tells the game loop that the game needs to be re-initialised the next 
    // time the player unpauses the game.
    this.running = false;
    
    // Pause the game and tell the player it is all over.
    this.paused = true;
    this.showText(1, "You've Been Glitched");
    
    // Play the explosion sound and trigger the explode transition on Ego.
    $.Sound.play('explosion');
    
    // After 5 seconds, enable keyboard input again and ask the player to press 
    // SPACE to restart.
    setTimeout(function() {
      $.Game.showText(2, 'Press SPACE to restart');
      $.Game.enableKeys();
    }, 3000);
  },
  
  /**
   * Displays the given text in the given message area. There are two message areas, msg1 and msg2. One
   * is much larger than the other.
   * 
   * @param {number} num Either 1 or 2, identifying either msg1 or msg2 as the place where the text should be displayed.
   * @param {string} text The text to display in the given message area.
   * @param {boolean} fade Set to true if the text should fade after being displayed.
   * @param {number} duration If set then the duration after which the text will either fade, or be removed instantly (depending on the value of fade).
   */
  showText: function(num, text, fade, duration) {
    var msgElem = $['msg'+num];
    
    // Updates the text of the identified message area.
    msgElem.innerHTML = text;
    
    // Fades the text in. The text is always faded in.
    this.fadeIn(msgElem);
    
    if (fade) {
      // If fade was true, then the message will be faded out.
      if (duration) {
        // If a duration was provided, then we will fade out after the specified duration.
        setTimeout(function(e) {
          if (msgElem.innerHTML == text) { 
            $.Game.fadeOut(msgElem);
          }
        }, duration);
      } else {
        // Otherwise fade out immediately after the fade in finishes.
        this.fadeOut(msgElem);
      }
    } else if (duration) {
      // If a duration was provided but fade was false, then we will remove the message 
      // immediately after the specified duration.
      setTimeout(function(e) {
        if (msgElem.innerHTML == text) { 
          msgElem.style.display = 'none';
        }
      }, duration);
    }
  },
  
  /**
   * Fades in the given DOM Element.
   * 
   * @param {Object} elem The DOM Element to fade in.
   */
  fadeIn: function(elem) {
    // Remove any previous transition.
    elem.removeAttribute('style');
    elem.style.display = 'block';
    
    // We need to change the opacity in a setTimeout to give the display change time to take effect first.
    setTimeout(function() {
      // Setting the transition inline so that we can cancel it with the removeAttribute.
      elem.style.transition = 'opacity 0.5s';
      elem.style.opacity = 1.0;
    }, 50);
  },
  
  /**
   * Fades out the given DOM Element.
   * 
   * @param {Object} elem The DOM Element to fade out.
   */
  fadeOut: function(elem) {
    elem.style.opacity = 0.0;
    
    // We need to change the display after the opacity transition has reached 0.0, which is in 0.5 seconds.
    setTimeout(function() {
      elem.style.display = 'none';
    }, 500);  // 500ms needs to match the opacity transition duration.
  },
  
  /**
   * Updates the value displayed in one of the status line fields. All values are 
   * zero padded.
   * 
   * @param {Object} field The DOM Element identifying the status line field to update.
   * @param {Object} value The value to update the status line field text to be (will be zero padded).
   */
  setStatus: function(field, value) {
    field.innerHTML = ('000000000' + value).substr(-field.innerHTML.length);
  },
  
  /**
   * Updates the delta, which is the difference between the last time and now. Both values
   * are provided by the requestAnimationFrame call to the game loop. The last time is the
   * value from the previous frame, and now is the value for the current frame. The difference
   * between them is the delta, which is the time between the two frames.
   * 
   * @param {Object} now The current time provided in the invocation of the game loop.
   */
  updateDelta: function(now) {
    if (now) {
      this.delta = now - (this.lastTime? this.lastTime : (now - 16));
      this.stepFactor = this.delta * 0.06;
      this.lastTime = now;
      this.time += this.delta;
    }
  },
  
  /**
   * The main method invoked on every animation frame.
   */
  updateObjects: function() {
    var enemy, bullet, block;
    
    // Update ego (the player).
    if ($.Game.running) {
      $.ego.update();
    }
      
    // Updates position of bullets and checks to see if they have hit anything.
    for (var bulletNum = 0; bulletNum < 20; bulletNum++) {
      bullet = this.bullets[bulletNum];
          
      // Is the bullet active? i.e. moving. null means the bullet isn't being used.
      if (bullet) {
        this.bullets[bulletNum].move();
        
        block = $.Map.getBlockAt(bullet.x, bullet.y);
        if ((block.type != ' ') && (block.type != '.')) {
          bullet.hit = true;
          if (block.type == '*') {
            // Hit an enemy.
            $.Sound.play('kill');
            enemy = this.getEnemy(block.col, block.row);
            this.removeEnemy(enemy);
            $.Map.clearBlock(block);
          }
        }
      }
    }
      
    // Updates the enemies. 
    var numOfEnemies = this.enemyCount;
    for (var key in this.enemyMap) {
      if (this.enemyMap.hasOwnProperty(key)) {
        enemy = this.enemyMap[key];
        enemy.update();
      }
    }
      
    // Has the glitch enemy grown in size?
    if (this.enemyCount > numOfEnemies) {
      $.Map.swap();
    }
      
    // Update the rotation timer. Rotate by 90 degrees every ROTATE_INTERVAL.
    if (this.rotateTimer <= 0) {
      if (!this.rotating) {
        $.screen.className = 'rotateTo' + ((this.rotateAngle + 90) % 360);
        this.rotateStartTime = this.time;
        this.rotateStartAngle = ~~this.rotateAngle;
        this.rotating = true;
      }
      var rotatePercentage = (this.time - this.rotateStartTime)/2000;
      this.rotateAngle = ~~(this.rotateStartAngle + (90 * rotatePercentage));
      if ((this.rotateAngle - this.rotateStartAngle) > 90) {
        this.rotateAngle = ((~~(this.rotateAngle / 90)) * 90) % 360;
        $.ego.playerAngle = this.rotateAngle;
        this.rotateTimer = $.Constants.ROTATE_INTERVAL;
        $.ego.direction = $.ego.playerAngle / 90;
        this.rotating = false;
      }
    } else {
      this.rotateTimer--;
    }
    
    // Update status line.
    $.time.innerHTML = this.buildTimeString(this.time);
    this.setStatus($.enemies, this.enemyCount);
    $.lowTime.innerHTML = this.lowTimeStr;
      
    // Draw all.
    this.draw();
    
    // Check for game won.
    if (this.enemyCount == 0) {
      $.Game.won();
    }
  },
  
  /**
   * For the given number of milliseconds, returns a string representation that includes
   * the minutes and seconds in the format mm:ss
   * 
   * @param numOfMillis The millisecond value to convert to a time in minutes and seconds.
   * 
   * @returns {String} The time as mm:ss
   */
  buildTimeString: function(numOfMillis) {
    var totalSeconds = Math.floor(numOfMillis / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    if (minutes > 99) {
      minutes = 99;
      seconds = 59;
    }
    return (('00' + minutes).substr(-2) + ':' + ('00' + seconds).substr(-2));
  },
  
  /**
   * Renders the favicon. It does this by rendering Ego facing forward and then resizes this
   * to fit within the favicon size and then updates the href of the favicon with the 
   * data url of the generate canvas.
   */
  renderFavicon: function() {
    var favicon = document.getElementById('favicon');
    var ctx = $.Util.create2dContext(16, 16);
    ctx.drawImage($.Util.renderSphere(50, 4, 'rgb(197,179,88)', 1, 'black', 'white'), 0, 0, 16, 16);
    favicon.href = ctx.canvas.toDataURL();
  },
  
  /**
   * Draws everything in the Game that needs to be drawn for the current frame.
   */
  draw: function() {
    // Start by clearing the whole screen canvas.
    $.sctx.fillStyle = 'rgba(0,0,0,0.0)';
    $.sctx.clearRect(0, 0, 1000, 1000);

    $.sctx.save();

    // Translating to the middle of the window allows it to rotate around the middle.
    $.sctx.translate(~~($.Constants.SCREEN_WIDTH / 2), ~~($.Constants.SCREEN_HEIGHT / 2));

    $.sctx.save();

    // Calculates the diagonal of the square formed by using the longest of the inner window
    // sizes. This allows us to then use this diagonal as the width of the rendered portion
    // of the background, which is the minimum size we need to support a clean rotation (i.e.
    // with no white bits showing).
    //var size = Math.max($.Constants.SCREEN_HEIGHT, $.Constants.SCREEN_WIDTH);
    var diag = 1000; //~~(Math.sqrt(2 * (size * size)));
    
    // Movement in different directions is controlled solely through a translation on this drawImage call.
    $.sctx.drawImage($.Map.getCanvas(),
        // The checks on xPos & yPos are what enables the wrap around of the map and the smooth transitions between wrap edges.
        ($.ego.x > ($.Constants.ROOM_X_PIXELS/2) ? $.ego.x : $.ego.x + $.Constants.ROOM_X_PIXELS) - (diag / 2), 
        ($.ego.y > ($.Constants.ROOM_Y_PIXELS/2) ? $.ego.y : $.ego.y + $.Constants.ROOM_Y_PIXELS) - (diag / 2), 
        diag, diag,
        // Destination.
        -(diag / 2), -(diag / 2), diag, diag);

    $.sctx.restore();

    // Now draw the player.
    $.sctx.save();

    if ($.Game.running) {
      $.sctx.save();
      $.sctx.rotate(((this.rotateAngle) * Math.PI / 180));
      $.ego.draw();
      $.sctx.restore();
    }
    
    // Updates and then renders the bullets.
    for (var bulletNum = 0; bulletNum < 20; bulletNum++) {
      var bullet = this.bullets[bulletNum];
      
      // Is the bullet active? i.e. moving. 
      if (bullet) {
        bullet.draw($.sctx, $.ego.x, $.ego.y);
        if (bullet.hit) {
          this.bullets[bulletNum] = null;
        }
      }
    }
    
    $.sctx.restore();
    
    $.sctx.restore();
  }
};

// The recommended requestAnimationFrame shim
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                               || window[vendors[x]+'CancelRequestAnimationFrame'];
  }
 
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
 
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
}());

// On load, the game will start.
window.onload = function() { 
  $.Game.start();
};