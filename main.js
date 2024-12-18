const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%'
  },
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

window.addEventListener('resize', () => {
  const game = document.getElementsByTagName('canvas')[0];
  if (game) {
    game.style.width = '100%';
    game.style.height = '100%';
  }
});

let player;
let train; 
let cursors;
let background;
let obstacles = [];
let bushes = [];
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
let levelTransitionTimer = null;
let intersectionPoints = [];
let intersectionTimers = [];
let playerHidden = false;
let patrolPoint;
let pointTimer;


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
  this.load.image('noche', 'noche.png');
  this.load.image('bush', 'arbusto.png');
}


function updateSceneScale(scene) {
  // Ajustar escala de elementos según el nuevo tamaño de pantalla
  const scaleX = scene.scale.width / 800; // Ancho base de referencia
  const scaleY = scene.scale.height / 600; // Altura base de referencia

  // Ajustar posiciones y escalas de elementos
  player.setScale(Math.min(scaleX, scaleY));
  player.x = scene.scale.width * (120 / 800);
  player.y = scene.scale.height * (500 / 600);

  // Ajustar obstáculos
  obstacles.forEach(obstacle => {
    obstacle.setScale(Math.min(scaleX, scaleY));
    obstacle.x = scene.scale.width * (obstacle.x / 800);
    obstacle.y = scene.scale.height * (obstacle.y / 600);
  });

  // Ajustar fondo
  if (background) {
    background.width = scene.scale.width;
    background.height = scene.scale.height;
  }

  // Ajustar texto de puntuación
  if (scoreText) {
    scoreText.x = scene.scale.width * (16 / 800);
    scoreText.y = scene.scale.height * (16 / 600);
    scoreText.setFontSize(Math.min(scaleX, scaleY) * 32);
  }
}

function createIntersectionPoints(scene) {
  const intersections = [74, 76, 78];
  const cellWidth = scene.scale.width / 10;
  const cellHeight = scene.scale.height / 10;

  intersectionPoints = [];
  intersections.forEach(cell => {
    const row = Math.floor((cell - 1) / 10);
    const col = (cell - 1) % 10;
    
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;
    
    const point = scene.add.circle(x, y, 10, 0xff0000);
    point.setAlpha(0);
    point.setDepth(1001);
    intersectionPoints.push(point);
  });
}

function create() {
  // Establecer fondo adaptativo
  background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background');
  background.setOrigin(0, 0);
  background.displayWidth = this.scale.width;
  background.displayHeight = this.scale.height;

  // Crear jugador con posición relativa y escala reducida
  player = this.physics.add.sprite(
    this.scale.width * (120 / 800), 
    this.scale.height * (500 / 600), 
    'player'
  );
  player.setCollideWorldBounds(true);
  player.setBounce(0.2);
  player.setScale(this.scale.width / 1600); // Reducir a la mitad

  // Crear obstáculos con posiciones relativas
  createObstacle(this, this.scale.width / 2, 'rock');
  createObstacle(this, this.scale.width / 2 + obstacleDistance * (this.scale.width / 800), 'jaguar');
  createObstacle(this, this.scale.width / 2 + obstacleDistance * 2 * (this.scale.width / 800), 'snake');

  // Texto de puntuación adaptativo
  scoreText = this.add.text(
    this.scale.width * (16 / 800), 
    this.scale.height * (16 / 600), 
    'Puntos: 0', 
    { 
      fontSize: `${this.scale.width / 800 * 32}px`, 
      fill: '#fff' 
    }
  );

  // Controles de teclado
  cursors = this.input.keyboard.createCursorKeys();

  // Evento de redimensionamiento
  this.scale.on('resize', (gameSize) => {
    // Actualizar tamaños y posiciones
    background.displayWidth = gameSize.width;
    background.displayHeight = gameSize.height;

    player.x = gameSize.width * (120 / 800);
    player.y = gameSize.height * (500 / 600);
    player.setScale(gameSize.width / 1600); // Mantener la escala reducida

    scoreText.x = gameSize.width * (16 / 800);
    scoreText.y = gameSize.height * (16 / 600);
    scoreText.setFontSize(gameSize.width / 800 * 32);

    // Reposicionar obstáculos
    obstacles.forEach((obstacle, index) => {
      obstacle.x = gameSize.width / 2 + obstacleDistance * (index + 1) * (gameSize.width / 800);
      obstacle.y = gameSize.height * (500 / 600);
      obstacle.setScale(gameSize.width / 800);
    });
  });
}

