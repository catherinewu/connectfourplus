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
    };

    this.canvasRef = React.createRef();
    this.handleClick = this.handleClick.bind(this);
    this.makeMove = this.makeMove.bind(this);
    this.currentPlayer = this.currentPlayer.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.createBoard = this.createBoard.bind(this);
    this.calculatePlayerNumber = this.calculatePlayerNumber.bind(this);
    this.validateMove = this.validateMove.bind(this);

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
      console.log(this.currentPlayer());
  
      game[i][j] = this.currentPlayer();
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
        window.alert('sorry, enough players already. you are just watching');
        this.state.playerNumber = 0;
      } else {
        window.alert('you are added to the game as player 2');
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
    console.log('componentDidUpdate')
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
    const [i, j] = getPosition(e.pageX, e.pageY);
    const {ghost} = this.state;
    if (!ghost || ghost.i !== i || ghost.j !== j) {
      this.setState({ ghost: {i, j} });
    }
  }

  handleClick(event) {
    var x = event.pageX,
        y = event.pageY;
    const [i, j] = getPosition(x, y);
    console.log('position is ', i, j);

    // validate turn 
    const valid = this.validateMove(i, j);
    if (valid) {
      console.log('making move');
      this.makeMove(i, j);
    }
  }

  // returns boolean
  validateMove(i, j) {
    const validPosition = this.state.boardHeight >= 0 && i < this.state.boardHeight && this.state.boardWidth >= 0 && j < this.state.boardWidth;
    if (!validPosition) {
      window.alert('position is not valid');
      return false;
    }
    const validPlayer = this.currentPlayer() === this.state.playerNumber;
    if (!validPlayer) {
      window.alert(`this.currentPlayer ${this.currentPlayer()} does not equal this.state.playerNumber ${this.state.playerNumber}`);
      return false;
    }
    return true;
  }

  makeMove(i, j) {
    // if (!i || !j) {
    //   console.log(i, j)
    //   console.log('invalid move');
    //   return;
    // }
    this.props.database.ref('games/' + this.state.gameId + '/events').push({ type: 'player_move', i, j });
  }

  currentPlayer() {
    return 1 + (_.flatten(this.state.game)).filter(x => x > 0).length % 2;
  }

  getCurrentPlayerColor() {
    return (this.currentPlayer() === 1) ? 'BLACK' : 'RED';
  }

  render() {
    var whosturn = `It is Player ${(this.currentPlayer() === 1) ? 1 : 2}'s turn`;
    return (
        <div>
        {/* <h3>You're playing connect {this.state.target}!</h3> */}
        {/* <h3>{whosturn}</h3> */}
        <canvas
          ref={this.canvasRef}
          width="3000" height="3000"
          onClick={(e) => this.handleClick(e)}
          onMouseMove={this.handleMove}></canvas>
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
