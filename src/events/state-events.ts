export class StateEvents {
    subscribers: any;

    constructor() {
        this.subscribers = {}
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
        console.log('unsubscribe event ', event)
        if(!this.subscribers[event]) return;
        //Remove function listed in the event.
        this.subscribers[event] = this.subscribers[event].filter(fn => fn !== listener);

        console.log('updated subscribers ', this.subscribers)
    }

    publish(event, data) {
        if(!this.subscribers[event]) return;
        this.subscribers[event].forEach(eventFunc => {
            eventFunc(data);
        });
    }
}