function update() {
  if (isGameOver) {
    return;
  }

  // Nivel 1 a Nivel 2
  if (score >= 70 && currentLevel === 1) {
    changeLevel(this, 'city', ['fence', 'fence', 'soldier'], 2);
  }

  // Nivel 2 a Nivel 3
  if (score >= 140 && currentLevel === 2) {
    changeLevel(this, 'desert', [], 3);
  }

  // Lógica del Nivel 3
  if (currentLevel === 3) {
    if (train) {
      train.x += trainSpeed;
      if (train.x > this.scale.width) {
        train.x = -100;
      }

      const cellWidth = this.scale.width / 10;
      const cellHeight = this.scale.height / 10;
      const intersections = [74, 76, 78];

      // Configuración de puntos de intersección
      if (!this.intersectionTimer) {
        this.intersectionTimer = this.time.addEvent({
          delay: 4000,
          callback: () => {
            intersectionPoints.forEach(point => {
              point.setFillStyle(0x00ff00);
              point.setAlpha(0);
            });

            this.time.delayedCall(1000, () => {
              intersectionPoints.forEach(point => {
                point.setFillStyle(0xff0000);
                point.setAlpha(0);
              });
            });
          },
          loop: true
        });
      }

      intersections.forEach((cell, index) => {
        const row = Math.floor((cell - 1) / 10);
        const col = (cell - 1) % 10;

        const intersectionHitbox = new Phaser.Geom.Rectangle(
          col * cellWidth,
          row * cellHeight,
          cellWidth,
          cellHeight
        );

        // Detección de colisiones en puntos de intersección
        if (Phaser.Geom.Intersects.RectangleToRectangle(
          new Phaser.Geom.Rectangle(player.x, player.y, player.width, player.height),
          intersectionHitbox
        )) {
          if (intersectionPoints[index].fillColor === 0xff0000 && cursors.space.isDown) {
            player.x = 120;
            player.y = this.scale.height - 50;
            return;
          }

          if (intersectionPoints[index].fillColor === 0x00ff00 && cursors.space.isDown) {
            // Detener el temporizador antes de cambiar de nivel
            if (this.intersectionTimer) {
              this.intersectionTimer.remove();
              this.intersectionTimer = null;
            }
            
            this.time.delayedCall(100, () => {
              changeLevel(this, 'noche', [], 4);
            });
            return;
          }
        }
      });
    }

    // Movimiento del jugador en nivel 3
    if (cursors.left.isDown) {
      player.x -= 2.5;
    }
    if (cursors.right.isDown) {
      player.x += 2.5;
    }
    if (cursors.space.isDown) {
      player.y -= 10;
    }
    if (cursors.down.isDown) {
      player.y += 2.5;
    }

    player.x = Phaser.Math.Clamp(player.x, 0, this.scale.width);
    player.y = Phaser.Math.Clamp(player.y, 0, this.scale.height);
    return;
  }

  // Lógica del Nivel 4
  if (currentLevel === 4) {
    // Verificar si el jugador está fuera de los arbustos y el semáforo está en rojo
    const isInBush = bushes.some(bush => 
      Phaser.Geom.Intersects.RectangleToRectangle(
        new Phaser.Geom.Rectangle(player.x, player.y, player.width, player.height),
        bush.getBounds()
      )
    );

    if (!isInBush && patrolPoint && patrolPoint.fillColor === 0xff0000) {
      endGame.call(this);
      return;
    }

    // Movimiento del jugador si no está oculto en nivel 4
    if (!playerHidden) {
      if (cursors.left.isDown) {
        player.x -= 2.5;
      }
      if (cursors.right.isDown) {
        player.x += 2.5;
      }
      if (cursors.space.isDown) {
        player.y -= 10;
      }
      if (cursors.down.isDown) {
        player.y += 2.5;
      }
    }

    player.x = Phaser.Math.Clamp(player.x, 0, this.scale.width);
    player.y = Phaser.Math.Clamp(player.y, 0, this.scale.height);
    return;
  }

  // Lógica para niveles 1 y 2
  if (currentLevel < 3) {
    // Mantener al jugador en x=120
    player.x = 120;

    if (cursors.right.isDown) {
      // Mover el fondo y los obstáculos
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

    // Solo permitir salto
    if (cursors.space.isDown && player.body.blocked.down) {
      player.setVelocityY(-400);
    }
  }
}

function changeLevel(scene, newBackground, newObstacles, newLevel) {
  // Limpiar temporizadores existentes
  if (scene.intersectionTimer) {
    scene.intersectionTimer.remove();
    scene.intersectionTimer = null;
  }
  
  if (pointTimer) {
    pointTimer.remove();
    pointTimer = null;
  }

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
      
      if (newLevel === 3) {
        player.y = scene.scale.height - 50;
        
        if (train) train.destroy();
        train = scene.physics.add.sprite(120, scene.scale.height - 120, 'tren');
        train.setScale(0.5);
        train.setOrigin(0.5, 1);
        train.body.allowGravity = false;
        train.setCollideWorldBounds(false);

        createIntersectionPoints(scene);
      }

      if (newLevel === 4) {
        if (train) {
          train.destroy();
          train = null;
        }
        
        // Limpiar puntos de intersección si existen
        if (intersectionPoints.length > 0) {
          intersectionPoints.forEach(point => point.destroy());
          intersectionPoints = [];
        }
        
        player.y = scene.scale.height - 50;
        player.x = 120;
        
        scene.time.delayedCall(100, () => {
          createBushes(scene);
        });
      }

      if (newLevel === 5) {
        // Limpiar elementos del nivel 4
        bushes.forEach(bush => bush.destroy());
        bushes = [];
        
        // Eliminar el semáforo y su temporizador
        if (patrolPoint) {
          patrolPoint.destroy();
          patrolPoint = null;
        }
        if (pointTimer) {
          pointTimer.remove();
          pointTimer = null;
        }

        // Eliminar cualquier guardia existente
        let guards = scene.children.list.filter(child => child.texture && child.texture.key === 'guard');
        guards.forEach(guard => guard.destroy());
        
        // Reiniciar posición del jugador
        player.y = scene.scale.height - 50;
        player.x = scene.scale.width / 2;
        
        // Crear mensaje de victoria
        let winText = scene.add.text(
          scene.scale.width / 2,
          scene.scale.height / 2,
          '¡Ganaste!\nTerminaste el camino',
          {
            fontSize: '48px',
            fill: '#fff',
            align: 'center',
            backgroundColor: '#000000',
            padding: { x: 20, y: 20 }
          }
        );
        winText.setOrigin(0.5);
        winText.setDepth(1000);
        
        // Crear arbustos decorativos
        const bushPositions = [
          { x: 100, y: scene.scale.height - 80 },
          { x: 300, y: scene.scale.height - 80 },
          { x: 500, y: scene.scale.height - 80 },
          { x: 700, y: scene.scale.height - 80 },
          { x: 900, y: scene.scale.height - 80 }
        ];

        bushPositions.forEach(pos => {
          let bush = scene.physics.add.sprite(pos.x, pos.y, 'bush');
          bush.setScale(0.8);
          bush.body.setImmovable(true);
          bush.body.allowGravity = false;
          bush.setDepth(1);
        });
        
        // Desactivar controles del jugador
        player.setVelocity(0, 0);
        player.body.allowGravity = false;
        
        // Opcional: recargar el juego después de unos segundos
        scene.time.delayedCall(20000, () => {
          location.reload();
        });
      }

      if (newLevel === 2) {
        if (guard) guard.destroy();
        guard = scene.physics.add.sprite(-50, scene.scale.height - 100, 'guard');
        guard.setScale(0.8);
        guard.body.allowGravity = false;
        guardLastX = guard.x;
        scene.physics.add.overlap(player, guard, endGame, null, scene);
      }

      newObstacles.forEach((type, index) => {
        createObstacle(scene, scene.scale.width / 2 + obstacleDistance * (index + 1), type);
      });

      scene.tweens.add({
        targets: fade,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          if (newLevel === 4) {
            alert('¡Has avanzado al nivel 4! Tienes 10 segundos de tiempo seguro. Muevete en la luz verde, ocultate cuando la luz este roja o perderas ');
          }
        }
      });
    }
  });
}

