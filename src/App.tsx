
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

type TabName = 'home' | 'tasks' | 'gallery' | 'game' | 'about';

interface GalleryImageData {
  id: number;
  title: string;
  description: string;
  fileName: string;
  src: string;
  alt: string;
}

class GalleryImage implements GalleryImageData {
  constructor(
    public id: number,
    public title: string,
    public description: string,
    public fileName: string,
    public src: string,
    public alt: string
  ) {}
}

interface AppState {
  activeTab: TabName;
  navMenuOpen: boolean;
  currentTime: Date;

  tasks: Task[];
  taskInput: string;
  editingTaskId: number | null;
  editingTaskText: string;

  selectedImgIndex: number | null;
  zoomLevel: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  position: { x: number; y: number };
  hiddenDescriptionIds: number[];

  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;

  board: (string | null)[];
  xIsNext: boolean;
  scoreX: number;
  scoreO: number;
  gameHasEnded: boolean;
}

class App extends Component<{}, AppState> {
  private timerID?: ReturnType<typeof setInterval>;
  private audioRef: React.RefObject<HTMLAudioElement>;
  private sfxRef: React.RefObject<HTMLAudioElement>;
  private modalContainerRef: React.RefObject<HTMLDivElement>;

  baseUrl = process.env.PUBLIC_URL || '.';

