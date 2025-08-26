import { PubSub } from '../../events/pub-sub-events';

export class MiniGameStateService extends PubSub {
  public EVENTS: {
    IS_MINI_GAME_DONE: string;
  }

  constructor() {
    super();
    this.EVENTS = {
      IS_MINI_GAME_DONE: 'IS_MINI_GAME_DONE'
    }
    //Add states here needed for mini games

    this.initListeners();
  }

  private initListeners() {
    /* Listeners to update mini game state values or trigger certain logics. */
  }

  selectLevelAtRandom(levelSegmentLength: number) {
    return Math.floor(Math.random() * levelSegmentLength) + 1;
  }
}

