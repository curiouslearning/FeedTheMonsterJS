import { BaseHTML, BaseHtmlOptions } from '@components/baseHTML/base-html';
import {
  LEVEL_SELECTION_BACKGROUND,
  MAP_ICON_IMG,
  TREASURE_CHEST_SPECIAL_LEVELS_ONGOING,
  TREASURE_CHEST_SPECIAL_LEVELS_DONE,
  NEXT_BTN_IMG,
  BACK_BTN_IMG,
  AUDIO_INTRO
 } from '@constants';
import { LevelSelectionGameBtn, LevelSelectionNavBtn } from '@buttons';
import { AudioPlayer } from "@components";

const TOTAL_BUTTONS = 12;
const LAST_GAME_BTN = 10;
const COLUMNS = 3;
const PREV_BTN = 9;
const NEXT_BTN = 11;
const HTML_EVENT_ELEMENT_ID = "level-selection-grid";
const SPECIAL_LEVELS_INDEX = 4;

const levelSelectionContainer = ({ id }) => {
  return `<div id="${id}"
    style="background-image: url(${LEVEL_SELECTION_BACKGROUND});"
  >
    <div id="${HTML_EVENT_ELEMENT_ID}">
    </div>
  </div>`;
};

interface LevelSelectionController {
  id: string,
  options: BaseHtmlOptions,
  startGameCallback,
  maxGameLevels: number,
  playedGameLevels: any,
  previousPlayedLevel: number,
  isDebuggerOn: boolean,
  gameLevels: any
}

export class levelSelectionController extends BaseHTML {
  private playedGameLevels: {
    levelName?: string,
    levelNumber?: number,
    score?: number,
    starCount?: number,
    treasureChestMiniGameScore?: number,
  }[] = [];
  private audioPlayer: AudioPlayer;
  private btnList: { [key: string]: any } = {};
  private xDown: number;
  private yDown: number;
  private startGameCallback: any;
  private levelsPerPage: number = 10;
  private currentPage: number = 1;
  private totalPages: number = 1;
  private start: number = 1;
  private maxGameLevels: number = 0;
  private nextPlayableLevel: number = 1;
  private isDebuggerOn: boolean = false;
  private gameLevels: any[] = [];

  constructor({
    id,
    options,
    startGameCallback,
    maxGameLevels,
    playedGameLevels,
    previousPlayedLevel,
    isDebuggerOn,
    gameLevels
  }: LevelSelectionController) {
    super(
      options,
      id,
      (id: string) => levelSelectionContainer({ id })
    );
    this.playedGameLevels = playedGameLevels;
    this.audioPlayer = new AudioPlayer();
    this.startGameCallback = startGameCallback;
    this.maxGameLevels = maxGameLevels;
    this.totalPages = this.getTotalPages(maxGameLevels);
    this.currentPage = this.getOpeningPage(previousPlayedLevel, this.levelsPerPage);
    this.isDebuggerOn = isDebuggerOn;
    this.gameLevels = gameLevels;
    this.addListeners();
    this.createLevelButtons();
    if (document.visibilityState === "visible") {
      this.audioPlayer.playAudio(AUDIO_INTRO);
    }
  }

  /**
   * Get current page index based on previous game level.
   * @param index
   * @param levelsPerPage
   * @returns number
   */
  private getOpeningPage(index: number, levelsPerPage: number): number {
    return Math.floor(index / levelsPerPage) + 1;
  }

  private getTotalPages(maxGameLevels): number {
    //We divide by 10 as we display 10 game levels per page.
    return Math.ceil(maxGameLevels / 10);
  }

  private buttonConfig = {
    img: {
      [PREV_BTN]: BACK_BTN_IMG,
      [NEXT_BTN]: NEXT_BTN_IMG,
      4: TREASURE_CHEST_SPECIAL_LEVELS_ONGOING,
      default: MAP_ICON_IMG,
    },
    class: {
      [PREV_BTN]: "level-buttons nav-btn",
      [NEXT_BTN]: "level-buttons nav-btn",
      4: "level-buttons special-levels",
      default: "level-buttons",
    }
  };

  private getImgFor(index: number): string {
    return this.buttonConfig.img[index] ?? this.buttonConfig.img.default;
  }

  private getClassFor(index: number): string {
    return this.buttonConfig.class[index] ?? this.buttonConfig.class.default;
  }

  private boundTouchStart = (evt) => this.handleTouchStart(evt);
  private boundTouchMove = (evt) => this.handleTouchMove(evt);

  private addListeners() {
    // when app goes background #2
    document.addEventListener("visibilitychange", this.pausePlayAudios, false);

    /// swipe listener #3
    document
      .getElementById(HTML_EVENT_ELEMENT_ID)
      .addEventListener("touchstart", this.boundTouchStart, false);

    // #4
    document
      .getElementById(HTML_EVENT_ELEMENT_ID)
      .addEventListener("touchmove", this.boundTouchMove, false);
  }