  // Gallery titles and descriptions
  private galleryDetails: {
    title: string;
    description: string;
  }[] = [
    {
      title: 'Venice',
      description: 'A beautiful view from Venice.',
    },
    {
      title: 'Praia da Barra',
      description: 'View from Pier in Portugal beach.',
    },
    {
      title: 'Warsaw',
      description:
        'One of the most iconic buildings in the Capital of Poland, despite the past.',
    },
    {
      title: 'Praia da Barra',
      description: 'View from the beach in Portugal.',
    },
    {
      title: 'Mountain Landscape',
      description: 'Oil painting with mountains.',
    },
    {
      title: 'Bay',
      description: 'Artistic oil painting of an imaginary bay.',
    },
    {
      title: 'View from ruins',
      description: 'Painting of old ruins.',
    },
    {
      title: 'Bay from the top',
      description: 'Oil painting of a bay from the top.',
    },
    {
      title: 'Venice Lagoon Island',
      description: 'An island in the lagoon of Venice.',
    },
    {
      title: 'Oriental',
      description: 'Oil painting of an old ruin.',
    },
    {
      title: 'Mountain',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'Mountains passage',
      description: 'A beautiful view of a mountain passage.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
    {
      title: 'Mountain Landscape',
      description: 'A beautiful view of the mountains at sunset.',
    },
    {
      title: 'City at Night',
      description: 'A city skyline illuminated after dark.',
    },
  ];

  galleryImages: GalleryImage[] = this.galleryDetails.map(
    (details, index) => {
      const num = index + 1;
      const fileName = `${num}_img.jpg`;

      return new GalleryImage(
        num,
        details.title,
        details.description,
        fileName,
        `${this.baseUrl}/img/${fileName}`,
        details.title
      );
    }
  );

  bgMusicTracks: AudioTrack[] = [
    {
      id: 1,
      title: 'Track 1',
      artist: 'Repository Track',
      src: `${this.baseUrl}/sound/1.m4a`,
    },
    {
      id: 2,
      title: 'Track 2',
      artist: 'Repository Track',
      src: `${this.baseUrl}/sound/2.m4a`,
    },
  ];

  sfx = {
    click: `${this.baseUrl}/sound/mouseclick1.wav`,
    preparing: `${this.baseUrl}/sound/preparing-the-match.mp3`,
    gameOver: `${this.baseUrl}/sound/game-over.mp3`,
  };

  constructor(props: {}) {
    super(props);

    this.audioRef = React.createRef<HTMLAudioElement>();
    this.sfxRef = React.createRef<HTMLAudioElement>();
    this.modalContainerRef = React.createRef<HTMLDivElement>();

    this.state = {
      activeTab: 'home',
      navMenuOpen: false,
      currentTime: new Date(),

      tasks: [],
      taskInput: '',
      editingTaskId: null,
      editingTaskText: '',

      selectedImgIndex: null,
      zoomLevel: 1,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      position: { x: 0, y: 0 },
      hiddenDescriptionIds: [],

      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.8,

      board: Array(25).fill(null),
      xIsNext: true,
      scoreX: 0,
      scoreO: 0,
      gameHasEnded: false,
    };
  }

  private getBasePath = () => {
    const publicUrl = process.env.PUBLIC_URL;
    return publicUrl && publicUrl !== '.'
      ? publicUrl.replace(/\/$/, '')
      : '';
  };

  private tabToPath = (tab: TabName) => {
    const basePath = this.getBasePath();
    const route = tab === 'home' ? '/' : `/${tab}`;
    return `${basePath}${route}`;
  };

  private handlePopState = () => {
    const basePath = this.getBasePath();
    let path = window.location.pathname;

    if (basePath && path.startsWith(basePath)) {
      path = path.slice(basePath.length) || '/';
    }

    path = path.replace(/\/+$/, '') || '/';

    const routes: Record<string, TabName> = {
      '/': 'home',
      '/home': 'home',
      '/tasks': 'tasks',
      '/gallery': 'gallery',
      '/game': 'game',
      '/about': 'about',
    };

    this.setState({
      activeTab: routes[path] || 'home',
      navMenuOpen: false,
    });
  };

  componentDidMount() {
    this.handlePopState();
    window.addEventListener('popstate', this.handlePopState);

    this.timerID = setInterval(() => {
      this.setState({ currentTime: new Date() });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timerID) clearInterval(this.timerID);
    window.removeEventListener('popstate', this.handlePopState);

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }

  playSFX = (src: string) => {
    if (this.sfxRef.current) {
      this.sfxRef.current.src = src;
      this.sfxRef.current.volume = this.state.volume;
      this.sfxRef.current
        .play()
        .catch((err) => console.log('SFX Playback Error:', err));
    }
  };

  setActiveTab = (tab: TabName) => {
    const url = this.tabToPath(tab);

    if (window.location.pathname !== url) {
      window.history.pushState({}, '', url);
    }

    this.setState({ activeTab: tab, navMenuOpen: false });
  };

  toggleNavMenu = () => {
    this.setState((prev) => ({
      navMenuOpen: !prev.navMenuOpen,
    }));
  };

  // Tasks
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

    this.setState((prev) => ({
      tasks: [...prev.tasks, newTask],
      taskInput: '',
    }));
  };

  toggleTaskCompletion = (id: number) => {
    this.setState((prev) => ({
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
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
    this.setState({
      editingTaskId: null,
      editingTaskText: '',
    });
  };

  saveTaskEdit = (id: number) => {
    if (this.state.editingTaskText.trim() === '') return;

    const editedText = this.state.editingTaskText;

    this.setState((prev) => ({
      tasks: prev.tasks.map((task) =>
        task.id === id ? { ...task, text: editedText } : task
      ),
      editingTaskId: null,
      editingTaskText: '',
    }));
  };

  deleteTask = (id: number) => {
    this.setState((prev) => ({
      tasks: prev.tasks.filter((task) => task.id !== id),
    }));
  };

  deleteAllSelectedTasks = () => {
    this.setState((prev) => ({
      tasks: prev.tasks.filter((task) => !task.completed),
    }));
  };

  // Gallery
  openGalleryModal = (index: number) => {
    this.setState({
      selectedImgIndex: index,
      zoomLevel: 1,
      position: { x: 0, y: 0 },
      isDragging: false,
    });
  };

  closeGalleryModal = () => {
    this.setState({
      selectedImgIndex: null,
      zoomLevel: 1,
      position: { x: 0, y: 0 },
      isDragging: false,
    });

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }
  };

  // Hide or show the title and description for an individual image.
  toggleGalleryDescription = (id: number) => {
    this.setState((prev) => ({
      hiddenDescriptionIds: prev.hiddenDescriptionIds.includes(id)
        ? prev.hiddenDescriptionIds.filter(
            (hiddenId) => hiddenId !== id
          )
        : [...prev.hiddenDescriptionIds, id],
    }));
  };

  toggleFullScreen = async () => {
    const container = this.modalContainerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else {
          console.warn('Fullscreen is not supported by this browser.');
        }
      } else {
        await document.exitFullscreen?.();
      }
    } catch (error) {
      console.error('Could not toggle fullscreen:', error);
    }
  };

  prevGalleryImage = () => {
    this.setState((prev) => {
      if (prev.selectedImgIndex === null) return null;

      const newIndex =
        prev.selectedImgIndex === 0
          ? this.galleryImages.length - 1
          : prev.selectedImgIndex - 1;

      return {
        selectedImgIndex: newIndex,
        zoomLevel: 1,
        position: { x: 0, y: 0 },
      };
    });
  };

  nextGalleryImage = () => {
    this.setState((prev) => {
      if (prev.selectedImgIndex === null) return null;

      return {
        selectedImgIndex:
          (prev.selectedImgIndex + 1) % this.galleryImages.length,
        zoomLevel: 1,
        position: { x: 0, y: 0 },
      };
    });
  };

  zoomIn = () => {
    this.setState((prev) => ({
      zoomLevel: Math.min(prev.zoomLevel + 0.25, 3.5),
    }));
  };

  zoomOut = () => {
    this.setState((prev) => {
      const newZoom = Math.max(prev.zoomLevel - 0.25, 0.5);

      return {
        zoomLevel: newZoom,
        position: newZoom <= 1 ? { x: 0, y: 0 } : prev.position,
      };
    });
  };

  resetZoom = () => {
    this.setState({
      zoomLevel: 1,
      position: { x: 0, y: 0 },
    });
  };

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
    if (
      this.state.isDragging &&
      this.state.zoomLevel > 1 &&
      e.touches.length === 1
    ) {
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

  // Audio player
  togglePlayPause = () => {
    const audio = this.audioRef.current;
    if (!audio) return;

    if (this.state.isPlaying) {
      audio.pause();
      this.setState({ isPlaying: false });
    } else {
      audio
        .play()
        .then(() => this.setState({ isPlaying: true }))
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
        this.audioRef.current
          .play()
          .catch((err) => console.log(err));
      }
    });
  };

