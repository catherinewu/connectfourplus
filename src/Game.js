import React, { Component } from 'react';
import _ from 'lodash';
// // Firebase App (the core Firebase SDK) is always required and must be listed first
// import * as firebase from "firebase/app";
// import "firebase/database";

// const firebaseConfig = {
//   apiKey: "AIzaSyA75jf95SLU0sXpe-4729-8ST1w9nUBc-k",
//   authDomain: "connectfourplus-7ce8d.firebaseapp.com",
//   databaseURL: "https://connectfourplus-7ce8d.firebaseio.com",
//   projectId: "connectfourplus-7ce8d",
//   storageBucket: "connectfourplus-7ce8d.appspot.com",
//   messagingSenderId: "470203261839",
//   appId: "1:470203261839:web:b66e3580ade864120821fa",
//   measurementId: "G-5TBX6M4Q92"
// };

// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// var database = firebase.database();

const CENTER_OFFSET = 37.5;
const WIDTH = 75;
const RADIUS = 30;
// const GAME_HEIGHT = 7;
// const GAME_WIDTH = 6;

export class Game extends Component {
  constructor(props) {
    var { gameId, database } = props;
    // var board = [
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0]];

    // function writeGame(gameId) {
    //   database.ref('games/' + gameId).set({
    //     events: [],
    //   });
    // }

     
    // writeGame(gameId);

    super(props);
    this.state = {
      gameId,
    };

    this.canvasRef = React.createRef();
    this.handleClick = this.handleClick.bind(this);
    this.makeMove = this.makeMove.bind(this);
    this.currentPlayer = this.currentPlayer.bind(this);
    this.handleEvent = this.handleEvent.bind(this);
    this.createBoard = this.createBoard.bind(this);

    this.props.database.ref('games/' + gameId + '/events').on("child_added", this.handleEvent);
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
    this.draw();
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
    if (this.state.boardHeight >= 0 && i < this.state.boardHeight && this.state.boardWidth >= 0 && j < this.state.boardWidth) {
      console.log(i,j);
      this.makeMove(i, j);
      // fillSpace(this.canvasRef.current.getContext('2d'), i, j, this.getCurrentPlayerColor());
      // this.getNextPlayer();
    }
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
    if (this.currentPlayer() === 1) {
      return 'BLACK';
    } else {
      return 'RED';
    }
  }

  render() {
    return (
        <canvas
          ref={this.canvasRef}
          width="3000" height="3000"
          onClick={(e) => this.handleClick(e)}
          onMouseMove={this.handleMove}></canvas>
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

function drawBoard(ctx, boardWidth, boardHeight) {
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
