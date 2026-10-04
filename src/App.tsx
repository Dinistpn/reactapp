import React, { Component } from 'react';

// Interfaces
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface AppState {
  // Navigation State
  activeTab: 'home' | 'tasks' | 'gallery' | 'game' | 'about';

  // Task State
  tasks: Task[];
  taskInput: string;
  editingTaskId: number | null;
  editingTaskText: string;

  // Tic-Tac-Toe State
  board: (string | null)[];
  xIsNext: boolean;
  scoreX: number;
  scoreO: number;
  gameHasEnded: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      activeTab: 'home',

      // Tasks
      tasks: [],
      taskInput: '',
      editingTaskId: null,
      editingTaskText: '',

      // Tic-Tac-Toe Game
      board: Array(9).fill(null),
      xIsNext: true,
      scoreX: 0,
      scoreO: 0,
      gameHasEnded: false,
    };
  }

  // Navigation Switcher
  setActiveTab = (tab: 'home' | 'tasks' | 'gallery' | 'game' | 'about') => {
    this.setState({ activeTab: tab });
  };

  // --- Task Handlers ---
  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ taskInput: e.target.value });
  };

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

  toggleTaskCompletion = (id: number) => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  startEditing = (task: Task) => {
    this.setState({
      editingTaskId: task.id,
      editingTaskText: task.text,
    });
  };

  cancelEditing = () => {
    this.setState({ editingTaskId: null, editingTaskText: '' });
  };

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

  deleteTask = (id: number) => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.filter((task) => task.id !== id),
    }));
  };

  // NEW: Delete all completed/selected tasks
  deleteAllSelectedTasks = () => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.filter((task) => !task.completed),
    }));
  };

  // --- Tic-Tac-Toe Handlers ---
  handleSquareClick = (index: number) => {
    const { board, xIsNext, gameHasEnded } = this.state;

    // Don't allow moves if square is taken or game already ended
    if (board[index] || gameHasEnded) return;

    const newBoard = board.slice();
    const currentPlayer = xIsNext ? 'X' : 'O';
    newBoard[index] = currentPlayer;

    const winner = this.calculateWinner(newBoard);

    this.setState((prevState) => {
      let updatedScoreX = prevState.scoreX;
      let updatedScoreO = prevState.scoreO;
      let isEnded = false;

      // Check if this move wins the game
      if (winner) {
        isEnded = true;
        if (winner === 'X') updatedScoreX += 1;
        if (winner === 'O') updatedScoreO += 1;
      } else if (newBoard.every((square) => square !== null)) {
        isEnded = true; // Board full (draw)
      }

      return {
        board: newBoard,
        xIsNext: !xIsNext,
        scoreX: updatedScoreX,
        scoreO: updatedScoreO,
        gameHasEnded: isEnded,
      };
    });
  };

  resetGame = () => {
    this.setState({
      board: Array(9).fill(null),
      xIsNext: true,
      gameHasEnded: false,
    });
  };

  resetScores = () => {
    this.setState({
      scoreX: 0,
      scoreO: 0,
      board: Array(9).fill(null),
      xIsNext: true,
      gameHasEnded: false,
    });
  };

  calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6],           // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  render() {
    const {
      activeTab,
      tasks,
      taskInput,
      editingTaskId,
      editingTaskText,
      board,
      xIsNext,
      scoreX,
      scoreO,
    } = this.state;

    const winner = this.calculateWinner(board);
    const isBoardFull = board.every((square) => square !== null);
    const completedCount = tasks.filter((t) => t.completed).length;

    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        {/* Navigation Bar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
          <div className="container">
            <button
              className="navbar-brand btn btn-link text-white text-decoration-none fw-bold"
              onClick={() => this.setActiveTab('home')}
            >
              React App
            </button>
            <div className="navbar-nav d-flex flex-row gap-3">
              <button
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === 'home' ? 'active fw-bold border-bottom' : ''
                }`}
                onClick={() => this.setActiveTab('home')}
              >
                Home
              </button>
              <button
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === 'tasks' ? 'active fw-bold border-bottom' : ''
                }`}
                onClick={() => this.setActiveTab('tasks')}
              >
                Tasks
              </button>
              <button
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === 'gallery' ? 'active fw-bold border-bottom' : ''
                }`}
                onClick={() => this.setActiveTab('gallery')}
              >
                Gallery
              </button>
              <button
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === 'game' ? 'active fw-bold border-bottom' : ''
                }`}
                onClick={() => this.setActiveTab('game')}
              >
                Tic-Tac-Toe
              </button>
              <button
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === 'about' ? 'active fw-bold border-bottom' : ''
                }`}
                onClick={() => this.setActiveTab('about')}
              >
                About
              </button>
            </div>
          </div>
        </nav>

        {/* Main Application Area */}
        <main className="container my-5 flex-grow-1" style={{ maxWidth: '800px' }}>
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="text-center py-5">
              <h1 className="display-4 fw-bold mb-3">Hello world!</h1>
              <p className="lead text-muted">
                Welcome to the React application. Use the menu above to manage tasks, view the photo gallery, or play Tic-Tac-Toe!
              </p>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <h3 className="mb-4 text-center">Task Tracker</h3>

              {/* Input Group */}
              <div className="input-group mb-3 shadow-sm">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-white" id="btnGroupAddon">
                    Introduce a Task
                  </span>
                </div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your task here..."
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

              {/* Bulk Action Controls */}
              {completedCount > 0 && (
                <div className="d-flex justify-content-end mb-3">
                  <button
                    className="btn btn-danger btn-sm shadow-sm"
                    onClick={this.deleteAllSelectedTasks}
                  >
                    Delete All Selected ({completedCount})
                  </button>
                </div>
              )}

              {/* Task List Container */}
              <div className="containerA">
                {tasks.length === 0 ? (
                  <div className="alert alert-info text-center shadow-sm" role="alert">
                    There are no tasks yet!
                  </div>
                ) : (
                  <ul className="list-group shadow-sm">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        {editingTaskId === task.id ? (
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
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div>
              <h3 className="mb-4 text-center">Photo Gallery</h3>
              <div className="row g-3">
                {[1011, 1015, 1018, 1025, 1039, 1043].map((imgId) => (
                  <div key={imgId} className="col-md-4 col-sm-6">
                    <div className="card shadow-sm">
                      <img
                        src={`https://picsum.photos/id/${imgId}/300/200`}
                        className="card-img-top"
                        alt={`Gallery Item ${imgId}`}
                      />
                      <div className="card-body p-2 text-center">
                        <small className="text-muted">Image #{imgId}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TIC-TAC-TOE GAME TAB */}
          {activeTab === 'game' && (
            <div className="text-center">
              <h3 className="mb-3">Tic-Tac-Toe</h3>

              {/* Scoreboard Card */}
              <div className="card mx-auto mb-4 p-3 shadow-sm" style={{ maxWidth: '320px' }}>
                <h5 className="card-title text-muted mb-2">Scoreboard</h5>
                <div className="d-flex justify-content-around align-items-center fs-4 fw-bold">
                  <div className="text-primary">
                    Player X: <span className="badge bg-primary">{scoreX}</span>
                  </div>
                  <div className="text-danger">
                    Player O: <span className="badge bg-danger">{scoreO}</span>
                  </div>
                </div>
              </div>

              {/* Game Status Message */}
              <div className="mb-3 fs-5">
                {winner ? (
                  <div className="alert alert-success">
                    🎉 Winner: <strong>Player {winner}</strong> (+1 point!)
                  </div>
                ) : isBoardFull ? (
                  <div className="alert alert-warning">It's a Draw!</div>
                ) : (
                  <div>
                    Next Turn: <strong>Player {xIsNext ? 'X' : 'O'}</strong>
                  </div>
                )}
              </div>

              {/* Game Grid */}
              <div
                className="d-grid mx-auto mb-4"
                style={{
                  gridTemplateColumns: 'repeat(3, 80px)',
                  gap: '8px',
                  width: '256px',
                }}
              >
                {board.map((value, idx) => (
                  <button
                    key={idx}
                    className="btn btn-outline-dark fw-bold display-6"
                    style={{ height: '80px', fontSize: '2rem' }}
                    onClick={() => this.handleSquareClick(idx)}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {/* Game Action Buttons */}
              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-secondary" onClick={this.resetGame}>
                  Next Round
                </button>
                <button className="btn btn-outline-danger" onClick={this.resetScores}>
                  Reset Scores
                </button>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="card p-4 shadow-sm">
              <h3 className="card-title mb-3">About This Application</h3>
              <p className="card-text">
                This is a React TypeScript application built with Bootstrap. It includes dynamic task management with bulk deletion, interactive navigation, a photo gallery, and a Tic-Tac-Toe game with scoreboard tracking.
              </p>
            </div>
          )}

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