  // 5x5 Tic-Tac-Toe
  handleSquareClick = (index: number) => {
    const { board, xIsNext, gameHasEnded } = this.state;

    if (board[index] || gameHasEnded) return;

    this.playSFX(this.sfx.click);

    const newBoard = board.slice();
    newBoard[index] = xIsNext ? 'X' : 'O';

    const winner = this.calculateWinner(newBoard);

    this.setState((prev) => {
      let updatedScoreX = prev.scoreX;
      let updatedScoreO = prev.scoreO;
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
      board: Array(25).fill(null),
      xIsNext: true,
      gameHasEnded: false,
    });
  };

  resetScores = () => {
    this.playSFX(this.sfx.preparing);

    this.setState({
      scoreX: 0,
      scoreO: 0,
      board: Array(25).fill(null),
      xIsNext: true,
      gameHasEnded: false,
    });
  };

  calculateWinner = (squares: (string | null)[]) => {
    const size = 5;
    const winLength = 4;

    const directions: [number, number][] = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const player = squares[row * size + col];
        if (!player) continue;

        for (const [dr, dc] of directions) {
          let matches = 1;

          for (let step = 1; step < winLength; step++) {
            const nextRow = row + dr * step;
            const nextCol = col + dc * step;

            if (
              nextRow < 0 ||
              nextRow >= size ||
              nextCol < 0 ||
              nextCol >= size
            ) {
              break;
            }

            if (squares[nextRow * size + nextCol] !== player) break;
            matches++;
          }

          if (matches >= winLength) return player;
        }
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
      hiddenDescriptionIds,
    } = this.state;

    const winner = this.calculateWinner(board);
    const isBoardFull = board.every((square) => square !== null);
    const completedCount = tasks.filter((task) => task.completed).length;
    const activeTrack = this.bgMusicTracks[currentTrackIndex];

    const navItems: { tab: TabName; label: string }[] = [
      { tab: 'home', label: 'Home' },
      { tab: 'tasks', label: 'Tasks' },
      { tab: 'gallery', label: 'Gallery' },
      { tab: 'game', label: 'Tic-Tac-Toe' },
      { tab: 'about', label: 'About' },
    ];

