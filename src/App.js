import React, { Component } from 'react';
import _ from 'lodash';
import { Game } from './Game';

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
  }

  handleChange(event) {
    console.log(event.target.name)
    console.log(event.target.value)
    this.setState({[event.target.name]: event.target.value});
  }

  handleCheckBox(e) {
    this.setState({
      checked: e.target.checked
    })
  }

  handleSubmit(event) {
    const gameId = Math.floor(Math.random() * 1000000000);
    window.location.href = `/game?id=${gameId}`
    event.preventDefault();
  }
  render() { 

  }

  render() {
    if (this.state.gameId) {
      console.log('passing width + height:', this.state.width, this.state.height)
      return (
        <Game gameId={this.state.gameId} target={this.state.target} gravity={this.state.gravity} width={this.state.width} height={this.state.height}/>
      )
    } else {
      return (
        <form onSubmit={this.handleSubmit}>
          <label>
            Connect #?
            <input type="number" value={this.state.target} onChange={this.handleChange} />
          </label>
          <label>
            Gravity?
            <input type="checkbox" onChange={this.handleCheckBox} checked={this.state.checked} />
          </label>
          <label>
            Width?
            <input type="number" name="width" value={this.state.width} onChange={this.handleChange} />
          </label>
          <label>
            Height?
            <input type="number" name="height" value={this.state.height} onChange={this.handleChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      );
    }
  }
}

export default App;