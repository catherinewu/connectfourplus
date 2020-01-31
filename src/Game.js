import React, { Component } from 'react';
// import logo from './logo.svg';
// import './App.css';
import _ from 'lodash';
// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";
import "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA75jf95SLU0sXpe-4729-8ST1w9nUBc-k",
  authDomain: "connectfourplus-7ce8d.firebaseapp.com",
  databaseURL: "https://connectfourplus-7ce8d.firebaseio.com",
  projectId: "connectfourplus-7ce8d",
  storageBucket: "connectfourplus-7ce8d.appspot.com",
  messagingSenderId: "470203261839",
  appId: "1:470203261839:web:b66e3580ade864120821fa",
  measurementId: "G-5TBX6M4Q92"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

const CENTER_OFFSET = 37.5;
const WIDTH = 75;
const RADIUS = 30;
// const GAME_HEIGHT = 7;
// const GAME_WIDTH = 6;

export class Game extends Component {
  constructor(props) {
    var { gameId, target, width, height, gravity } = props;
    // var board = [
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0],
    //   [0,0,0,0,0,0,0]];

    function writeGame(gameId) {
      database.ref('games/' + gameId).set({
        events: [],
      });
    }

    function createBoard(width, height) {
      var board = [];
      for (var i = 0; i < height; i++) {
        board.push(new Array(width).fill(0));
      }
      return board;
    }
     
    writeGame(gameId);

    super(props);
    this.state = {
      gameId,
      game: createBoard(width, height),
      gameWidth: width,
      gameHeight: height,
      gameTarget: target, 
      gravity,
    };

    this.canvasRef = React.createRef();
    this.handleClick = this.handleClick.bind(this);
    this.makeMove = this.makeMove.bind(this);
    this.currentPlayer = this.currentPlayer.bind(this);
    this.handleEvent = this.handleEvent.bind(this);

    database.ref('games/' + gameId + '/events').on("child_added", this.handleEvent);
  }

  handleEvent(snapshot, prevChildKey) {
    console.log('hi')
    var e = snapshot.val();

    const {i, j} = e;
    let game = _.cloneDeep(this.state.game);
    console.log(this.currentPlayer());

    game[i][j] = this.currentPlayer();
    console.log(game);
    this.setState({ game });
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
    drawGame(context, this.state.game, this.state.gameWidth, this.state.gameHeight);
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
    if (j < this.state.gameHeight && i < this.state.gameWidth) {
      console.log(i,j);
      this.makeMove(i, j);
      // fillSpace(this.canvasRef.current.getContext('2d'), i, j, this.getCurrentPlayerColor());
      // this.getNextPlayer();
    }
  }

  makeMove(i, j) {
    // update game board
    // const numMoves = _.size(this.state.game);
    if (!i || !j) {
      console.log(i, j)
      console.log('invalid move');
      return;
    }
    database.ref('games/' + this.state.gameId + '/events').push({ i, j });
    // draw game board
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

function drawGame(ctx, game, gameWidth, gameHeight) {
  drawBoard(ctx, gameWidth, gameHeight);
  for (let i = 0; i < gameHeight; i++) {
    for (let j = 0; j < gameWidth; j++) {
      if (game[i][j] === 1) {
        fillSpace(ctx, i, j, 'Black');
      }
      if (game[i][j] === 2) {
        fillSpace(ctx, i, j, 'Red');
      }
    }
  }
}

function drawBoard(ctx, gameWidth, gameHeight) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (var i = 0; i < gameHeight; i++) {
    for (var j = 0; j < gameWidth; j++) {
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
