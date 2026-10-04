import React, { Component } from 'react';

// TypeScript interfaces for Task and AppState
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface AppState {
  tasks: Task[];
  taskInput: string;
  editingTaskId: number | null;
  editingTaskText: string;
  open: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      tasks: [],
      taskInput: '',
      editingTaskId: null,
      editingTaskText: '',
      open: true,
    };
  }

  // Handle typing in the input field
  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ taskInput: e.target.value });
  };

  // Add a new task
  addTask = () => {
    if (this.state.taskInput.trim() === '') return;

    const newTask: Task = {
      id: Date.now(),
      text: this.state.taskInput,
      completed: false,
    };

    this.setState((prevState) => ({
      tasks: [...prevState.tasks, newTask],
      taskInput: '',
    }));
  };

  // Toggle task completion
  toggleTaskCompletion = (id: number) => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  // Enable inline editing mode
  startEditing = (task: Task) => {
    this.setState({
      editingTaskId: task.id,
      editingTaskText: task.text,
    });
  };

  // Cancel editing mode
  cancelEditing = () => {
    this.setState({ editingTaskId: null, editingTaskText: '' });
  };

  // Save the edited task text
  saveTaskEdit = (id: number) => {
    if (this.state.editingTaskText.trim() === '') return;

    this.setState((prevState) => ({
      tasks: prevState.tasks.map((task) =>
        task.id === id ? { ...task, text: this.state.editingTaskText } : task
      ),
      editingTaskId: null,
      editingTaskText: '',
    }));
  };

  // Delete a task
  deleteTask = (id: number) => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.filter((task) => task.id !== id),
    }));
  };

  render() {
    const { tasks, taskInput, editingTaskId, editingTaskText } = this.state;

    return (
      <div className="d-flex flex-column min-vh-100">
        {/* Navigation Bar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <a className="navbar-brand" href="#home">
              Task Manager
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="#home">
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#tasks">
                    Tasks
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#about">
                    About
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="container my-4 flex-grow-1" style={{ maxWidth: '700px' }}>
          {/* Greeting Section */}
          <div className="text-center mb-4">
            <p className="lead fs-4">Hello world!</p>
            <p className="text-muted">Manage your daily tasks efficiently.</p>
          </div>

          {/* Task Input Group */}
          <div className="input-group mb-4">
            <div className="input-group-prepend">
              <span className="input-group-text" id="btnGroupAddon">
                Introduce a Task
              </span>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Input group example"
              aria-label="Input group example"
              aria-describedby="btnGroupAddon"
              value={taskInput}
              onChange={this.handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && this.addTask()}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.addTask}
            >
              Submit
            </button>
          </div>

          {/* Task List Container (containerA) */}
          <div className="containerA">
            {tasks.length === 0 ? (
              /* Displayed ONLY when there are no tasks */
              <div className="alert alert-info text-center" role="alert">
                There are no tasks yet!
              </div>
            ) : (
              <ul className="list-group">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    {editingTaskId === task.id ? (
                      /* Inline Task Edit Mode */
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={editingTaskText}
                          onChange={(e) =>
                            this.setState({ editingTaskText: e.target.value })
                          }
                          onKeyDown={(e) =>
                            e.key === 'Enter' && this.saveTaskEdit(task.id)
                          }
                        />
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => this.saveTaskEdit(task.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={this.cancelEditing}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      /* Standard Task Item View */
                      <>
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={task.completed}
                            onChange={() => this.toggleTaskCompletion(task.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span
                            style={{
                              textDecoration: task.completed
                                ? 'line-through'
                                : 'none',
                              color: task.completed ? '#6c757d' : '#212529',
                            }}
                          >
                            {task.text}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div>
                          <button
                            className="btn btn-sm btn-outline-warning me-2"
                            onClick={() => this.startEditing(task)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => this.deleteTask(task.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-3 mt-auto">
          <div className="container">
            <small>&copy; {new Date().getFullYear()} Dinistpn. All rights reserved.</small>
          </div>
        </footer>
      </div>
    );
  }
}

export default App;
