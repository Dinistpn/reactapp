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
