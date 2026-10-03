import React, { Component } from 'react';

// Define TypeScript interfaces for State and Task
interface Task {
  id: number;
  text: string;
}

interface AppState {
  tasks: Task[];
  taskInput: string;
  open: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      tasks: [],
      taskInput: '',
      open: true,
    };
  }

  // Handle typing in the input field
  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ taskInput: e.target.value });
  };

  // Handle adding a task to state
  addTask = () => {
    if (this.state.taskInput.trim() === '') return;

    const newTask: Task = {
      id: Date.now(),
      text: this.state.taskInput,
    };

    this.setState((prevState) => ({
      tasks: [...prevState.tasks, newTask],
      taskInput: '', // Clear input after submit
    }));
  };

  render() {
    return (
      <div className="container mt-4" style={{ maxWidth: '600px' }}>
        <h3>Task Tracker</h3>
        
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <span className="input-group-text" id="btnGroupAddon">
              Introduce a Task
            </span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Type a task here..."
            aria-label="Introduce a Task"
            aria-describedby="btnGroupAddon"
            value={this.state.taskInput}
            onChange={this.handleInputChange}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={this.addTask}
          >
            Submit
          </button>
        </div>

        {/* Display task list inside containerA */}
        <div className="containerA">
          <ul className="list-group">
            {this.state.tasks.map((task) => (
              <li key={task.id} className="list-group-item">
                {task.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default App;