function createDecorativeBushes(scene) {
  const bushPositions = [
    { x: 100, y: scene.scale.height - 80 },
    { x: 300, y: scene.scale.height - 80 },
    { x: 500, y: scene.scale.height - 80 },
    { x: 700, y: scene.scale.height - 80 },
    { x: 900, y: scene.scale.height - 80 }
  ];

  bushPositions.forEach(pos => {
    let bush = scene.physics.add.sprite(pos.x, pos.y, 'bush');
    bush.setScale(0.8);
    bush.body.setImmovable(true);
    bush.body.allowGravity = false;
  });
}



function createBushes(scene) {
  bushes.forEach(bush => bush.destroy());
  bushes = [];

  patrolPoint = scene.add.circle(scene.scale.width - 100, 550, 30, 0x00ff00);
  
  let infoText = scene.add.text(16, 60, 'Tiempo seguro: 10s', {
    fontSize: '24px',
    fill: '#fff'
  });


  let safeTimeRemaining = 10;
  let safeTimer = scene.time.addEvent({
    delay: 1000,
    callback: () => {
      safeTimeRemaining--;
      infoText.setText(`Tiempo seguro: ${safeTimeRemaining}s`);
      
      if (safeTimeRemaining <= 0) {
        infoText.destroy();
        
        startTrafficLightCycle(scene);
      }
    },
    repeat: 9
  });

  const bushPositions = [
    { x: 300, y: scene.scale.height - 80 },
    { x: 600, y: scene.scale.height - 80 },
    { x: 900, y: scene.scale.height - 80 }
  ];

  bushPositions.forEach(pos => {
    let bush = scene.physics.add.sprite(pos.x, pos.y, 'bush');
    bush.setScale(0.8);
    bush.body.setImmovable(true);
    bush.body.allowGravity = false;
    bushes.push(bush);

    scene.physics.add.overlap(player, bush, handleBushOverlap, null, scene);
  });

  let patrol = scene.physics.add.sprite(scene.scale.width - 100, scene.scale.height - 75, 'guard');
  patrol.setScale(0.8);
  patrol.body.allowGravity = false;
  patrol.setFlipX(true);

  scene.physics.add.overlap(player, patrol, (player, patrol) => {
    if (!playerHidden) {
      endGame.call(scene);
    }
  }, null, scene);
}

