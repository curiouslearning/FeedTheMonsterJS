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
    private listenerIdCounter: number;

    constructor() {
        this.subscribers = {};
        this.listenerIdCounter = 0;
    }

    checkSubscribers() {
        //To Do - This will be remove after developing FM-285
        console.log('checkSubscribers ', this.subscribers)
    }

    subscribe(event, listenerCallback) {
        const listenerId = this.listenerIdCounter++;

        if (!this.subscribers[event]) {
            this.subscribers[event] = {};
        };

        this.subscribers[event][listenerId] = listenerCallback;

        //Returns an unsubscribe function for clearing.
        return () => {
            this.unsubscribe(event, listenerId);
        }

    }

    unsubscribe(event, listenerId){
        if(!this.subscribers[event] || !this.subscribers[event][listenerId]) return;
        //Remove function listed in the event.
        delete this.subscribers[event][listenerId];
    }

    publish(event, data) {
        if(!this.subscribers[event]) return;

        Object.keys(this.subscribers[event]).forEach(listenerId => {
            if (this.subscribers[event][listenerId]) {
                this.subscribers[event][listenerId](data);
            };
        });
    }
}