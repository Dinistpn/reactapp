import React, { Component } from 'react';

// Interfaces for component state and props
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface AudioTrack {
  id: number;
  title: string;
  artist: string;
  src: string;
}

interface AppState {
  // Navigation State
  activeTab: 'home' | 'tasks' | 'gallery' | 'game' | 'about';

  // Live Time
  currentTime: Date;

  // Task State
  tasks: Task[];
  taskInput: string;
  editingTaskId: number | null;
  editingTaskText: string;

  // Gallery Modal & Zoom & Pan State
  selectedImgIndex: number | null;
  zoomLevel: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  isFullscreen: boolean;

  // Music Player State
  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;

  // Tic-Tac-Toe State
  board: (string | null)[];
  xIsNext: boolean;
  scoreX: number;
  scoreO: number;
  gameHasEnded: boolean;
}

class App extends Component<{}, AppState> {
  private timerID?: NodeJS.Timeout;
  private audioRef: React.RefObject<HTMLAudioElement>;
  private sfxRef: React.RefObject<HTMLAudioElement>;
  private modalContainerRef: React.RefObject<HTMLDivElement>;

  // Direct Raw URLs for Assets residing on the gh-pages branch
  rawBranchUrl = 'https://raw.githubusercontent.com/Dinistpn/reactapp/gh-pages';

  // Gallery Images 1_img.jpg through 21_img.jpg from gh-pages/img/
  galleryImages = Array.from({ length: 21 }, (_, index) => {
    const num = index + 1;
    return {
      id: num,
      title: `Image ${num}`,
      src: `${this.rawBranchUrl}/img/${num}_img.jpg`,
      alt: `Gallery Photo ${num}`,
    };
  });

  // Background Musics 1.m4a and 2.m4a from gh-pages/sound/
  bgMusicTracks: AudioTrack[] = [
    {
      id: 1,
      title: 'Track 1',
      artist: 'Repository Track',
      src: `${this.rawBranchUrl}/sound/1.m4a`,
    },
    {
      id: 2,
      title: 'Track 2',
      artist: 'Repository Track',
      src: `${this.rawBranchUrl}/sound/2.m4a`,
    },
  ];

  // Game SFX from gh-pages/sound/
  sfx = {
    click: `${this.rawBranchUrl}/sound/mouseclick1.wav`,
    preparing: `${this.rawBranchUrl}/sound/preparing-the-match.mp3`,
    gameOver: `${this.rawBranchUrl}/sound/game-over.mp3`,
  };

  constructor(props: {}) {
    super(props);
    this.audioRef = React.createRef();
    this.sfxRef = React.createRef();
    this.modalContainerRef = React.createRef();

    this.state = {
      activeTab: 'home',
      currentTime: new Date(),

      // Tasks
      tasks: [
        { id: 1, text: 'Check out the photo gallery', completed: false },
        { id: 2, text: 'Play a round of Tic-Tac-Toe', completed: false },
      ],
      taskInput: '',
      editingTaskId: null,
      editingTaskText: '',

      // Gallery Modal & Pan / Zoom State
      selectedImgIndex: null,
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      isFullscreen: false,

      // Music Player
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.8,

      // Tic-Tac-Toe
      board: Array(9).fill(null),
      xIsNext: true,
      scoreX: 0,
      scoreO: 0,
      gameHasEnded: false,
    };
  }

