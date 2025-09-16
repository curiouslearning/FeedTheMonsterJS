import { TreasureChestAnimation } from './treasureChestAnimation';

export class TreasureChestMiniGame {
  private earnedStarCount: number;
  /**
   * Lifecycle flag for the Treasure Chest mini-game.
   *
   * - The game has 5 segments, and this mini-game can appear randomly in any segment.
   * - When completed, the flag 'this.miniGameStatus' is set to `true` to prevent retriggering within the same level.
   * - The flag resets to `false` during `dispose()`, after the game concludes.
   */
  private collectedStones: number;
  private callback: any;
  public miniGameStatus: boolean = false;
  private treasureAnimation: TreasureChestAnimation;

  constructor(miniGameCompleteCallback) {
    this.earnedStarCount = 0;
    this.collectedStones = 0;
    this.callback = miniGameCompleteCallback;
    this.treasureAnimation = new TreasureChestAnimation(
      window.innerWidth,
      window.innerHeight,
      this.tapStoneCallback.bind(this)
    );
  }

  public tapStoneCallback() {
    this.collectedStones++;
  }

  private processStoneCollection() {
    //Convert collection stones from tapping into a star value; Max of 1 star.
    this.earnedStarCount = this.collectedStones >= 3 ? 1 : 0;

    //Set miniGameStatus to TRUE for minigame handler. Draw will be disabled.
    this.miniGameStatus = true;

    //Trigger callback from parent miniGameHandler when the treasure chest mini game is complete.
    this.callback(this.earnedStarCount);
  }

  //Draw logic for treasure chest minigame. Called by mini game handler.
  public draw() {
    if (!this.miniGameStatus) {
      // Start the animation
      this.treasureAnimation.show(() => {
        // Animation complete callback
        console.log("Treasure Chest Animation Completed");

        //Convert collectedStones into a star after the treasure chest animation.
        this.processStoneCollection();
      });
    }

  }

  //Called before moving to level-end scene. This is handled and used by mini game handler.
  public dispose() {
    this.earnedStarCount = 0;
    this.collectedStones = 0;
    this.miniGameStatus = false;
    this.treasureAnimation.hide();
  }
}