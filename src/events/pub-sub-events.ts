/**
 * PubSub.ts
 *
 * This class implements the Publish-Subscribe (Pub/Sub) pattern,
 * providing a asynchronous event-driven communication within the applicaiton.
 * It includes methods for subscribing to events, publishing events to
 * pass the new/updated data and notifiy subscribers, and un-subscribing from events
 * to prevent memory leaks. This pattern promotes loose coupling between components,
 * allowing greater scalability and maintainability event handling.
*/
export class PubSub {
    private subscribers: any;
    public EVENTS: {
        SCENE_NAME_EVENT: string;
        GAMEPLAY_DATA_EVENT: string;
        GAME_PAUSE_STATUS_EVENT: string;
    }

    constructor() {
        this.subscribers = {}
        this.EVENTS = {
            SCENE_NAME_EVENT: 'SCENE_NAME_EVENT',
            GAMEPLAY_DATA_EVENT: 'GAMEPLAY_DATA_EVENT',
            GAME_PAUSE_STATUS_EVENT: 'GAME_PAUSE_STATUS_EVENT'
        }
    }

    testCheckSubscribers() {
        //To Do - This will be remove after developing FM-285
        console.log('this.subscribers ', this.subscribers)
    }

    subscribe(event, fn) {
        const isEventHasFunctions = Array.isArray(this.subscribers[event]);
        this.subscribers[event] = isEventHasFunctions ? [...this.subscribers[event], fn] : [fn];
    }

    unsubscribe(event, listener){
        if(!this.subscribers[event]) return;
        //Remove function listed in the event.
        this.subscribers[event] = this.subscribers[event].filter(fn => fn !== listener);
    }

    publish(event, data) {
        if(!this.subscribers[event]) return;
        this.subscribers[event].forEach(eventFunc => {
            eventFunc(data);
        });
    }
}