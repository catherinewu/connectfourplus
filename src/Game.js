import React, { Component } from 'react';
import _ from 'lodash';
import uuid from 'uuid';

const CENTER_OFFSET = 37.5;
const WIDTH = 75;
const RADIUS = 30;

export class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: this.props.gameId,
      browserId: null,
      playerNumber: null, // 0 = watching, 1 = black, 2 = red
      gameEnded: false,
      gravity: false,
    };

    this.canvasRef = React.createRef();
    this.handleClick = this.handleClick.bind(this);
    this.makeMove = this.makeMove.bind(this);
    this.currentPlayer = this.currentPlayer.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.createBoard = this.createBoard.bind(this);
    this.calculatePlayerNumber = this.calculatePlayerNumber.bind(this);
    this.validateMove = this.validateMove.bind(this);
    this.checkGameOver = this.checkGameOver.bind(this);
    this.checkOffset = this.checkOffset.bind(this);
    this.validateCoordinateWithinBoard = this.validateCoordinateWithinBoard.bind(this);

    this.props.database.ref('games/' + this.props.gameId + '/events').on("child_added", this.handleEvent);
  }

  createBoard(width, height) {
    var board = [];
    for (var i = 0; i < height; i++) {
      board.push(new Array(width).fill(0));
    }
    return board;
  }

  handleEvent(snapshot, prevChildKey) {
    var e = snapshot.val();
    if (e.type == 'player_move') {
      const {i, j} = e;
      let game = _.cloneDeep(this.state.game);  
      game[i][j] = this.currentPlayer();
      
      const gameOver = this.checkGameOver(game, i, j);
      if (gameOver) {
        window.alert(`Winner is: ${this.currentPlayer() === 1 ? 'black' : 'red'}`);
        this.state.gameEnded = true;
      }    

      console.log(game);
      this.setState({ game });
    } else if (e.type == 'initialize') {
      this.setState({
        game: this.createBoard(e.width, e.height),
        boardWidth: e.width,
        boardHeight: e.height,
        gravity: e.gravity,
        target: e.target,
      });
    }
  }

  componentDidMount() {
    var id = localStorage.getItem('id');
    if (!id) {
      id = uuid.v4();
      localStorage.setItem('id', id);
    }
    this.state.browserId = id;

    this.calculatePlayerNumber();
    this.draw();
  }

  async calculatePlayerNumber() {
    console.log('calculatePlayerNumber')
    const eventref = this.props.database.ref('games/' + this.props.gameId + '/events');
    const snapshot = await eventref.once('value');
    const events = snapshot.val();
    console.log('events', events);

    var playerAddEvents = _.filter(events, x => x.type === 'add_player');
    var alreadyAdded = _.filter(playerAddEvents, x => x.browserId === this.state.browserId);
    if (alreadyAdded.length >= 1) {
      this.state.playerNumber = alreadyAdded[0].playerNumber;
    } else {
      console.log('playerAddEvents?', playerAddEvents);
      if (playerAddEvents.length >= 2) {
        window.alert('Sorry, there are 2 players already. You are just watching');
        this.state.playerNumber = 0;
      } else {
        window.alert('You are the RED player');
        this.props.database.ref('games/' + this.props.gameId + '/events').push({
          type: 'add_player',
          browserId: this.state.browserId,
          playerNumber: 2,
        });
        this.state.playerNumber = 2;
      }
    }
  }

  componentDidUpdate() {
    this.draw();
  }

  draw() {
    const canvas = this.canvasRef.current;
    const context = canvas.getContext('2d');
    drawGame(context, this.state.game, this.state.boardWidth, this.state.boardHeight);
    if (this.state.ghost) {
      fillSpace(context, this.state.ghost.i, this.state.ghost.j, 'Gray');
    }
  }

  handleMove = (e) => {
    let rect = this.canvasRef.current.getBoundingClientRect(); 
    let [i, j] = getPosition(e.pageX - rect.left - window.pageXOffset, e.pageY - rect.top - window.pageYOffset);
    const valid = this.validateCoordinateWithinBoard(i, j);
    const {ghost} = this.state;
    if (valid && (!ghost || ghost.i !== i || ghost.j !== j)) {
      this.setState({ ghost: {i, j} });
    } else if (!valid) {
      i = -1;
      j = -1;
      this.setState({ ghost: {i, j} });
    }
  }

  validateCoordinateWithinBoard(i, j) {
    if (i < this.state.boardWidth && i >= 0 && j < this.state.boardHeight && j >= 0) {
      return true;
    }
    return false;
  }

  handleClick(event) {
    let rect = this.canvasRef.current.getBoundingClientRect(); 
    var x = event.pageX - rect.left,
        y = event.pageY - rect.top;
    let [i, j] = getPosition(x, y);
    console.log('position is ', i, j);

    if (this.state.gravity) {
      i = -1;
      for (let xPos = this.state.boardHeight - 1; xPos >= 0; xPos--) {
        console.log('this.state.game[xPos][j]', this.state.game[xPos][j]);
        if (this.state.game[xPos][j] === 0) {
          i = xPos; // lowest unfilled position
          break;
        }
      }
    }
    // validate turn 
    const currentPlayer = this.currentPlayer();
    const valid = this.validateMove(currentPlayer, i, j);
    if (valid) {
      console.log('making move');
      this.makeMove(i, j);
    }
  }

  checkGameOver(game, currentRow, currentColumn) {
    const currentPlayer = game[currentRow][currentColumn];
    const offsetTuplesToCheck = [{x: -1, y:1}, {x: -1, y:0}, {x:-1, y:-1}, {x:0, y:-1}];
    for (let i = 0; i < offsetTuplesToCheck.length; i++) {
      const offsetX = offsetTuplesToCheck[i].x;
      const offsetY = offsetTuplesToCheck[i].y;
      const checkOffsetResult = this.checkOffset(game, currentPlayer, offsetX, offsetY, currentRow, currentColumn);
      if (checkOffsetResult) {
        return true;
      }
    }
    return false;
  }

  checkOffset(game, currentPlayer, offsetX, offsetY, currentRow, currentColumn) {
  let count = 1;
  let currentX = currentRow + offsetX;
  let currentY = currentColumn + offsetY;

  while (this.validateCoordinateWithinBoard(currentX, currentY)) {
  // while (currentX < this.state.boardWidth && currentX >= 0 && currentY < this.state.boardHeight && currentY >= 0) {
    if (game[currentX][currentY] === currentPlayer) {
      currentX = currentX + offsetX;
      currentY = currentY + offsetY;
      count = count + 1;
    } else {
      break;
    } 
  }

  currentX = currentRow - offsetX;
  currentY = currentColumn - offsetY;
  while (this.validateCoordinateWithinBoard(currentX, currentY)) {
  // while (currentX < this.state.boardWidth && currentX >= 0 && currentY < this.state.boardHeight && currentY >= 0) {
    if (game[currentX][currentY] === currentPlayer) {
      currentX = currentX - offsetX;
      currentY = currentY - offsetY;
      count = count + 1;
    } else {
      break;
    } 
  }

  return (count >= this.state.target) ? true: false;
}

  // returns boolean
  validateMove(currentPlayer, i, j) {
    // todo: check number of players
    if (this.state.gameEnded) {
      window.alert('Game has already ended');
      return false;
    }
    const validPosition = this.state.boardHeight >= 0 && i < this.state.boardHeight && this.state.boardWidth >= 0 && j < this.state.boardWidth;
    if (!validPosition) {
      window.alert('Out of bounds');
      return false;
    }

    if (this.state.game[i][j] !== 0) {
      console.log('game is', this.state.game);
      window.alert('Position is already taken');
      return false;
    }

    const validPlayer = currentPlayer === this.state.playerNumber;
    if (!validPlayer) {
      window.alert('It is not your turn');
      return false;
    }
    return true;
  }

  makeMove(i, j) {
    return this.props.database.ref('games/' + this.state.gameId + '/events').push({ type: 'player_move', i, j });
  }

  currentPlayer() {
    return 1 + (_.flatten(this.state.game)).filter(x => x > 0).length % 2;
  }

  getCurrentPlayerColor() {
    return (this.currentPlayer() === 1) ? 'BLACK' : 'RED';
  }

  render() {
    let whosturn;
    let currentPlayer = this.currentPlayer();

    if (this.state.playerNumber === currentPlayer) {
      whosturn = `It is your turn. You are ${this.state.playerNumber === 1 ? 'black' : 'red'}.`;
    } else if (this.state.playerNumber > 2) {
      whosturn = 'You are spectating';
    } else {
      whosturn = `It is not your turn. You are ${this.state.playerNumber === 1 ? 'black' : 'red'}.`;
    }
    return (
        <div>
          <div className='gameInfo'>
            <h3>Welcome to Connect {this.state.target}! <br/> {whosturn}</h3> 
            {/* <h3>{whoareyou}</h3> */}
          </div>
          <canvas
            ref={this.canvasRef}
            width={this.state.boardWidth * WIDTH} height={this.state.boardHeight * WIDTH}
            onClick={(e) => this.handleClick(e)}
            onMouseMove={this.handleMove}>
          </canvas>
        </div>
    );
  }
}

