// Configuración del juego
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: true
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config);
let player;
let train; // Nueva variable para el tren
let cursors;
let background;
let obstacles = [];
let isGameOver = false;
let score = 0;
let scoreText;
let currentLevel = 1;
let guard;
const backgroundSpeed = 5;
const obstacleSpeed = 5;
const obstacleDistance = 600;
const guardBaseSpeed = 4.8; 
let guardLastX = 0;
let trainSpeed = 2;

function preload() {
  this.load.image('player', 'player.png');
  this.load.image('background', 'selva.png');
  this.load.image('city', 'ciudad.png');
  this.load.image('desert', 'desierto.png');
  this.load.image('rock', 'roca.png');
  this.load.image('jaguar', 'jaguar.png');
  this.load.image('snake', 'serpiente.png');
  this.load.image('fence', 'valla.png');
  this.load.image('guard', 'guardia.png');
  this.load.image('soldier', 'soldado.png');
  this.load.image('cactus', 'cactus.png');
  this.load.image('scorpion', 'escorpion.png');
  this.load.image('tren', 'tren.png');
}

function create() {
  background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background');
  background.setOrigin(0, 0);

  player = this.physics.add.sprite(120, this.scale.height - 100, 'player');
  player.setCollideWorldBounds(true);
  player.setBounce(0.2);

  createObstacle(this, this.scale.width / 2, 'rock');
  createObstacle(this, this.scale.width / 2 + obstacleDistance, 'jaguar');
  createObstacle(this, this.scale.width / 2 + obstacleDistance * 2, 'snake');

  scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '32px', fill: '#fff' });
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (isGameOver) {
    return;
  }

  // Transición al nivel 2
  if (score >= 70 && currentLevel === 1) {
    changeLevel(this, 'city', ['fence', 'fence', 'soldier'], 2);
  }

  // Transición al nivel 3
  if (score >= 100 && currentLevel === 2) {
    changeLevel(this, 'desert', [], 3);
  }

  // Manejo específico para el nivel 3
  if (currentLevel === 3) {
    // Mover solo el tren
    if (train) {
      train.x += trainSpeed;
      // Si el tren sale de la pantalla, reiniciar su posición
      if (train.x > this.scale.width) {
        train.x = -100;
      }
    }
    // El jugador mantiene su posición en x=120
    if (player) {
      player.x = 120;
    }
    return;
  }

  // Control del jugador en niveles 1 y 2
  if (currentLevel < 3) {
    player.x = 120;

    if (cursors.right.isDown) {
      background.tilePositionX += backgroundSpeed;

      obstacles.forEach((obstacle, index) => {
        obstacle.x -= obstacleSpeed;

        if (obstacle.x + obstacle.width < 0) {
          score += 10;
          scoreText.setText('Puntos: ' + score);

          obstacle.destroy();
          obstacles.splice(index, 1);

          const nextX = obstacles.length > 0 
            ? obstacles[obstacles.length - 1].x + obstacleDistance 
            : this.scale.width + obstacleDistance;

          const obstacleType = currentLevel === 2 
            ? getRandomObstacleTypeLevel2() 
            : getRandomObstacleType();
          
          if (obstacleType.length > 0) {
            createObstacle(this, nextX, obstacleType);
          }
        }
      });

      if (currentLevel === 2 && guard) {
        guard.x -= obstacleSpeed;
        guard.x += guardBaseSpeed;
      }
    } else {
      if (currentLevel === 2 && guard) {
        guard.x += guardBaseSpeed;
      }
    }

    if (cursors.space.isDown && player.body.blocked.down) {
      player.setVelocityY(-400);
    }
  }
}

function createObstacle(scene, x, type) {
  if (currentLevel === 3) return;

  let obstacle = scene.physics.add.sprite(x, scene.scale.height - 100, type);
  
  switch(type) {
    case 'rock':
      obstacle.setScale(1.2);
      obstacle.body.setSize(obstacle.width / 2, obstacle.height / 2);
      obstacle.body.setOffset(obstacle.width / 4, obstacle.height / 4);
      break;
    case 'jaguar':
      obstacle.setScale(0.5);
      obstacle.body.setSize(obstacle.width * 0.42, obstacle.height * 0.42);
      obstacle.body.setOffset(obstacle.width * 0.29, obstacle.height * 0.29);
      break;
    case 'snake':
      obstacle.setScale(0.8);
      obstacle.body.setSize(obstacle.width / 2, obstacle.height / 2);
      obstacle.body.setOffset(obstacle.width / 4, obstacle.height / 4);
      break;
    case 'fence':
      obstacle.setScale(0.8);
      obstacle.body.setSize(obstacle.width * 0.6, obstacle.height * 0.4);
      obstacle.body.setOffset(obstacle.width * 0.2, obstacle.height * 0.3);
      break;
    case 'soldier':
      obstacle.setScale(1.1);
      obstacle.body.setSize(obstacle.width * 0.5, obstacle.height * 0.5);
      obstacle.body.setOffset(obstacle.width * 0.25, obstacle.height * 0.25);
      break;
  }
  
  obstacle.body.setImmovable(true);
  obstacle.body.allowGravity = false;
  obstacles.push(obstacle);

  scene.physics.add.collider(player, obstacle, endGame, null, scene);
}

function getRandomObstacleType() {
  const types = ['rock', 'jaguar', 'snake'];
  return types[Math.floor(Math.random() * types.length)];
}

function getRandomObstacleTypeLevel2() {
  const types = ['fence', 'soldier'];
  return types[Math.floor(Math.random() * types.length)];
}

function changeLevel(scene, newBackground, newObstacles, newLevel) {
  currentLevel = newLevel;

  let fade = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 1);
  fade.setOrigin(0, 0);
  fade.setAlpha(0);

  scene.tweens.add({
    targets: fade,
    alpha: 1,
    duration: 1000,
    onComplete: () => {
      background.setTexture(newBackground);
      obstacles.forEach(obstacle => obstacle.destroy());
      obstacles = [];
      
      // En nivel 3, mantener el jugador y crear el tren
      if (newLevel === 3) {
        // El jugador se mantiene pero se mueve 10 píxeles más abajo
        player.y = scene.scale.height - 50;
        
        // Crear el tren como un objeto separado
        train = scene.physics.add.sprite(120, scene.scale.height - 120, 'tren');
        train.setScale(0.5);
        train.setOrigin(0.5, 1);
        train.body.allowGravity = false;
        train.setCollideWorldBounds(false);
      }

      newObstacles.forEach((type, index) => {
        createObstacle(scene, scene.scale.width / 2 + obstacleDistance * (index + 1), type);
      });

      if (newLevel === 2) {
        guard = scene.physics.add.sprite(-50, scene.scale.height - 100, 'guard');
        guard.setScale(0.8);
        guard.body.allowGravity = false;
        guardLastX = guard.x;
        scene.physics.add.overlap(player, guard, endGame, null, scene);
      }

      scene.tweens.add({
        targets: fade,
        alpha: 0,
        duration: 1000
      });
    }
  });
}

function endGame() {
  isGameOver = true;
  this.physics.pause();
  player.setTint(0xff0000);
  alert('¡Juego terminado! Puntuación final: ' + score);
  location.reload();
}