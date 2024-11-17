// Configuración del juego
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: true // Activa el modo debug para depurar las físicas
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
let obstacles = []; // Lista para los obstáculos dinámicos
let isGameOver = false;
let score = 0; // Puntuación inicial
let scoreText;
let currentLevel = 1; // Nivel inicial
const backgroundSpeed = 5; // Velocidad de desplazamiento del fondo
const obstacleSpeed = 5; // Velocidad de desplazamiento de los obstáculos
const obstacleDistance = 600; // Distancia entre los obstáculos

function preload() {
  // Cargar imágenes de los sprites y fondos
  this.load.image('player', 'player.png');
  this.load.image('background', 'selva.png');
  this.load.image('city', 'ciudad.png'); // Fondo para el nivel 2
  this.load.image('rock', 'roca.png'); // Imagen de la roca
  this.load.image('jaguar', 'jaguar.png'); // Imagen del jaguar
  this.load.image('snake', 'serpiente.png'); // Imagen de la serpiente
  this.load.image('fence', 'valla.png'); // Obstáculo único del nivel 2
}

function create() {
  // Agregar el fondo y escalarlo para que ocupe todo el canvas
  background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background');
  background.setOrigin(0, 0);

  // Crear al jugador (posición fija en el centro horizontal)
  player = this.physics.add.sprite(this.scale.width / 4, this.scale.height - 100, 'player');
  player.setCollideWorldBounds(true);
  player.setBounce(0.2);

  // Crear los primeros obstáculos
  createObstacle(this, this.scale.width / 2, 'rock');
  createObstacle(this, this.scale.width / 2 + obstacleDistance, 'jaguar');
  createObstacle(this, this.scale.width / 2 + obstacleDistance * 2, 'snake');

  // Mostrar la puntuación en la pantalla
  scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '32px', fill: '#fff' });

  // Configuración del teclado
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (isGameOver) {
    return; // Detener el juego si se ha terminado
  }

  // Cambiar de nivel al alcanzar 150 puntos
  if (score >= 30 && currentLevel === 1) {
    currentLevel = 2;
    background.setTexture('city');
    obstacles.forEach(obstacle => obstacle.destroy());
    obstacles = [];
    
    // Crear los primeros obstáculos del nivel 2
    createObstacle(this, this.scale.width / 2, 'fence');
    createObstacle(this, this.scale.width / 2 + obstacleDistance, 'fence');
    createObstacle(this, this.scale.width / 2 + obstacleDistance * 2, 'fence');
    
    alert('¡Nivel 2!');
  }

  // Mantener al jugador en posición fija horizontal (solo mover verticalmente)
  player.x = this.scale.width / 4;

  // Movimiento del fondo y obstáculos si el jugador se mueve hacia la derecha
  if (cursors.right.isDown) {
    background.tilePositionX += backgroundSpeed;

    obstacles.forEach((obstacle, index) => {
      obstacle.x -= obstacleSpeed;

      // Detectar si un obstáculo ha salido completamente de la pantalla
      if (obstacle.x + obstacle.width < 0) {
        score += 10;
        scoreText.setText('Puntos: ' + score);

        obstacle.destroy();
        obstacles.splice(index, 1);

        // Generar un nuevo obstáculo
        const nextX = obstacles.length > 0 
          ? obstacles[obstacles.length - 1].x + obstacleDistance 
          : this.scale.width + obstacleDistance;

        // Asegurarnos de que en el nivel 2 solo aparezcan vallas
        const obstacleType = currentLevel === 2 ? 'fence' : getRandomObstacleType();
        createObstacle(this, nextX, obstacleType);
      }
    });
  }

  // Saltar (ajuste para menor altura)
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
        obstacle.setScale(0.8); // Escala visual
        obstacle.body.setSize(obstacle.width * 0.6, obstacle.height * 0.4); // Reducir el hitbox
        obstacle.body.setOffset(obstacle.width * 0.2, obstacle.height * 0.3); // Centrar el hitbox reducido
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
  this.physics.pause(); // Detiene la física del juego
  player.setTint(0xff0000); // Cambia el color del jugador para indicar el final
  alert('¡Juego terminado! Puntuación final: ' + score);
  location.reload(); // Reinicia el juego (opcional)
}