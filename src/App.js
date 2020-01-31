import React, { Component } from 'react';
import _ from 'lodash';
import { Game, drawBoard } from './Game';
import './App.css';

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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      target: 4,
      gravity: false,
      width: 7,
      height: 7,
    };

    const page = window.location.pathname;
    if (page === '/game') {
      this.state['gameId'] = window.location.search.slice(4);
    }


    this.handleChange = this.handleChange.bind(this);
    this.handleCheckBox = this.handleCheckBox.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.drawBackground = this.drawBackground.bind(this);
  }

  componentDidMount() {
    const canvas = this.refs.background;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d")
    drawBoard(ctx, 20, 20)
  }

  handleChange(event) {
    console.log(event.target.name)
    console.log(event.target.value)
    this.setState({[event.target.name]: parseInt(event.target.value)});
  }

  handleCheckBox(e) {
    this.setState({
      checked: e.target.checked
    })
  }

  handleSubmit(event) {
    const gameId = Math.floor(Math.random() * 1000000000);

    database.ref('games/' + gameId).set({
      events: [{
        type: 'initialize',
        width: this.state.width,
        height: this.state.height,
        gravity: this.state.gravity, 
        target: this.state.target, 
      }]
    });

    window.location.href = `/game?id=${gameId}`
    event.preventDefault();
  }

  drawBackground() {
    var canvas = this.canvasRef.current;
    var ctx = canvas.getContext('2d');
    return drawBoard(ctx, 10, 10)
  };

  render() {
    if (this.state.gameId) {
      console.log('passing width + height:', this.state.width, this.state.height)
      return (
        <Game gameId={this.state.gameId} database={database}/>
      )
    } else {
      return (
        <div>
        <canvas ref='background' width="1600" height="800"></canvas>
        <div id='startgameform'>
        <form onSubmit={this.handleSubmit}>
          <label>
            Connect X?
            <input type="number" value={this.state.target} onChange={this.handleChange} />
          </label>
          <br />
          <label>
            Gravity? 
            <input type="checkbox" onChange={this.handleCheckBox} checked={this.state.checked} />
          </label>
          <br />
          <label>
            Board width: 
            <input type="number" name="width" value={this.state.width} onChange={this.handleChange} />
          </label>
          <br />
          <label>
            Board height:  
            <input type="number" name="height" value={this.state.height} onChange={this.handleChange} />
          </label>
          <br />
          <input type="submit" value="Submit" />
        </form>
        </div>
        </div>
      );
    }
  }
}

export default App;