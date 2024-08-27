import { AudioPlayer } from @components";

export interface PromptTextInterface {
    width: number;
    height: number;
    levelData: any;
    currentPromptText: string;
    currentPuzzleData: any;
    canavsElement: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    prompt_image: HTMLImageElement;
    targetStones: string[];
    rightToLeft: boolean;
    imagesLoaded: boolean;
    audioPlayer: AudioPlayer;
    isStoneDropped: boolean;
    droppedStones: number;
    time: number;
    promptImageWidth: number;
    isAppForeground: boolean;
    scale: number;
    isScalingUp: boolean;
    scaleFactor: number;
    promptImageHeight: number;
    promptPlayButton: HTMLImageElement;

    handleMouseDown(event: MouseEvent): void;
    getPromptAudioUrl(): string;
    playSound(): void;
    onClick(xClick: number, yClick: number): boolean;
    setCurrrentPuzzleData(data: any): void;
    drawRTLLang(): void;
    drawOthers(): void;
    draw(deltaTime: number): void;
    handleStoneDrop(event: Event): void;
    handleLoadPuzzle(event: Event): void;
    dispose(): void;
    droppedStoneIndex(index: number): void;
    calculateFont(): number;
    updateScaling(): void;
    handleVisibilityChange(): void;
    loadImages(): Promise<void>;
    loadImage(image: HTMLImageElement, src: string): Promise<void>;
}
