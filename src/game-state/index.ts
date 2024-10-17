import { StateEvents } from '@gameEvents';
import { GameData } from './game-data';
import { DataModal } from "@data";
import { createGameplaySceneDAO } from './dao/gamePlaySceneDAO';
import {
    SET_GAME_DATA,
    UPDATED_GAMEPLAY_DATA
} from '@constants';

export class GameState {
    private gameData: any;

    constructor(canvas: HTMLCanvasElement, data: DataModal) {
        this.gameData = new GameData(data, canvas);
        this.initListeners();
    }

    getGamePlayDAO() {
        console.log('this.gameData ', this.gameData)
        const gamePlayState = createGameplaySceneDAO(this.gameData);
        return gamePlayState;
    }

    private initListeners() {
        //Global listener for any publish event to update game state.
        StateEvents.subscribe(SET_GAME_DATA, this.gameStateGamePlayDataListener.bind(this));
    }

    private gameStateGamePlayDataListener(updatedProperties) {
        const updatedValue = this.updateGameStateValues(updatedProperties);
        this.notifyDataSubscribers(UPDATED_GAMEPLAY_DATA, createGameplaySceneDAO(updatedValue));
    }

    private updateGameStateValues(updatedProperties) {
        //A dynamic method for handling changes to game state.
        console.log(' ')
        console.log('updatedProperties ', updatedProperties)
        console.log('before this.gameData ', {... this.gameData })
        this.gameData = { ...this.gameData, ...updatedProperties};
        console.log('after this.gameData ', {... this.gameData })
        return this.gameData;
    }

    private notifyDataSubscribers(event, data) {
        StateEvents.publish(event, data);
    }

};