  componentDidMount() {
    this.timerID = setInterval(() => {
      this.setState({ currentTime: new Date() });
    }, 1000);

    // Fullscreen change listener
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  componentWillUnmount() {
    if (this.timerID) clearInterval(this.timerID);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
  }

  // Handle browser full screen change
  handleFullscreenChange = () => {
    this.setState({ isFullscreen: !!document.fullscreenElement });
  };

  // Helper for triggering SFX
  playSFX = (src: string) => {
    if (this.sfxRef.current) {
      this.sfxRef.current.src = src;
      this.sfxRef.current.volume = this.state.volume;
      this.sfxRef.current.play().catch((err) => console.log('SFX Playback Error:', err));
    }
  };

  // Navigation Switcher
  setActiveTab = (tab: 'home' | 'tasks' | 'gallery' | 'game' | 'about') => {
    this.setState({ activeTab: tab });
  };

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

  deleteAllSelectedTasks = () => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.filter((task) => !task.completed),
    }));
  };

  openGalleryModal = (index: number) => {
    this.setState({
      selectedImgIndex: index,
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
    });
  };

  closeGalleryModal = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    this.setState({
      selectedImgIndex: null,
      zoomLevel: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
      isFullscreen: false,
    });
  };

  prevGalleryImage = () => {
    this.setState((prevState) => {
      if (prevState.selectedImgIndex === null) return null;
      const newIndex =
        prevState.selectedImgIndex === 0
          ? this.galleryImages.length - 1
          : prevState.selectedImgIndex - 1;
      return { selectedImgIndex: newIndex, zoomLevel: 1, panX: 0, panY: 0 };
    });
  };

  nextGalleryImage = () => {
    this.setState((prevState) => {
      if (prevState.selectedImgIndex === null) return null;
      const newIndex =
        (prevState.selectedImgIndex + 1) % this.galleryImages.length;
      return { selectedImgIndex: newIndex, zoomLevel: 1, panX: 0, panY: 0 };
    });
  };

  zoomIn = () => {
    this.setState((prevState) => ({
      zoomLevel: Math.min(prevState.zoomLevel + 0.5, 4),
    }));
  };

  zoomOut = () => {
    this.setState((prevState) => {
      const nextZoom = Math.max(prevState.zoomLevel - 0.5, 1);
      // Reset pan if zoomed back to 1
      return {
        zoomLevel: nextZoom,
        panX: nextZoom === 1 ? 0 : prevState.panX,
        panY: nextZoom === 1 ? 0 : prevState.panY,
      };
    });
  };

  resetZoom = () => {
    this.setState({ zoomLevel: 1, panX: 0, panY: 0 });
  };

  toggleFullscreen = () => {
    if (!this.modalContainerRef.current) return;

    if (!document.fullscreenElement) {
      this.modalContainerRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Mouse drag handlers for panning zoomed images
  handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (this.state.zoomLevel > 1) {
      e.preventDefault();
      this.setState({
        isDragging: true,
        dragStartX: e.clientX - this.state.panX,
        dragStartY: e.clientY - this.state.panY,
      });
    }
  };

  handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (this.state.isDragging && this.state.zoomLevel > 1) {
      e.preventDefault();
      this.setState({
        panX: e.clientX - this.state.dragStartX,
        panY: e.clientY - this.state.dragStartY,
      });
    }
  };

  handleMouseUpOrLeave = () => {
    if (this.state.isDragging) {
      this.setState({ isDragging: false });
    }
  };

  togglePlayPause = () => {
    const audio = this.audioRef.current;
    if (!audio) return;

    if (this.state.isPlaying) {
      audio.pause();
      this.setState({ isPlaying: false });
    } else {
      audio
        .play()
        .then(() => {
          this.setState({ isPlaying: true });
        })
        .catch((err) => console.log('Audio playback error:', err));
    }
  };

  handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    this.setState({ volume: newVol });
    if (this.audioRef.current) {
      this.audioRef.current.volume = newVol;
    }
  };

  changeTrack = (index: number) => {
    this.setState({ currentTrackIndex: index, isPlaying: true }, () => {
      if (this.audioRef.current) {
        this.audioRef.current.load();
        this.audioRef.current.play().catch((err) => console.log(err));
      }
    });
  };

  handleSquareClick = (index: number) => {
    const { board, xIsNext, gameHasEnded } = this.state;

    if (board[index] || gameHasEnded) return;

    // Trigger mouse click SFX
    this.playSFX(this.sfx.click);

    const newBoard = board.slice();
    const currentPlayer = xIsNext ? 'X' : 'O';
    newBoard[index] = currentPlayer;

    const winner = this.calculateWinner(newBoard);

    this.setState((prevState) => {
      let updatedScoreX = prevState.scoreX;
      let updatedScoreO = prevState.scoreO;
      let isEnded = false;

      if (winner) {
        isEnded = true;
        if (winner === 'X') updatedScoreX += 1;
        if (winner === 'O') updatedScoreO += 1;
        // Game Over sound effect
        this.playSFX(this.sfx.gameOver);
      } else if (newBoard.every((square) => square !== null)) {
        isEnded = true;
        // Draw sound effect
        this.playSFX(this.sfx.gameOver);
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
    // Play preparing match sound effect
    this.playSFX(this.sfx.preparing);

    this.setState({
      board: Array(9).fill(null),
      xIsNext: true,
      gameHasEnded: false,
    });
  };

  resetScores = () => {
    this.playSFX(this.sfx.preparing);

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
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
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
      currentTime,
      tasks,
      taskInput,
      editingTaskId,
      editingTaskText,
      selectedImgIndex,
      zoomLevel,
      panX,
      panY,
      isDragging,
      isFullscreen,
      currentTrackIndex,
      isPlaying,
      volume,
      board,
      xIsNext,
      scoreX,
      scoreO,
    } = this.state;

    const winner = this.calculateWinner(board);
    const isBoardFull = board.every((square) => square !== null);
    const completedCount = tasks.filter((t) => t.completed).length;
    const activeTrack = this.bgMusicTracks[currentTrackIndex];

    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        {/* Audio Elements */}
        <audio ref={this.audioRef} src={activeTrack.src} preload="metadata" />
        <audio ref={this.sfxRef} preload="auto" />

        {/* Top Navbar */}
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

        {/* Music Player Control Bar */}
        <div className="bg-secondary text-white py-2 shadow-sm">
          <div className="container d-flex flex-wrap justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">🎵 Background Music:</span>
              <small>{activeTrack.title}</small>
            </div>

            <div className="d-flex align-items-center gap-3">
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                value={currentTrackIndex}
                onChange={(e) => this.changeTrack(parseInt(e.target.value))}
              >
                {this.bgMusicTracks.map((track, idx) => (
                  <option key={track.id} value={idx}>
                    {track.title} ({track.src.split('/').pop()})
                  </option>
                ))}
              </select>

              <button
                className={`btn btn-sm ${isPlaying ? 'btn-warning' : 'btn-success'}`}
                onClick={this.togglePlayPause}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <div className="d-flex align-items-center gap-1">
                <small>🔊</small>
                <input
                  type="range"
                  className="form-range"
                  style={{ width: '80px' }}
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={this.handleVolumeChange}
                />
                <small>{Math.round(volume * 100)}%</small>
              </div>
            </div>
          </div>
        </div>

        {/* Main Application Container */}
        <main className="container my-4 flex-grow-1" style={{ maxWidth: '850px' }}>
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="text-center py-5">
              <h1 className="display-4 fw-bold mb-3">Hello world!</h1>
              
              {/* Live Clock Component */}
              <div className="card mx-auto my-4 p-3 shadow-sm bg-dark text-white" style={{ maxWidth: '300px' }}>
                <small className="text-muted text-uppercase tracking-wide">Current Time</small>
                <h2 className="fw-mono mt-1 mb-0">{currentTime.toLocaleTimeString()}</h2>
                <small className="text-secondary">{currentTime.toLocaleDateString()}</small>
              </div>

              <p className="lead text-muted">
                Welcome to the application. Use the navigation bar above to manage tasks, browse photos, listen to music, or play Tic-Tac-Toe!
              </p>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <h3 className="mb-4 text-center">Task Tracker</h3>

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

          {}
          {activeTab === 'gallery' && (
            <div>
              <h3 className="mb-2 text-center">Repository Photo Gallery (21 Images)</h3>
              <p className="text-center text-muted small mb-4">
                Click any image to expand. Zoom in to enable mouse drag panning or toggle full-screen mode!
              </p>

              <div className="row g-3">
                {this.galleryImages.map((img, idx) => (
                  <div key={img.id} className="col-md-4 col-sm-6">
                    <div
                      className="card shadow-sm h-100"
                      style={{ cursor: 'pointer' }}
                      onClick={() => this.openGalleryModal(idx)}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center bg-light"
                        style={{ height: '180px', overflow: 'hidden' }}
                      >
                        <img
                          src={img.src}
                          className="card-img-top mh-100 mw-100 object-fit-contain p-2"
                          alt={img.alt}
                        />
                      </div>
                      <div className="card-body p-2 text-center bg-white">
                        <small className="fw-semibold text-dark">{img.title}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lightbox / Modal with Zoom, Drag & Fullscreen Capabilities */}
              {selectedImgIndex !== null && (
                <div
                  ref={this.modalContainerRef}
                  className="modal show d-block"
                  style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1050 }}
                >
                  <div className={`modal-dialog modal-dialog-centered ${isFullscreen ? 'modal-fullscreen' : 'modal-lg'}`}>
                    <div className="modal-content bg-dark text-white border-0 h-100">
                      <div className="modal-header border-secondary">
                        <h5 className="modal-title">
                          {this.galleryImages[selectedImgIndex].title} ({selectedImgIndex + 1}/{this.galleryImages.length})
                        </h5>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          onClick={this.closeGalleryModal}
                        ></button>
                      </div>

                      {/* Modal Body with Pan / Drag Mouse Listeners */}
                      <div
                        className="modal-body text-center overflow-hidden d-flex align-items-center justify-content-center position-relative"
                        style={{
                          minHeight: '400px',
                          maxHeight: isFullscreen ? 'calc(100vh - 120px)' : '65vh',
                          userSelect: 'none',
                        }}
                      >
                        <img
                          src={this.galleryImages[selectedImgIndex].src}
                          alt={this.galleryImages[selectedImgIndex].alt}
                          className="img-fluid"
                          style={{
                            transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
                            maxHeight: isFullscreen ? '90vh' : '55vh',
                            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                          }}
                          onMouseDown={this.handleMouseDown}
                          onMouseMove={this.handleMouseMove}
                          onMouseUp={this.handleMouseUpOrLeave}
                          onMouseLeave={this.handleMouseUpOrLeave}
                          draggable={false}
                        />
                      </div>

                      {/* Controls Toolbar */}
                      <div className="modal-footer border-secondary justify-content-between flex-wrap gap-2">
                        {/* Zoom Controls */}
                        <div className="btn-group">
                          <button className="btn btn-outline-light btn-sm" onClick={this.zoomIn}>
                            🔍 Zoom In (+)
                          </button>
                          <button className="btn btn-outline-light btn-sm" onClick={this.zoomOut}>
                            🔎 Zoom Out (-)
                          </button>
                          <button className="btn btn-outline-secondary btn-sm" onClick={this.resetZoom}>
                            Reset ({Math.round(zoomLevel * 100)}%)
                          </button>
                        </div>

                        {/* Fullscreen & Drag Helper Indicator */}
                        <div className="d-flex align-items-center gap-2">
                          {zoomLevel > 1 && (
                            <span className="badge bg-info text-dark">
                              🖱️ Drag with mouse to pan
                            </span>
                          )}
                          <button
                            className={`btn btn-sm ${isFullscreen ? 'btn-warning' : 'btn-outline-info'}`}
                            onClick={this.toggleFullscreen}
                          >
                            {isFullscreen ? '📉 Exit Fullscreen' : '⛶ Fullscreen'}
                          </button>
                        </div>

                        {/* Navigation Controls */}
                        <div className="btn-group">
                          <button className="btn btn-primary btn-sm" onClick={this.prevGalleryImage}>
                            ⬅ Previous
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={this.nextGalleryImage}>
                            Next ➡️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIC-TAC-TOE GAME TAB */}
          {activeTab === 'game' && (
            <div className="text-center">
              <h3 className="mb-3">Tic-Tac-Toe</h3>

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
                This React application features dynamic tasks, interactive background music and game SFX playback, a 21-image gallery modal viewer with fullscreen mode and mouse-drag panning when zoomed, live clock display, and a full Tic-Tac-Toe game.
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
