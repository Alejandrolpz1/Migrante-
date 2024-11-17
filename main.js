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
const guardBaseSpeed = 2.8; // Duplicado de 0.9 a 1.8
let guardLastX = 0;

function preload() {
  this.load.image('player', 'player.png');
  this.load.image('background', 'selva.png');
  this.load.image('city', 'ciudad.png');
  this.load.image('rock', 'roca.png');
  this.load.image('jaguar', 'jaguar.png');
  this.load.image('snake', 'serpiente.png');
  this.load.image('fence', 'valla.png');
  this.load.image('guard', 'guardia.png');
}

function create() {
  background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background');
  background.setOrigin(0, 0);

  player = this.physics.add.sprite(this.scale.width / 4, this.scale.height - 100, 'player');
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

  if (score >= 30 && currentLevel === 1) {
    currentLevel = 2;
    background.setTexture('city');
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles = [];

    createObstacle(this, this.scale.width / 2, 'fence');
    createObstacle(this, this.scale.width / 2 + obstacleDistance, 'fence');
    createObstacle(this, this.scale.width / 2 + obstacleDistance * 2, 'fence');

    guard = this.physics.add.sprite(-50, this.scale.height - 100, 'guard');
    guard.setScale(0.8);
    guard.body.allowGravity = false;
    guardLastX = guard.x;

    const fenceY = this.scale.height - 100;
    guard.y = fenceY;

    this.physics.add.overlap(player, guard, endGame, null, this);

    alert('¡Nivel 2! Un guardia te está persiguiendo.');
  }

  player.x = this.scale.width / 4;

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

        const obstacleType = currentLevel === 2 ? 'fence' : getRandomObstacleType();
        createObstacle(this, nextX, obstacleType);
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

function createObstacle(scene, x, type) {
  let obstacle = scene.physics.add.sprite(x, scene.scale.height - 100, type);
  
  switch(type) {
    case 'rock':
      obstacle.setScale(1.2);
      obstacle.body.setSize(obstacle.width / 2, obstacle.height / 2);
      obstacle.body.setOffset(obstacle.width / 4, obstacle.height / 4);
      break;
    case 'jaguar':
      obstacle.setScale(0.5);
      obstacle.body.setSize(obstacle.width * 0.6, obstacle.height * 0.6);
      obstacle.body.setOffset(obstacle.width * 0.2, obstacle.height * 0.2);
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

function endGame() {
  isGameOver = true;
  this.physics.pause();
  player.setTint(0xff0000);
  alert('¡Juego terminado! Puntuación final: ' + score);
  location.reload();
}