  private handleTouchMove = (evt) => {
    if (!this.xDown || !this.yDown) {
      return;
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    const xDiff = this.xDown - xUp;
    const yDiff = this.yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      /*most significant*/
      if (xDiff > 0) {
        this.goToNextPage();
        /* right swipe */
      } else {
        this.goToPrevPage();
      }
    }

    /* reset values */
    this.xDown = null;
    this.yDown = null;
  };

  private handleTouchStart(evt): void {
    const firstTouch = evt.touches || // browser API
      evt.originalEvent.touches;
    this.xDown = firstTouch[0].clientX;
    this.yDown = firstTouch[0].clientY;
  };

  private pausePlayAudios = () => {
      if (document.visibilityState === "visible") {
        this.audioPlayer.playAudio(AUDIO_INTRO);
      } else {
        this.audioPlayer.stopAllAudios();
      }
  };

  private getPageRange(page: number): { start: number, end: number } {
    const start = (page - 1) * this.levelsPerPage + 1;
    const end = Math.min(start + this.levelsPerPage - 1, this.maxGameLevels);
    return { start, end };
  }

  private goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.audioPlayer.playButtonClickSound();
      this.currentPage++;
      this.updateLevelButtons();
    }
  }

  private goToPrevPage(): void {
    if (this.currentPage > 1) {
      this.audioPlayer.playButtonClickSound();
      this.currentPage--;
      this.updateLevelButtons();
    }
  }

  private handleGameLevelOnClick(gameLevel: number):void {
    this.audioPlayer.stopAllAudios();
    //Game level minus 1 to convert 1-based game level to 0-based array index
    this.startGameCallback(gameLevel - 1);
  }

  private setCallback(index: number): () => void {
    //Attach callbacks.
    switch (index) {
      case PREV_BTN:
        return this.goToPrevPage.bind(this);
      case NEXT_BTN:
        return this.goToNextPage.bind(this);
      default:
        return this.handleGameLevelOnClick.bind(this);
    }
  }

  private getGameLevelScore(gameLevel: number): {
    starsCount: number,
    hasLevelBeenPlayed: boolean
  } {
    let starsCount = 0;
    let hasLevelBeenPlayed = false;
    for (const levelData of this.playedGameLevels) {
      //Game level minus 1 to convert 1-based game level to 0-based array index
      if (gameLevel - 1 === levelData?.levelNumber) {
        starsCount = levelData?.starCount;
        hasLevelBeenPlayed = true;
        //Get mini game score here if needed.
      }
    }

    return { starsCount, hasLevelBeenPlayed };
  }

  private isNextPlayableLevel(currentGameLevel: number): boolean {
    // Disable ripple effect for current level in dev mode.
    if (this.isDebuggerOn) return false;

    if (this.playedGameLevels?.length) {
      // Find highest played level
      let highestPrevLevel = 0;
      let isLevelFailed = false;

      for (const levelData of this.playedGameLevels) {

        if (highestPrevLevel < levelData?.levelNumber || this.playedGameLevels.length === 1) {
          highestPrevLevel = levelData?.levelNumber;
          isLevelFailed = levelData?.starCount < 3;
        }
      }

      // Convert to 1-based game level
      highestPrevLevel = highestPrevLevel + 1;

      // Determine next playable level.
      this.nextPlayableLevel = highestPrevLevel + (isLevelFailed ? 0 : 1);

    } else {
      // First level if no data exists
      this.nextPlayableLevel = 1;
    }

    return currentGameLevel === this.nextPlayableLevel;
  }

  private getLevelTypeName(gameLevel: number): string {
    if (!this.gameLevels.length && !this.isDebuggerOn) return;
    let levelTypeText = '';

    for (const gameLevelData of this.gameLevels) {
      const { levelMeta } = gameLevelData;
      //Game level minus 1 to convert 1-based game level to 0-based array index
      if (gameLevel - 1 === levelMeta?.levelNumber) {
        levelTypeText = levelMeta?.levelType;
      }
    }

    return levelTypeText;
  }

  public createLevelButtons() {
    let row = 1;
    let col = 1;
    this.setStartForCurrentPage();

    for (let index = 0; index < TOTAL_BUTTONS; index++) {
      // Move to next row if needed
      if (col > COLUMNS) {
        row++;
        col = 1;
      }

      const gameLevel = this.getGameLevel(index);
      const { starsCount, hasLevelBeenPlayed } = this.getGameLevelScore(gameLevel);
      const isSpecialLevel = index === SPECIAL_LEVELS_INDEX;
      const text = this.getLevelTypeName(gameLevel);

      //LevelSelectionNavBtn

      const newBtnElement: any = this.isNavButton(index) ? 
        new LevelSelectionNavBtn({
          index,
          options: this.getButtonOptions(index, isSpecialLevel, hasLevelBeenPlayed),
          callback: this.setCallback(index),
        })
      : new LevelSelectionGameBtn({
        index,
        options: this.getButtonOptions(index, isSpecialLevel, hasLevelBeenPlayed),
        isCurrentLevel: this.isNextPlayableLevel(gameLevel),
        gameLevel,
        isLevelLock: this.isGameLocked(gameLevel, index),
        starsCount,
        isDebuggerOn: this.isDebuggerOn,
        levelTypeText: text,
        callback: this.setCallback(index),
      });

      // Hide previous button if on first page
      if (this.currentPage === 1 && index === PREV_BTN) {
        newBtnElement.updateBtnDisplay(false);
      }

      // Grid positioning
      newBtnElement.element.style.gridRow = row;
      newBtnElement.element.style.gridColumn = col;

      // Add to list
      this.btnList[index] = newBtnElement;
      col++;
    }
  }

  /** Helper to get button options */
  private getButtonOptions(index: number, isSpecialLevel: boolean, hasLevelBeenPlayed: boolean) {
    const id = `${index}-level-button`;
    const className = this.getClassFor(index);
    const imageSrc = isSpecialLevel && hasLevelBeenPlayed
      ? TREASURE_CHEST_SPECIAL_LEVELS_DONE
      : this.getImgFor(index);

    return {
      id,
      className,
      imageSrc,
      targetId: HTML_EVENT_ELEMENT_ID,
      imageClass: isSpecialLevel ? "special-levels-img" : "level-selection-btn-img",
      imageID: isSpecialLevel ? `${index}-treasure-img` : ""
    };
  }

  /** Helper to check if button is navigation */
  private isNavButton(index: number) {
    return index === PREV_BTN || index === NEXT_BTN;
  }

  private getGameLevel(actualLevelIndex: number) {
    return this.start + actualLevelIndex - (actualLevelIndex === LAST_GAME_BTN ? 1 : 0);
  }

  private isGameLocked(actualLevelIndex: number, btnIndex: number): boolean {
    if (this.isDebuggerOn) return false; //Return false to disable button lock.

    return btnIndex !== PREV_BTN
      && btnIndex !== NEXT_BTN
      && this.nextPlayableLevel < actualLevelIndex;
  }

  private setStartForCurrentPage(): void {
    const { start } = this.getPageRange(this.currentPage);
    this.start = start;
  }

  private updateLevelButtons() {
    this.setStartForCurrentPage();

    for (let index = 0; index < TOTAL_BUTTONS; index++) {
      const btn = this.btnList[index];
      if (!btn) continue;

      //Handle display if index is at nav buttons then skip.
      if (index === PREV_BTN || index === NEXT_BTN) {
        const shouldShow = index === PREV_BTN
          ? this.currentPage > 1
          : this.currentPage < this.totalPages;

        btn.updateBtnDisplay(shouldShow);
        continue;
      };

      const gameLevel = this.getGameLevel(index);
      const text = this.getLevelTypeName(gameLevel);

      btn.updateLevelTypeText(text);
      //Hide excess game level buttons on page.
      if (gameLevel > this.maxGameLevels) {
        btn.updateBtnDisplay?.(false); //hide button
        continue;
      }
      const { starsCount, hasLevelBeenPlayed } = this.getGameLevelScore(gameLevel);

      //Handle disabling and enabling of buttons based on previous levels played.
      const isnextPlayableLevel = this.isNextPlayableLevel(gameLevel);
      const isLock = this.isGameLocked(gameLevel, index);

      if (index === SPECIAL_LEVELS_INDEX) {
        btn.updateButtonImage(
          hasLevelBeenPlayed
            ? TREASURE_CHEST_SPECIAL_LEVELS_DONE
          : TREASURE_CHEST_SPECIAL_LEVELS_ONGOING
        );
      }
      btn.enablePulseEffect(isnextPlayableLevel);
      btn.updateBtn(gameLevel, isLock, starsCount);
    }
  }

  //Delete 12 button elements.
  private clearBtns() {
    for (let index = 0; index < TOTAL_BUTTONS; index++) {
      const btn = this.btnList[index];
      if (!btn) continue;

      btn.dispose();
    }
  }

  public dispose() {
    this.audioPlayer.stopAllAudios();
    // when app goes background
    document.removeEventListener(
      "visibilitychange",
      this.pausePlayAudios,
      false
    );

    /// swipe listener
    document
      .getElementById(HTML_EVENT_ELEMENT_ID)
      .removeEventListener("touchstart", this.boundTouchStart, false);

    document
      .getElementById(HTML_EVENT_ELEMENT_ID)
      .removeEventListener("touchmove", this.boundTouchMove, false);

    this.clearBtns();
    this.destroy();
  }

}