angular.module('asteroids').controller('gameController', function($scope) {
	var init = (function() {

		var input = MYGAME.input(),
			graphics = MYGAME.graphics(),
			mouseCapture = false,
			myMouse = input.Mouse(),
			myKeyboard = input.Keyboard(),
			myAutomatic = input.Auto(),
			myTouch = input.Touch(),
			cancelNextRequest = false,
			localPlayer = null,
			remotePlayers = [],
			forwardpressed = false,
			leftpressed = false,
			rightpressed = false,
			socket = io.connect();
		
		function initialize() {
			console.log('game initializing...');
			var img = new Image();
			img.src = "../images/ship.png";
			localPlayer = graphics.Texture( {
				image : img,
				center : { x : 250, y : 250 },
				width : 100, height : 100,
				rotation : 0
			});
			socket.on("connect", onSocketConnected);
			socket.on("disconnect", onSocketDisconnect);
			socket.on("new player", onNewPlayer);
			socket.on("move player", onMovePlayer);
			socket.on("remove player", onRemovePlayer);
			socket.on("new response", onSocketId);
		}
		
		$(window).keyup(function(e){
			if (e.keyCode === KeyEvent.DOM_VK_W || e.keyCode === KeyEvent.DOM_VK_A || e.keyCode === KeyEvent.DOM_VK_D) {
				if(e.keyCode === KeyEvent.DOM_VK_W){
					forwardpressed = false;
				}
				else if(e.keyCode === KeyEvent.DOM_VK_A){
					leftpressed = false;
				}
				else if(e.keyCode === KeyEvent.DOM_VK_D){
					rightpressed = false;
				}

				release(e.keyCode);
			}
		});

		function release(code) {
			var obj = {
				id : localPlayer.id,
				key : code
			};
			socket.emit("key release", obj);
		}

		function press(code) {
			var obj = {
				id : localPlayer.id,
				key : code
			};
			socket.emit("key press", obj)
		}

		$(window).keydown(function(e){
			if (e.keyCode === KeyEvent.DOM_VK_W || e.keyCode === KeyEvent.DOM_VK_A || e.keyCode === KeyEvent.DOM_VK_D) {
				if(e.keyCode === KeyEvent.DOM_VK_W && !forwardpressed){
					forwardpressed = true;					
				}
				else if(e.keyCode === KeyEvent.DOM_VK_A && !leftpressed){
					leftpressed = true;					
				}
				else if(e.keyCode === KeyEvent.DOM_VK_D && !rightpressed){
					rightpressed = true;					
				}

				press(e.keyCode);
			}
		});

		function gameLoop(time) {
			var currentTime = Date.now();
			MYGAME.elapsedTime = currentTime - MYGAME.lastTimeStamp;
			MYGAME.lastTimeStamp = currentTime;
			myKeyboard.update(MYGAME.elapsedTime);
			graphics.clear();
			for (i = remotePlayers.length-1; i >= 0; --i) {
				remotePlayers[i].draw();
			}

			if (!cancelNextRequest) {
				requestAnimationFrame(gameLoop);
			}
		}

		function run() {
			MYGAME.lastTimeStamp = Date.now();
			requestAnimationFrame(gameLoop);
		}

		function onSocketConnected() {
			console.log("Connected to socket server");
			socket.emit("new player",
			{
				x   : localPlayer.getX(),
				y   : localPlayer.getY(),
				rot : localPlayer.getRot()
			});
		}

		function onSocketId(data){
			localPlayer.id = data.id;
			remotePlayers.push(localPlayer);
			console.log("id: " + data.id);
		}

		function onSocketDisconnect() {
			console.log("Disconnected from socket server");
		}

		function onNewPlayer(data) {
			console.log("New player connected: "+data.id);
			var img = new Image();
			img.src = "../images/ship.png";
			var newPlayer = graphics.Texture( {
				image : img,
				center : { x : data.x, y : data.y },
				width : 100, height : 100,
				rotation : data.rot
			});
			newPlayer.id = data.id;
			remotePlayers.push(newPlayer);
		}

		function onMovePlayer(data) {
			for(var i = 0; i < remotePlayers.length; ++i){
				var player = playerById(data.array[i].id);
				if (!player) {
					console.log("Player not found: "+data.id);
					continue;
				}
				player.setX(data.array[i].x);
				player.setY(data.array[i].y);
				player.setRot(data.array[i].rot);
			}
		}

		function onRemovePlayer(data) {
			var removePlayer = playerById(data.id);

			if (!removePlayer) {
				console.log("Player not found: "+data.id);
				return;
			}
			remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
		}

		function playerById(id) {
			var i;
			for (i = 0; i < remotePlayers.length; i++) {
				if (remotePlayers[i].id == id)
					return remotePlayers[i];
			}

			return false;
		}
		
		return {
			initialize : initialize,
			run : run
		};
	}());

	init.initialize();
	init.run();
});