import React, { Component } from 'react';

// Interfaces
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
  navMenuOpen: boolean;

  // Live Time
  currentTime: Date;

  // Task State
  tasks: Task[];
  taskInput: string;
  editingTaskId: number | null;
  editingTaskText: string;

  // Gallery Modal, Zoom & Drag State
  selectedImgIndex: number | null;
  zoomLevel: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  position: { x: number; y: number };

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

  // Direct Raw URLs for Assets in the gh-pages branch
  rawBranchUrl = 'https://dinistpn.github.io/reactapp';

  // Gallery Images 1_img.jpg through 26_img.jpg
  galleryImages = Array.from({ length: 26 }, (_, index) => {
    const num = index + 1;
    return {
      id: num,
      title: `Image ${num}`,
      src: `${process.env.PUBLIC_URL}/img/${num}_img.jpg`,
      alt: `Image ${num}`,
    };
  });

  // Background Musics 1.m4a and 2.m4a
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

  // Game SFX
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
      navMenuOpen: false,
      currentTime: new Date(),

      // Tasks
      tasks: [],
      taskInput: '',
      editingTaskId: null,
      editingTaskText: '',

      // Gallery Modal & Zoom & Drag
      selectedImgIndex: null,
      zoomLevel: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      position: { x: 0, y: 0 },

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
  }

  componentWillUnmount() {
    if (this.timerID) clearInterval(this.timerID);
  }

  // Play SFX helper
  playSFX = (src: string) => {
    if (this.sfxRef.current) {
      this.sfxRef.current.src = src;
      this.sfxRef.current.volume = this.state.volume;
      this.sfxRef.current.play().catch((err) => console.log('SFX Playback Error:', err));
    }
  };

  // Navigation Switcher
  setActiveTab = (tab: 'home' | 'tasks' | 'gallery' | 'game' | 'about') => {
    this.setState({ activeTab: tab, navMenuOpen: false });
  };

  toggleNavMenu = () => {
    this.setState((prev) => ({ navMenuOpen: !prev.navMenuOpen }));
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

  deleteAllSelectedTasks = () => {
    this.setState((prevState) => ({
      tasks: prevState.tasks.filter((task) => !task.completed),
    }));
  };

  // --- Gallery & Zoom & Drag Handlers ---
  openGalleryModal = (index: number) => {
    this.setState({
      selectedImgIndex: index,
      zoomLevel: 1,
      position: { x: 0, y: 0 },
    });
  };

  closeGalleryModal = () => {
    this.setState({
      selectedImgIndex: null,
      zoomLevel: 1,
      position: { x: 0, y: 0 },
    });
  };

  toggleFullScreen = () => {
    const container = this.modalContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  prevGalleryImage = () => {
    this.setState((prevState) => {
      if (prevState.selectedImgIndex === null) return null;
      const newIndex =
        prevState.selectedImgIndex === 0
          ? this.galleryImages.length - 1
          : prevState.selectedImgIndex - 1;
      return { selectedImgIndex: newIndex, zoomLevel: 1, position: { x: 0, y: 0 } };
    });
  };

  nextGalleryImage = () => {
    this.setState((prevState) => {
      if (prevState.selectedImgIndex === null) return null;
      const newIndex =
        (prevState.selectedImgIndex + 1) % this.galleryImages.length;
      return { selectedImgIndex: newIndex, zoomLevel: 1, position: { x: 0, y: 0 } };
    });
  };

  zoomIn = () => {
    this.setState((prevState) => ({
      zoomLevel: Math.min(prevState.zoomLevel + 0.25, 3.5),
    }));
  };

  zoomOut = () => {
    this.setState((prevState) => {
      const newZoom = Math.max(prevState.zoomLevel - 0.25, 0.5);
      return {
        zoomLevel: newZoom,
        position: newZoom <= 1 ? { x: 0, y: 0 } : prevState.position,
      };
    });
  };

  resetZoom = () => {
    this.setState({ zoomLevel: 1, position: { x: 0, y: 0 } });
  };

  // Dragging / Panning Handlers (Mouse)
  handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (this.state.zoomLevel > 1) {
      e.preventDefault();
      this.setState({
        isDragging: true,
        dragStart: {
          x: e.clientX - this.state.position.x,
          y: e.clientY - this.state.position.y,
        },
      });
    }
  };

  handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (this.state.isDragging && this.state.zoomLevel > 1) {
      e.preventDefault();
      this.setState({
        position: {
          x: e.clientX - this.state.dragStart.x,
          y: e.clientY - this.state.dragStart.y,
        },
      });
    }
  };

  handleMouseUp = () => {
    if (this.state.isDragging) {
      this.setState({ isDragging: false });
    }
  };

  // Dragging / Panning Handlers (Mobile Touch)
  handleTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    if (this.state.zoomLevel > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      this.setState({
        isDragging: true,
        dragStart: {
          x: touch.clientX - this.state.position.x,
          y: touch.clientY - this.state.position.y,
        },
      });
    }
  };

  handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (this.state.isDragging && this.state.zoomLevel > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      this.setState({
        position: {
          x: touch.clientX - this.state.dragStart.x,
          y: touch.clientY - this.state.dragStart.y,
        },
      });
    }
  };

  handleTouchEnd = () => {
    if (this.state.isDragging) {
      this.setState({ isDragging: false });
    }
  };

  // --- Audio Player Handlers ---
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
        .catch((err) => console.log('Audio error:', err));
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

  // --- Tic-Tac-Toe Handlers ---
  handleSquareClick = (index: number) => {
    const { board, xIsNext, gameHasEnded } = this.state;

    if (board[index] || gameHasEnded) return;

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
        this.playSFX(this.sfx.gameOver);
      } else if (newBoard.every((square) => square !== null)) {
        isEnded = true;
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
      navMenuOpen,
      currentTime,
      tasks,
      taskInput,
      editingTaskId,
      editingTaskText,
      selectedImgIndex,
      zoomLevel,
      isDragging,
      position,
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
      <div className="d-flex flex-column min-vh-100 bg-light overflow-x-hidden">
        {/* Audio Elements */}
        <audio ref={this.audioRef} src={activeTrack.src} preload="metadata" />
        <audio ref={this.sfxRef} preload="auto" />

        {/* Mobile-Responsive Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
          <div className="container-fluid px-3">
            <button
              className="navbar-brand btn btn-link text-white text-decoration-none fw-bold fs-5 p-0"
              onClick={() => this.setActiveTab('home')}
            >
              React App
            </button>

            {/* Mobile Toggler Button */}
            <button
              className="navbar-toggler border-0"
              type="button"
              onClick={this.toggleNavMenu}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className={`collapse navbar-collapse ${navMenuOpen ? 'show' : ''}`}>
              <div className="navbar-nav ms-auto gap-1 gap-lg-3 pt-2 pt-lg-0">
                <button
                  className={`nav-link btn btn-link text-start text-decoration-none px-3 py-2 ${
                    activeTab === 'home' ? 'active fw-bold text-white bg-primary bg-opacity-25 rounded' : 'text-light'
                  }`}
                  onClick={() => this.setActiveTab('home')}
                >
                  Home
                </button>
                <button
                  className={`nav-link btn btn-link text-start text-decoration-none px-3 py-2 ${
                    activeTab === 'tasks' ? 'active fw-bold text-white bg-primary bg-opacity-25 rounded' : 'text-light'
                  }`}
                  onClick={() => this.setActiveTab('tasks')}
                >
                  Tasks
                </button>
                <button
                  className={`nav-link btn btn-link text-start text-decoration-none px-3 py-2 ${
                    activeTab === 'gallery' ? 'active fw-bold text-white bg-primary bg-opacity-25 rounded' : 'text-light'
                  }`}
                  onClick={() => this.setActiveTab('gallery')}
                >
                  Gallery
                </button>
                <button
                  className={`nav-link btn btn-link text-start text-decoration-none px-3 py-2 ${
                    activeTab === 'game' ? 'active fw-bold text-white bg-primary bg-opacity-25 rounded' : 'text-light'
                  }`}
                  onClick={() => this.setActiveTab('game')}
                >
                  Tic-Tac-Toe
                </button>
                <button
                  className={`nav-link btn btn-link text-start text-decoration-none px-3 py-2 ${
                    activeTab === 'about' ? 'active fw-bold text-white bg-primary bg-opacity-25 rounded' : 'text-light'
                  }`}
                  onClick={() => this.setActiveTab('about')}
                >
                  About
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Music Player Bar */}
        <div className="bg-secondary text-white py-2 shadow-sm">
          <div className="container-fluid px-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-semibold">🎵 Music:</span>
              <small className="text-truncate" style={{ maxWidth: '150px' }}>
                {activeTrack.title}
              </small>
            </div>

            <div className="d-flex align-items-center justify-content-between w-100 w-sm-auto gap-2">
              <select
                className="form-select form-select-sm bg-dark text-white border-0"
                style={{ width: '110px' }}
                value={currentTrackIndex}
                onChange={(e) => this.changeTrack(parseInt(e.target.value))}
              >
                {this.bgMusicTracks.map((track, idx) => (
                  <option key={track.id} value={idx}>
                    {track.title}
                  </option>
                ))}
              </select>

              <button
                className={`btn btn-sm px-3 ${isPlaying ? 'btn-warning' : 'btn-success'}`}
                onClick={this.togglePlayPause}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>

              <div className="d-flex align-items-center gap-1">
                <small>🔊</small>
                <input
                  type="range"
                  className="form-range"
                  style={{ width: '60px' }}
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={this.handleVolumeChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <main className="container-fluid px-3 my-3 flex-grow-1 mx-auto" style={{ maxWidth: '850px' }}>
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="text-center py-4 py-md-5">
              <h1 className="display-5 fw-bold mb-3">Hello world!</h1>
              
              {/* Live Clock Card */}
              <div className="card mx-auto my-4 p-3 shadow-sm bg-dark text-white" style={{ maxWidth: '280px' }}>
                <small className="text-muted text-uppercase tracking-wide">Current Time</small>
                <h2 className="fw-mono mt-1 mb-0 fs-3">{currentTime.toLocaleTimeString()}</h2>
                <small className="text-secondary">{currentTime.toLocaleDateString()}</small>
              </div>

              <p className="lead text-muted fs-6 px-2">
                Welcome to the mobile-optimized React application. Manage tasks, view photos with zoom and pan gestures, listen to music, or play Tic-Tac-Toe on any device!
              </p>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <h3 className="mb-3 text-center">Task Tracker</h3>

              <div className="input-group mb-3 shadow-sm">
                <input
                  type="text"
                  className="form-control form-control-lg fs-6"
                  placeholder="Type your task here..."
                  aria-label="Introduce a Task"
                  value={taskInput}
                  onChange={this.handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && this.addTask()}
                />
                <button
                  type="button"
                  className="btn btn-primary px-3"
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
                    Delete Selected ({completedCount})
                  </button>
                </div>
              )}

              <div className="containerA">
                {tasks.length === 0 ? (
                  <div className="alert alert-info text-center shadow-sm py-3" role="alert">
                    There are no tasks yet!
                  </div>
                ) : (
                  <ul className="list-group shadow-sm">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 py-2 px-3"
                      >
                        {editingTaskId === task.id ? (
                          <div className="input-group w-100">
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
                            <div className="d-flex align-items-center w-100 text-break">
                              <input
                                type="checkbox"
                                className="form-check-input me-3 flex-shrink-0"
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                                checked={task.completed}
                                onChange={() => this.toggleTaskCompletion(task.id)}
                              />
                              <span
                                style={{
                                  textDecoration: task.completed ? 'line-through' : 'none',
                                  color: task.completed ? '#6c757d' : '#212529',
                                }}
                              >
                                {task.text}
                              </span>
                            </div>

                            <div className="d-flex gap-2 ms-auto">
                              <button
                                className="btn btn-sm btn-outline-warning"
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
              <h3 className="mb-2 text-center">Photo Gallery</h3>
              <p className="text-center text-muted small mb-3">
                Tap an image for Full Screen, Zooming, and Drag/Touch Panning.
              </p>

              {/* Mobile-Optimized Grid Layout */}
              <div className="row g-2 g-sm-3">
                {this.galleryImages.map((img, idx) => (
                  <div key={img.id} className="col-6 col-sm-4 col-md-3">
                    <div
                      className="card shadow-sm h-100 border-0"
                      style={{ cursor: 'pointer' }}
                      onClick={() => this.openGalleryModal(idx)}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center bg-light rounded"
                        style={{ height: '130px', overflow: 'hidden' }}
                      >
                        <img
                          src={img.src}
                          className="card-img-top mh-100 mw-100 object-fit-cover"
                          alt={img.alt}
                        />
                      </div>
                      <div className="card-body p-2 text-center bg-white">
                        <small className="fw-semibold text-dark d-block text-truncate">
                          {img.title}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fullscreen & Drag Lightbox Modal */}
              {selectedImgIndex !== null && (
                <div
                  ref={this.modalContainerRef}
                  className="modal show d-block"
                  style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 1050 }}
                  onMouseMove={this.handleMouseMove}
                  onMouseUp={this.handleMouseUp}
                  onTouchMove={this.handleTouchMove}
                  onTouchEnd={this.handleTouchEnd}
                >
                  <div className="modal-dialog modal-dialog-centered modal-lg my-0 my-sm-auto min-vh-100 d-flex align-items-center">
                    <div className="modal-content bg-dark text-white border-0 shadow-lg">
                      <div className="modal-header border-secondary py-2 px-3">
                        <h6 className="modal-title text-truncate me-auto">
                          {this.galleryImages[selectedImgIndex].title} ({selectedImgIndex + 1}/{this.galleryImages.length})
                        </h6>
                        <button
                          type="button"
                          className="btn btn-outline-light btn-sm me-2 py-0 px-2"
                          onClick={this.toggleFullScreen}
                          title="Toggle Fullscreen"
                        >
                          ⛶
                        </button>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          onClick={this.closeGalleryModal}
                        ></button>
                      </div>

                      <div
                        className="modal-body text-center overflow-hidden p-0 d-flex align-items-center justify-content-center"
                        style={{ height: '60vh', minHeight: '300px', userSelect: 'none' }}
                      >
                        <img
                          src={this.galleryImages[selectedImgIndex].src}
                          alt={this.galleryImages[selectedImgIndex].alt}
                          onMouseDown={this.handleMouseDown}
                          onTouchStart={this.handleTouchStart}
                          style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                          }}
                        />
                      </div>

                      <div className="modal-footer border-secondary justify-content-between flex-wrap gap-2 py-2 px-3">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-light" onClick={this.zoomIn}>
                            ➕ Zoom In
                          </button>
                          <button className="btn btn-outline-light" onClick={this.zoomOut}>
                            ➖ Zoom Out
                          </button>
                          <button className="btn btn-outline-secondary" onClick={this.resetZoom}>
                            Reset ({Math.round(zoomLevel * 100)}%)
                          </button>
                        </div>

                        <div className="btn-group btn-group-sm ms-auto">
                          <button className="btn btn-primary" onClick={this.prevGalleryImage}>
                            ⬅ Prev
                          </button>
                          <button className="btn btn-primary" onClick={this.nextGalleryImage}>
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
            <div className="text-center py-2">
              <h3 className="mb-3">Tic-Tac-Toe</h3>

              <div className="card mx-auto mb-3 p-2 shadow-sm" style={{ maxWidth: '300px' }}>
                <h6 className="card-title text-muted mb-2">Scoreboard</h6>
                <div className="d-flex justify-content-around align-items-center fs-5 fw-bold">
                  <div className="text-primary">
                    Player X: <span className="badge bg-primary">{scoreX}</span>
                  </div>
                  <div className="text-danger">
                    Player O: <span className="badge bg-danger">{scoreO}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3 fs-6">
                {winner ? (
                  <div className="alert alert-success py-2 px-3">
                    🎉 Winner: <strong>Player {winner}</strong>
                  </div>
                ) : isBoardFull ? (
                  <div className="alert alert-warning py-2 px-3">It's a Draw!</div>
                ) : (
                  <div>
                    Next Turn: <strong>Player {xIsNext ? 'X' : 'O'}</strong>
                  </div>
                )}
              </div>

              {/* Mobile Touch Grid */}
              <div
                className="d-grid mx-auto mb-4"
                style={{
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '280px',
                }}
              >
                {board.map((value, idx) => (
                  <button
                    key={idx}
                    className="btn btn-outline-dark fw-bold rounded shadow-sm d-flex align-items-center justify-content-center"
                    style={{ height: '80px', fontSize: '2.2rem' }}
                    onClick={() => this.handleSquareClick(idx)}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <div className="d-flex justify-content-center gap-2">
                <button className="btn btn-secondary btn-sm px-3" onClick={this.resetGame}>
                  Next Round
                </button>
                <button className="btn btn-outline-danger btn-sm px-3" onClick={this.resetScores}>
                  Reset Scores
                </button>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="py-3">
              <h3 className="mb-3 text-center">About This App</h3>
              <div className="card shadow-sm p-4 bg-white rounded">
                <p>
                  This application is a feature-rich React TypeScript web application built with Bootstrap. It showcases component state management, responsive UI design, gesture handling, and media integration.
                </p>
                <h5 className="mt-3">Features Included:</h5>
                <ul>
                  <li><strong>Live Time Display:</strong> Real-time clock updating every second.</li>
                  <li><strong>Task Tracker:</strong> Full CRUD capability for tasks with edit, complete, delete, and bulk delete features.</li>
                  <li><strong>Photo Gallery:</strong> Responsive grid displaying 26 images with dynamic modal lightbox supporting zoom (in/out/reset), fullscreen toggle, and touch/mouse panning.</li>
                  <li><strong>Background Music Player:</strong> Built-in audio controller with play/pause, volume control, and track switcher.</li>
                  <li><strong>Tic-Tac-Toe Game:</strong> Interactive 2-player game complete with sound effects, automatic winner detection, draw state, score persistence, and round resets.</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }
}

export default App;
