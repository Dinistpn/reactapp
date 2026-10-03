import React, { Component } from 'react';

// Define TypeScript interfaces for Task and AppState
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
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      tasks: [],
      taskInput: '',
      editingTaskId: null,
      editingTaskText: '',
    };
  }

  // Handle typing in the "Add Task" input
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

  // Toggle completed status for a task
  toggleTaskCompletion = (id: number) => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  // Enable Edit Mode for a task
  startEditing = (task: Task) => {
    this.setState({
      editingTaskId: task.id,
      editingTaskText: task.text,
    });
  };

  // Cancel Edit Mode
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
      <div className="container mt-4" style={{ maxWidth: '650px' }}>
        <h3 className="mb-4">Task Tracker</h3>

        {/* Input Form */}
        <div className="input-group mb-4">
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
            value={taskInput}
            onChange={this.handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && this.addTask()}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={this.addTask}
          >
            Submit
          </button>
        </div>

        {/* Task List Container */}
        <div className="containerA">
          {tasks.length === 0 ? (
            /* Message shown when no tasks exist */
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
                    /* Inline Edit View */
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
                    /* Standard Task View */
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
      </div>
    );
  }
}

export default App;
