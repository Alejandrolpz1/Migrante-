// Configuración del juego
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
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
const backgroundSpeed = 5; // Velocidad de desplazamiento del fondo
const obstacleSpeed = 5; // Velocidad de desplazamiento de los obstáculos
const obstacleDistance = 600; // Distancia entre los obstáculos

function preload() {
  // Cargar la imagen del sprite y el fondo
  this.load.image('player', 'player.png');
  this.load.image('background', 'selva.png');
  this.load.image('rock', 'roca.png');      // Imagen de la roca
  this.load.image('jaguar', 'jaguar.png'); // Imagen del jaguar
  this.load.image('snake', 'serpiente.png'); // Imagen de la serpiente
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

  // Teclado
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (isGameOver) {
    return; // Detener el juego si se ha terminado
  }

  // Mantener al jugador en posición fija horizontal (solo mover verticalmente)
  player.x = this.scale.width / 4;

  // Movimiento del fondo y obstáculos si el jugador se mueve hacia la derecha
  if (cursors.right.isDown) {
    background.tilePositionX += backgroundSpeed; // Mover el fondo

    obstacles.forEach((obstacle, index) => {
      obstacle.x -= obstacleSpeed; // Mover el obstáculo hacia la izquierda

      // Detectar si un obstáculo ha salido completamente de la pantalla
      if (obstacle.x + obstacle.width < 0) {
        score += 10; // Aumentar la puntuación
        scoreText.setText('Puntos: ' + score); // Actualizar la puntuación en pantalla

        obstacle.destroy(); // Eliminar el obstáculo actual
        obstacles.splice(index, 1); // Quitar el obstáculo de la lista

        // Generar un nuevo obstáculo aleatorio
        const nextX = obstacles.length > 0 
          ? obstacles[obstacles.length - 1].x + obstacleDistance 
          : this.scale.width + obstacleDistance;
        const types = ['rock', 'jaguar', 'snake'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        createObstacle(this, nextX, randomType);
      }
    });
  }

  // Saltar (ajuste para menor altura)
  if (cursors.space.isDown && player.body.blocked.down) {
    player.setVelocityY(-400); // Reduce la altura del salto
  }
}

function createObstacle(scene, x, type) {
  let obstacle = scene.physics.add.sprite(x, scene.scale.height - 100, type);
  if (type === 'rock') {
    obstacle.setScale(1.2);
    obstacle.body.setSize(obstacle.width / 2, obstacle.height / 2);
    obstacle.body.setOffset(obstacle.width / 4, obstacle.height / 4);
  } else if (type === 'jaguar') {
    obstacle.setScale(0.5);
    obstacle.body.setSize(obstacle.width * 0.6, obstacle.height * 0.6);
    obstacle.body.setOffset(obstacle.width * 0.2, obstacle.height * 0.2);
  } else if (type === 'snake') {
    obstacle.setScale(0.8);
    obstacle.body.setSize(obstacle.width / 2, obstacle.height / 2);
    obstacle.body.setOffset(obstacle.width / 4, obstacle.height / 4);
  }
  obstacle.body.setImmovable(true);
  obstacle.body.allowGravity = false;
  obstacles.push(obstacle);

  // Detectar colisión entre el jugador y el obstáculo
  scene.physics.add.collider(player, obstacle, endGame, null, scene);
}

function endGame() {
  isGameOver = true;
  this.physics.pause(); // Detiene la física del juego
  player.setTint(0xff0000); // Cambia el color del jugador para indicar el final
  alert('¡Juego terminado! Puntuación final: ' + score);
  location.reload(); // Reinicia el juego (opcional)
}