function checkGameOverLevel4(scene) {
  const playerOverlapsBush = bushes.some(bush => {
    return Phaser.Geom.Intersects.RectangleToRectangle(
      player.getBounds(),
      bush.getBounds()
    );
  });


  if (patrolPoint.fillColor === 0xff0000 && !playerOverlapsBush) {
    endGame.call(scene);
  }
}

function startTrafficLightCycle(scene) {
  if (pointTimer) {
    pointTimer.remove();
  }

  let isRed = false;
  let previousColor = 0x00ff00;
  
  pointTimer = scene.time.addEvent({
    delay: 5000, 
    callback: () => {
      isRed = !isRed;
      patrolPoint.setFillStyle(isRed ? 0xff0000 : 0x00ff00);
      
      if (previousColor === 0xff0000 && !isRed) {
        const playerInBushes = bushes.some(bush => 
          Phaser.Geom.Intersects.RectangleToRectangle(
            new Phaser.Geom.Rectangle(player.x, player.y, player.width, player.height),
            bush.getBounds()
          )
        );

        if (playerInBushes) {
          score += 20;
          scoreText.setText('Puntos: ' + score);

          // Verificar si se alcanzó el puntaje para el nivel 5
          if (score >= 200) {
            changeLevel(scene, 'noche', [], 5);
          }
        }
      }
      
      previousColor = isRed ? 0xff0000 : 0x00ff00;
    },
    loop: true
  });
}

function checkGameOverLevel4(scene) {
  const playerOverlapsBush = bushes.some(bush => {
    return Phaser.Geom.Intersects.RectangleToRectangle(
      player.getBounds(),
      bush.getBounds()
    );
  });

  // Solo verificar game over si ya pasó el período inicial de seguridad
  if (patrolPoint.fillColor === 0xff0000 && !playerOverlapsBush) {
    endGame.call(scene);
  }
}



function handleBushOverlap(player, bush) {
  if (cursors.shift.isDown) {
    playerHidden = true;
    player.setAlpha(0.5);
    
    // Check if player passes red light while hidden
    if (patrolPoint.fillColor === 0xff0000) {
      score += 20;
      scoreText.setText('Puntos: ' + score);
    }
  } else {
    playerHidden = false;
    player.setAlpha(1);
  }
}
function createObstacle(scene, x, type) {
  if (currentLevel === 3 || currentLevel === 4) return;

  let obstacle = scene.physics.add.sprite(x, scene.scale.height - 100, type);
  
  switch(type) {
    case 'rock':
      obstacle.setScale(1.2);
      obstacle.body.setSize(obstacle.width / 2, obstacle.height / 2);
      obstacle.body.setOffset(obstacle.width / 4, obstacle.height / 4);
      break;
    case 'jaguar':
      obstacle.setScale(0.5);
      obstacle.body.setSize(obstacle.width * 0.32, obstacle.height * 0.32);
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


function endGame() {
  isGameOver = true;
  this.physics.pause();
  player.setTint(0xff0000);
  
  // Limpiar el temporizador del punto
  if (pointTimer) {
    pointTimer.destroy();
  }
  
  alert('¡Juego terminado! Puntuación final: ' + score);
  location.reload();
}