function getPosition(x, y) {
  const toReturnX = Math.floor(y / WIDTH);
  const toReturnY = Math.floor(x / WIDTH);
  return [toReturnX, toReturnY];
}

function drawGame(ctx, game, boardWidth, boardHeight) {
  drawBoard(ctx, boardWidth, boardHeight);
  for (let i = 0; i < boardHeight; i++) {
    for (let j = 0; j < boardWidth; j++) {
      if (game[i][j] === 1) {
        fillSpace(ctx, i, j, 'Black');
      }
      if (game[i][j] === 2) {
        fillSpace(ctx, i, j, 'Red');
      }
    }
  }
}

export function drawBoard(ctx, boardWidth, boardHeight) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (var i = 0; i < boardHeight; i++) {
    for (var j = 0; j < boardWidth; j++) {
      ctx.strokeStyle = 'rgb(0, ' + Math.floor(255 - 42.5 * i) + ', ' + Math.floor(255 - 42.5 * j) + ')';
      ctx.beginPath();
      ctx.arc(CENTER_OFFSET + j * WIDTH, CENTER_OFFSET + i * WIDTH, RADIUS, 0, Math.PI * 2, true);
      ctx.stroke();
    }
  }
}

function fillSpace(ctx, i, j, color) {
  ctx.strokeStyle = 'rgb(0, ' + Math.floor(255 - 42.5 * i) + ', ' + Math.floor(255 - 42.5 * j) + ')';
  ctx.beginPath();
  ctx.arc(CENTER_OFFSET + j * WIDTH, CENTER_OFFSET + i * WIDTH, RADIUS, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill('evenodd');
}