    return (
      <div className="d-flex flex-column min-vh-100 bg-light overflow-x-hidden">
        <audio ref={this.audioRef} src={activeTrack.src} preload="metadata" />
        <audio ref={this.sfxRef} preload="auto" />

        {/* Navigation */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
          <div className="container-fluid px-3">
            <button
              className="navbar-brand btn btn-link text-white text-decoration-none fw-bold fs-5 p-0"
              onClick={() => this.setActiveTab('home')}
            >
              React App
            </button>

            <button
              className="navbar-toggler border-0"
              type="button"
              onClick={this.toggleNavMenu}
              aria-label="Toggle navigation"
              aria-expanded={navMenuOpen}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className={`collapse navbar-collapse ${navMenuOpen ? 'show' : ''}`}>
              <div className="navbar-nav ms-auto gap-1 gap-lg-3 pt-2 pt-lg-0">
                {navItems.map(({ tab, label }) => (
                  <button
                    key={tab}
                    className={`nav-link btn btn-link text-start text-decoration-none px-3 py-2 ${
                      activeTab === tab
                        ? 'active fw-bold text-white bg-primary bg-opacity-25 rounded'
                        : 'text-light'
                    }`}
                    onClick={() => this.setActiveTab(tab)}
                    aria-current={activeTab === tab ? 'page' : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Music Player */}
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
                onChange={(e) => this.changeTrack(parseInt(e.target.value, 10))}
                aria-label="Select music track"
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
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>

        <main
          className="container-fluid px-3 my-3 flex-grow-1 mx-auto"
          style={{ maxWidth: '850px' }}
        >
          {/* Home */}
          {activeTab === 'home' && (
            <div className="text-center py-4 py-md-5">
              <h1 className="display-5 fw-bold mb-3">Hello world!</h1>

              <div
                className="card mx-auto my-4 p-3 shadow-sm bg-dark text-white"
                style={{ maxWidth: '280px' }}
              >
                <small className="text-muted text-uppercase tracking-wide">
                  Current Time
                </small>
                <h2 className="fw-mono mt-1 mb-0 fs-3">
                  {currentTime.toLocaleTimeString()}
                </h2>
                <small className="text-secondary">
                  {currentTime.toLocaleDateString()}
                </small>
              </div>

              <p className="lead text-muted fs-6 px-2">
                Welcome to the mobile-optimized React application. Manage tasks,
                view photos with zoom and pan gestures, listen to music, or play
                Tic-Tac-Toe on any device!
              </p>
            </div>
          )}

          {/* Tasks */}
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
                                style={{
                                  width: '1.25rem',
                                  height: '1.25rem',
                                  cursor: 'pointer',
                                }}
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

          {/* Gallery */}
          {activeTab === 'gallery' && (
            <div>
              <h3 className="mb-2 text-center">Photo Gallery</h3>

              <p className="text-center text-muted small mb-3">
                Select an image for fullscreen viewing, zooming, and panning.
                Use Hide details or Show details to control each image's title
                and description.
              </p>

              <div className="row g-2 g-sm-3">
                {this.galleryImages.map((img, idx) => {
                  const detailsHidden = hiddenDescriptionIds.includes(img.id);

                  return (
                    <div key={img.id} className="col-6 col-sm-4 col-md-3">
                      <div className="card shadow-sm h-100 border-0">
                        <button
                          type="button"
                          className="border-0 bg-light p-0 d-flex align-items-center justify-content-center rounded-top"
                          style={{
                            height: '160px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}
                          onClick={() => this.openGalleryModal(idx)}
                          aria-label={`Open ${img.title} in fullscreen`}
                        >
                          <img
                            src={img.src}
                            className="mw-100 mh-100"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            alt={img.alt}
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = `./img/${img.fileName}`;
                              if (!target.src.endsWith(fallback)) {
                                target.src = fallback;
                              }
                            }}
                          />
                        </button>

                        <div className="card-body p-2 text-center bg-white">
                          {!detailsHidden && (
                            <>
                              <h6 className="fw-semibold text-dark mb-1">
                                {img.title}
                              </h6>
                              <p className="small text-muted mb-2">
                                {img.description}
                              </p>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => this.toggleGalleryDescription(img.id)}
                            aria-expanded={!detailsHidden}
                            aria-label={`${detailsHidden ? 'Show' : 'Hide'} details for ${img.title}`}
                          >
                            {detailsHidden ? 'Show details' : 'Hide details'}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-link d-block mx-auto mt-1"
                            onClick={() => this.openGalleryModal(idx)}
                          >
                            Open image
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fullscreen lightbox */}
              {selectedImgIndex !== null && (() => {
                const img = this.galleryImages[selectedImgIndex];
                const detailsHidden = hiddenDescriptionIds.includes(img.id);

                return (
                  <div
                    ref={this.modalContainerRef}
                    className="gallery-lightbox"
                    style={{
                      position: 'fixed',
                      inset: 0,
                      width: '100vw',
                      height: '100dvh',
                      margin: 0,
                      padding: 0,
                      background: '#000',
                      color: '#fff',
                      zIndex: 2000,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                    onMouseLeave={this.handleMouseUp}
                    onTouchMove={this.handleTouchMove}
                    onTouchEnd={this.handleTouchEnd}
                  >
                    <div className="d-flex align-items-center gap-2 px-3 py-2 bg-dark flex-shrink-0">
                      <h6 className="mb-0 me-auto text-truncate">
                        {img.title} ({selectedImgIndex + 1}/{this.galleryImages.length})
                      </h6>

                      <button
                        type="button"
                        className="btn btn-outline-light btn-sm"
                        onClick={this.toggleFullScreen}
                        title="Toggle fullscreen"
                        aria-label="Toggle fullscreen"
                      >
                        ⛶
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-light btn-sm"
                        onClick={() => this.toggleGalleryDescription(img.id)}
                        aria-expanded={!detailsHidden}
                        aria-label={`${detailsHidden ? 'Show' : 'Hide'} details for ${img.title}`}
                      >
                        {detailsHidden ? 'Show details' : 'Hide details'}
                      </button>

                      <button
                        type="button"
                        className="btn-close btn-close-white"
                        onClick={this.closeGalleryModal}
                        aria-label="Close gallery"
                      />
                    </div>

                    {!detailsHidden && (
                      <div className="bg-dark text-white text-center px-3 py-2 flex-shrink-0">
                        <strong>{img.title}</strong>
                        <p className="small mb-0">{img.description}</p>
                      </div>
                    )}

                    <div
                      className="flex-grow-1 d-flex align-items-center justify-content-center"
                      style={{
                        minHeight: 0,
                        width: '100%',
                        overflow: 'hidden',
                        userSelect: 'none',
                        touchAction: 'none',
                      }}
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        draggable={false}
                        onMouseDown={this.handleMouseDown}
                        onTouchStart={this.handleTouchStart}
                        onError={(e) => {
                          const target = e.currentTarget;
                          const fallback = `./img/${img.fileName}`;
                          if (!target.src.endsWith(fallback)) {
                            target.src = fallback;
                          }
                        }}
                        style={{
                          display: 'block',
                          maxHeight: '100%',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                          transformOrigin: 'center center',
                          cursor: zoomLevel > 1
                            ? isDragging ? 'grabbing' : 'grab'
                            : 'default',
                          transition: isDragging
                            ? 'none'
                            : 'transform 0.15s ease-out',
                        }}
                      />
                    </div>

                    <div className="bg-dark d-flex flex-wrap justify-content-between align-items-center gap-2 p-2 flex-shrink-0">
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
                          Next ➡
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Game */}
          {activeTab === 'game' && (
            <div className="text-center py-2">
              <h3 className="mb-3">Tic-Tac-Toe: Five by Five</h3>
              <p className="text-muted small">
                Get four Xs or Os in a row horizontally, vertically, or diagonally to win.
              </p>

              <div className="card mx-auto mb-3 p-2 shadow-sm" style={{ maxWidth: '380px' }}>
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

              <div
                className="d-grid mx-auto mb-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  gap: '6px',
                  width: '100%',
                  maxWidth: '380px',
                }}
              >
                {board.map((value, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-outline-dark fw-bold rounded shadow-sm d-flex align-items-center justify-content-center"
                    style={{
                      aspectRatio: '1 / 1',
                      padding: 0,
                      fontSize: 'clamp(1.1rem, 5vw, 2rem)',
                    }}
                    onClick={() => this.handleSquareClick(idx)}
                    disabled={Boolean(value) || this.state.gameHasEnded}
                    aria-label={`Square ${idx + 1}${value ? `, ${value}` : ', empty'}`}
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

          {/* About */}
          {activeTab === 'about' && (
            <div className="py-3">
              <h3 className="mb-3 text-center">About This App</h3>

              <div className="card shadow-sm p-4 bg-white rounded">
                <p>
                  This React TypeScript application uses Bootstrap and includes a
                  task tracker, responsive image gallery, music player, live clock,
                  and two-player five-by-five Tic-Tac-Toe.
                </p>

                <h5 className="mt-3">Features Included:</h5>
                <ul>
                  <li><strong>Navigation:</strong> URL paths for Home, Tasks, Gallery, Tic-Tac-Toe, and About.</li>
                  <li><strong>Live Time:</strong> Real-time clock updating every second.</li>
                  <li><strong>Task Tracker:</strong> Add, edit, complete, delete, and bulk-delete tasks.</li>
                  <li><strong>Photo Gallery:</strong> 26 images with custom titles and descriptions, individual hide/show controls, zoom, pan, navigation, and fullscreen viewing.</li>
                  <li><strong>Music Player:</strong> Play/pause, volume, and track selection.</li>
                  <li><strong>Tic-Tac-Toe:</strong> 5×5 board where four connected squares win, with score tracking and round resets.</li>
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
