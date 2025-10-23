import { TreasureChestAnimation } from './treasureChestAnimation';
import TreasureStones from './treasureStones';

export class TreasureChestMiniGame {
  private earnedStarCount: number;
  private collectedBefore60: number = 0;  // Stones collected before 60% exit
  private collectedAfter60: number = 0;   // Stones collected after 60% exit
  private blueBonusPending: boolean = false;
  private miniGameEnded: boolean = false;
  /**
   * Lifecycle flag for the Treasure Chest mini-game.
   *
   * - The game has 5 segments, and this mini-game can appear randomly in any segment.
   * - When completed, the flag 'this.miniGameStatus' is set to `true` to prevent retriggering within the same level.
   * - The flag resets to `false` during `dispose()`, after the game concludes.
   */
  private collectedStones: number;
  public miniGameStatus: boolean = false;
  private treasureAnimation: TreasureChestAnimation;
  private treasureStones: TreasureStones;
  private callback: (stars: number, options?: any) => void;


  constructor(miniGameCompleteCallback) {
    this.earnedStarCount = 0;
    this.collectedStones = 0;
    this.callback = miniGameCompleteCallback;
    this.treasureAnimation = new TreasureChestAnimation(
      window.innerWidth,
      window.innerHeight,
      this.tapStoneCallback.bind(this)
    );

    // Initialize stones manager
    const ctx = this.treasureAnimation['ctx']; // assuming canvas context
    this.treasureStones = new TreasureStones(ctx);

    // Hook events from TreasureStones
    this.treasureStones.onStoneCollected = this.onStoneCollected.bind(this);
    this.treasureStones.onStones60PercentExited = this.onStones60Exited.bind(this);
  }

  public tapStoneCallback() {
    this.collectedStones++;
  }

   /** Track stone collection timing */
  private onStoneCollected(collectedBefore60: boolean) {
    if (collectedBefore60) this.collectedBefore60++;
    else this.collectedAfter60++;
  }

  /** Triggered once 60% of stones have exited */
  private onStones60Exited() {
    if (this.collectedBefore60 >= 3) {
      // Player qualifies early → show Blue Bonus Star
      this.treasureAnimation.showBlueBonusStar();
    } else if (this.collectedBefore60 + this.collectedAfter60 >= 3) {
      // Player qualifies late → defer to Monster Progression
      this.blueBonusPending = true;
    }
  }


 private processStoneCollection() {
    const totalCollected = this.collectedBefore60 + this.collectedAfter60;
    this.earnedStarCount = totalCollected >= 3 ? 1 : 0;

    if (this.blueBonusPending) {
      // Notify main game to show bonus later on Monster Progression
      this.callback(this.earnedStarCount, { showBonusLater: true });
    } else {
      // Show star immediately or no star if <3 stones
      this.callback(this.earnedStarCount);
    }

    this.miniGameEnded = true;
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