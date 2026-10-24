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

type TabName = 'home' | 'data analysis' | 'tasks' | 'gallery' | 'game' | 'about';

interface ProjectPreview {
  title: string;
  image: string;
  alt: string;
  description: string;
}

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
  selectedProject: ProjectPreview | null;
  projectZoomLevel: number;

  currentTrackIndex: number;
  isPlaying: boolean;
  volume: number;

  board: (string | null)[];
  xIsNext: boolean;
  startingPlayer: boolean;
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

  private galleryDetails: {
    title: string;
    description: string;
  }[] = [
    { title: 'Venice', description: 'A beautiful view from Venice.' },
    { title: 'Praia da Barra', description: 'View from Pier in Portugal beach.' },
    { title: 'Warsaw', description: 'One of the most iconic buildings in the Capital of Poland, despite the past.' },
    { title: 'Praia da Barra', description: 'View from the beach in Portugal.' },
    { title: 'Mountain Landscape', description: 'Oil painting with mountains.' },
    { title: 'Bay', description: 'Artistic oil painting of an imaginary bay.' },
    { title: 'View from ruins', description: 'Painting of old ruins.' },
    { title: 'Bay from the top', description: 'Oil painting of a bay from the top.' },
    { title: 'Venice Lagoon Island', description: 'An island in the lagoon of Venice.' },
    { title: 'Oriental', description: 'Oil painting of an old ruin.' },
    { title: 'Mountain', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'Mountains passage', description: 'A beautiful view of a mountain passage.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
    { title: 'Mountain Landscape', description: 'A beautiful view of the mountains at sunset.' },
    { title: 'City at Night', description: 'A city skyline illuminated after dark.' },
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
      selectedProject: null,
      projectZoomLevel: 1,

      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.8,

      board: Array(25).fill(null),
      xIsNext: true,
      startingPlayer: true,
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

  private routeForTab = (tab: TabName) =>
    tab === 'home' ? '/' : tab === 'data analysis' ? '/data-analysis' : `/${tab}`;

  private tabToPath = (tab: TabName) => `#${this.routeForTab(tab)}`;

  private handlePopState = () => {
    const routes: Record<string, TabName> = {
      '/': 'home',
      '/home': 'home',
      '/data-analysis': 'data analysis',
      '/data analysis': 'data analysis',
      '/tasks': 'tasks',
      '/gallery': 'gallery',
      '/game': 'game',
      '/about': 'about',
    };

    const hashRoute = window.location.hash.startsWith('#/')
      ? window.location.hash.slice(1).replace(/\/+$/, '') || '/'
      : null;
    let path = hashRoute;
    if (!path) {
      const basePath = this.getBasePath();
      path = window.location.pathname;
      if (basePath && path.startsWith(basePath)) path = path.slice(basePath.length) || '/';
      path = path.replace(/\/+$/, '') || '/';
    }

    this.setState({ activeTab: routes[path] || 'home', navMenuOpen: false });
  };

  handleKeyDown = (event: KeyboardEvent) => {
    if (this.state.selectedImgIndex !== null) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.prevGalleryImage();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.nextGalleryImage();
      } else if (event.key === 'Escape') {
        this.closeGalleryModal();
      }
    }
  };

  componentDidMount() {
    this.handlePopState();
    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('hashchange', this.handlePopState);
    window.addEventListener('keydown', this.handleKeyDown);

    this.timerID = setInterval(() => {
      this.setState({ currentTime: new Date() });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timerID) clearInterval(this.timerID);
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('hashchange', this.handlePopState);
    window.removeEventListener('keydown', this.handleKeyDown);

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
    const hashUrl = this.tabToPath(tab);
    if (window.location.hash !== hashUrl) {
      window.history.pushState({}, '', `${window.location.pathname}${window.location.search}${hashUrl}`);
    }
    this.setState({ activeTab: tab, navMenuOpen: false });
  };

  openProjectPreview = (project: ProjectPreview) => {
    this.setState({ selectedProject: project, projectZoomLevel: 1 });
  };

  closeProjectPreview = () => this.setState({ selectedProject: null, projectZoomLevel: 1 });

  zoomProjectImage = (amount: number) => {
    this.setState((prev) => ({
      projectZoomLevel: Math.min(3, Math.max(0.5, prev.projectZoomLevel + amount)),
    }));
  };

  resetProjectZoom = () => this.setState({ projectZoomLevel: 1 });

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

  toggleGalleryDescription = (id: number) => {
    this.setState((prev) => ({
      hiddenDescriptionIds: prev.hiddenDescriptionIds.includes(id)
        ? prev.hiddenDescriptionIds.filter((hiddenId) => hiddenId !== id)
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
        selectedImgIndex: (prev.selectedImgIndex + 1) % this.galleryImages.length,
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

  handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    if (this.state.selectedImgIndex !== null) {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    }
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
      let nextStartingPlayer = prev.startingPlayer;

      if (winner) {
        isEnded = true;

        if (winner === 'X') updatedScoreX += 1;
        if (winner === 'O') updatedScoreO += 1;

        this.playSFX(this.sfx.gameOver);
        nextStartingPlayer = !prev.startingPlayer;
      } else if (newBoard.every((square) => square !== null)) {
        isEnded = true;
        this.playSFX(this.sfx.gameOver);
        nextStartingPlayer = !prev.startingPlayer;
      }

      return {
        board: newBoard,
        xIsNext: !xIsNext,
        startingPlayer: nextStartingPlayer,
        scoreX: updatedScoreX,
        scoreO: updatedScoreO,
        gameHasEnded: isEnded,
      };
    });
  };

  resetGame = () => {
    this.playSFX(this.sfx.preparing);

    this.setState((prev) => ({
      board: Array(25).fill(null),
      xIsNext: prev.startingPlayer,
      gameHasEnded: false,
    }));
  };

  resetScores = () => {
    this.playSFX(this.sfx.preparing);

    this.setState({
      scoreX: 0,
      scoreO: 0,
      board: Array(25).fill(null),
      xIsNext: true,
      startingPlayer: true,
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
      gameHasEnded,
      selectedProject,
      projectZoomLevel,
    } = this.state;

    const winner = this.calculateWinner(board);
    const activeTrack = this.bgMusicTracks[currentTrackIndex];

    const dataProjects = [
      {
        title: 'Airbnb Rent Pressures',
        category: 'Housing · Short-term rentals',
        description: 'Explore how short-term rental activity may relate to housing availability and rent pressure.',
        image: `${this.baseUrl}/img/projects/airbnb-rent-pressures.png`,
        alt: 'Visualization for the Airbnb rent pressures analysis',
        repo: 'https://github.com/Dinistpn/Airbnb-Rent-Pressures',
        number: '01',
      },
      {
        title: 'Housing & Tourism Analysis',
        category: 'Urban data · Tourism',
        description: 'Investigate the relationship between tourism activity and housing-related indicators.',
        image: `${this.baseUrl}/img/projects/housing-tourism-analysis.png`,
        alt: 'Visualization for the housing and tourism analysis',
        repo: 'https://github.com/Dinistpn/housing-tourism-analysis',
        number: '02',
      },
      {
        title: 'Data Games',
        category: 'Exploratory analysis · Data visualization',
        description: 'A data-focused project built around games and playful exploration.',
        image: `${this.baseUrl}/img/projects/data-games.png`,
        alt: 'Preview image for the Data Games project',
        repo: 'https://github.com/Dinistpn/data-games',
        number: '03',
      },
      {
        title: 'Retail Sales Analytics',
        category: 'Business intelligence · Sales',
        description: 'Analyze retail performance through sales trends, product and customer patterns, and business-focused metrics.',
        image: `${this.baseUrl}/img/projects/retail-sales-analytics.png`,
        alt: 'Dashboard preview for the retail sales analytics project',
        repo: 'https://github.com/Dinistpn/Retail-Sales-Analytics',
        number: '04',
      },
    ];

    const navItems: { tab: TabName; label: string }[] = [
      { tab: 'home', label: 'Home' },
      { tab: 'data analysis', label: 'Data Analysis' },
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

        <main className="container-fluid px-3 my-3 flex-grow-1 mx-auto" style={{ maxWidth: '850px' }}>
          {/* Home */}
          {activeTab === 'home' && (
            <div className="text-center py-4 py-md-5">
              <h1 className="display-5 fw-bold mb-3">Welcome to my React App!</h1>

              <div className="card mx-auto my-4 p-3 shadow-sm bg-dark text-white" style={{ maxWidth: '280px' }}>
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
                This mobile-optimized React application was created to practice with Javascript and to show of my work. There is a menu that includes a page that includes some of the projects related with data analysis, to manage tasks,
                view photos with zoom and pan gestures, listen to music, or play Tic-Tac-Toe on any device.
              </p>
              <h2 className="fw-mono mt-1 mb-0 fs-3">
                <p className="lead text-muted fs-6 px-2">
                  Hope you enjoy this App.
                </p>
              </h2>
            </div>
          )}

          {/* Data Analysis Projects */}
          {activeTab === 'data analysis' && (
            <section className="data-projects py-3 py-md-4">
              <header className="text-center mb-4 mb-md-5">
                <span className="badge rounded-pill text-bg-primary mb-3 px-3 py-2">Portfolio</span>
                <h1 className="display-6 fw-bold mb-3">Data Analysis Projects</h1>
                <p className="lead text-secondary mx-auto mb-0" style={{ maxWidth: '680px' }}>
                  A selection of projects exploring real-world questions with data — from housing and tourism pressures to games and retail performance. Open a project to explore its code, analysis, and findings.
                </p>
              </header>

              <div className="row g-4">
                {dataProjects.map((project) => (
                  <div className="col-12 col-md-6" key={project.number}>
                    <article className="card h-100 border-0 shadow-sm project-card overflow-hidden">
                      <div
                        className="project-image-wrap position-relative"
                        role="button"
                        tabIndex={0}
                        aria-label={`Open ${project.title} image full screen`}
                        onClick={() => this.openProjectPreview(project)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.openProjectPreview(project); } }}
                      >
                        <div className="project-image-placeholder d-flex flex-column align-items-center justify-content-center text-center p-4" aria-hidden="true">
                          <span className="project-number mb-2">{project.number}</span>
                          <span className="fw-semibold">Project preview</span>
                          <span className="small opacity-75">Add an image to public/img/projects</span>
                          <span className="small mt-2">Select to enlarge</span>
                        </div>
                        <img
                          src={project.image}
                          alt={project.alt}
                          className="project-image"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="card-body p-4 d-flex flex-column">
                        <p className="text-primary text-uppercase fw-semibold small mb-2 project-category">{project.category}</p>
                        <h2 className="h4 fw-bold mb-3">{project.title}</h2>
                        <p className="text-secondary mb-4">{project.description}</p>
                        <div className="mt-auto d-flex flex-wrap gap-2">
                          <a className="btn btn-primary rounded-pill px-4" href={project.repo} target="_blank" rel="noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="py-3">
              <h1 className="h3 fw-bold mb-4">Task Manager</h1>
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add a new task..."
                  value={taskInput}
                  onChange={this.handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && this.addTask()}
                />
                <button className="btn btn-primary" onClick={this.addTask}>Add Task</button>
              </div>
              <ul className="list-group">
                {tasks.map((task) => (
                  <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <input
                        type="checkbox"
                        className="form-check-input me-2"
                        checked={task.completed}
                        onChange={() => this.toggleTaskCompletion(task.id)}
                      />
                      <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                        {task.text}
                      </span>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => this.deleteTask(task.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="py-3">
              <h1 className="h3 fw-bold mb-4">Gallery</h1>
              <div className="row g-3">
                {this.galleryImages.map((img, idx) => (
                  <div className="col-6 col-md-4 col-lg-3" key={img.id}>
                    <div
                      className="card h-100 shadow-sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => this.openGalleryModal(idx)}
                    >
                      <img src={img.src} alt={img.alt} className="card-img-top" style={{ height: '150px', objectFit: 'cover' }} />
                      <div className="card-body p-2">
                        <h6 className="card-title text-truncate mb-1">{img.title}</h6>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tic-Tac-Toe Tab */}
          {activeTab === 'game' && (
            <div className="py-3 text-center">
              <h1 className="h3 fw-bold mb-3">5x5 Tic-Tac-Toe</h1>
              <div className="mb-3 d-flex justify-content-center gap-4">
                <span className="badge bg-primary fs-6">Score X: {scoreX}</span>
                <span className="badge bg-danger fs-6">Score O: {scoreO}</span>
              </div>
              <p className="fw-semibold">
                {winner ? `Winner: ${winner}` : gameHasEnded ? "It's a Draw!" : `Current Turn: ${xIsNext ? 'X' : 'O'}`}
              </p>

              <div
                className="d-grid gap-1 mx-auto my-3"
                style={{ gridTemplateColumns: 'repeat(5, 50px)', maxWidth: '270px' }}
              >
                {board.map((cell, idx) => (
                  <button
                    key={idx}
                    className="btn btn-outline-dark fs-5 fw-bold p-0"
                    style={{ height: '50px' }}
                    onClick={() => this.handleSquareClick(idx)}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button className="btn btn-secondary btn-sm" onClick={this.resetGame}>Restart Game</button>
                <button className="btn btn-outline-danger btn-sm" onClick={this.resetScores}>Reset Scores</button>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="py-3">
              <h1 className="h3 fw-bold mb-3">About</h1>
              <p className="text-secondary">This React portfolio and showcase application was built to demonstrate state management, responsive UI, custom events, and interactivity.</p>
            </div>
          )}
        </main>

        {/* Project Lightbox Preview */}
        {selectedProject && (
          <div
            className="project-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProject.title} image preview`}
            onClick={this.closeProjectPreview}
            onKeyDown={(e) => { if (e.key === 'Escape') this.closeProjectPreview(); }}
          >
            <div className="project-lightbox-panel" onClick={(e) => e.stopPropagation()}>
              <div className="project-lightbox-header">
                <div>
                  <h2 className="h5 mb-1">{selectedProject.title}</h2>
                  <p className="small text-white-50 mb-0">Use the controls to zoom in or out.</p>
                </div>
                <button type="button" className="btn btn-outline-light btn-sm" onClick={this.closeProjectPreview} aria-label="Close full-screen image">✕ Close</button>
              </div>
              <div className="project-lightbox-stage">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.alt}
                  className="project-lightbox-image"
                  style={{ transform: `scale(${projectZoomLevel})` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Gallery Modal / Fullscreen Preview with Mouse Wheel Zoom & Arrow Key Support */}
        {selectedImgIndex !== null && (
          <div
            ref={this.modalContainerRef}
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-90 d-flex flex-column justify-content-center align-items-center z-3"
            onWheel={this.handleWheelZoom}
            onMouseMove={this.handleMouseMove}
            onMouseUp={this.handleMouseUp}
          >
            <div className="position-absolute top-0 end-0 p-3 d-flex gap-2">
              <button className="btn btn-outline-light btn-sm" onClick={this.zoomIn}>Zoom +</button>
              <button className="btn btn-outline-light btn-sm" onClick={this.zoomOut}>Zoom -</button>
              <button className="btn btn-outline-light btn-sm" onClick={this.resetZoom}>Reset</button>
              <button className="btn btn-outline-light btn-sm" onClick={this.toggleFullScreen}>Full Screen</button>
              <button className="btn btn-light btn-sm" onClick={this.closeGalleryModal}>✕ Close</button>
            </div>

            <div className="position-absolute top-50 start-0 translate-middle-y px-3">
              <button className="btn btn-dark btn-lg opacity-75 text-white" onClick={this.prevGalleryImage}>❮</button>
            </div>
            <div className="position-absolute top-50 end-0 translate-middle-y px-3">
              <button className="btn btn-dark btn-lg opacity-75 text-white" onClick={this.nextGalleryImage}>❯</button>
            </div>

            <div className="overflow-hidden text-center" style={{ maxWidth: '85vw', maxHeight: '75vh' }}>
              <img
                src={this.galleryImages[selectedImgIndex].src}
                alt={this.galleryImages[selectedImgIndex].alt}
                className="img-fluid"
                style={{
                  transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                }}
                onMouseDown={this.handleMouseDown}
              />
              <div className="text-white mt-3">
                <h5>{this.galleryImages[selectedImgIndex].title}</h5>
                <p className="small text-white-50">{this.galleryImages[selectedImgIndex].description}</p>
                <small className="text-muted">Use ⬅️ ➡️ arrow keys or buttons to navigate. Scroll wheel to zoom.</small>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default App;
