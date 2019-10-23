import { generate } from "./data.js";

export let suite = {};
export const test = {};
export const root = document.getElementById("root");
const result = document.getElementById("result").appendChild(document.createTextNode("running..."));
let items = [];
export function store(data){ return (data && (items = data)) || items; }
let pos = 0;
export const queue = [];
const pathname = window.location.pathname;
const keyed = pathname.indexOf("/keyed.html") !== -1;
const strict = pathname.indexOf("/strict.html") !== -1;
const internal = (pathname.indexOf("/internal.html") !== -1) ||
                 (pathname.indexOf("mikado-observer") !== -1) ||
                 (pathname.indexOf("mikado-proxy") !== -1);

const params = (function(){

    const obj = {};
    const pairs = window.location.search.substring(1).split('&');

    for(let i = 0, split; i < pairs.length; i++){

        split = pairs[i].split('=');
        obj[split[0]] = split[1];
    }

    return obj;
}());

const duration = parseFloat(params["duration"] || "5") * 1000;
const hidden = params["hidden"] !== "false";
const factory = strict ? [] : [generate(100), generate(100), generate(100), generate(100), generate(100)];
let clone;

root.hidden = hidden;

function next(){

    if(strict){

        return items = generate(100);
    }

    if(internal){

        copy(factory[pos], items);
    }
    else{

        items = enforce(factory[pos]);
    }

    if(++pos === factory.length){

        pos = 0;
    }

    return items;
}

function copy(data, items){

    for(let i = 0; i < data.length; i++){

        items[i] = data[i];
    }

    return items;
}

function enforce(data){

    if(!internal){

        data = data.slice(0);

        for(let i = 0; i < data.length; i++){

            data[i] = Object.assign({}, data[i]);
        }
    }

    return data;
}

queue.push({
    name: "create",
    init: function(){
        items.splice(0);
        this.fn(items);
    },
    test: null,
    start: function(){
        shuffle();
    },
    prepare: function(){
        clone = next();
    },
    fn: null,
    end: function(){
        items.splice(0);
        this.fn(items);
    },
    complete: null
});

queue.push({
    name: "replace",
    init: function(){
        this.fn(next());
    },
    test: null,
    start: function(){
        shuffle();
    },
    prepare: function(){
        clone = next();
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

queue.push({
    name: "update",
    init: function(){
        this.fn(next());
    },
    test: null,
    start: null,
    prepare: function(index){
        clone = enforce(update(items, index));
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

queue.push({
    name: "arrange",
    init: function(){
        this.fn(next());
    },
    test: null,
    start: null,
    prepare: function(index){
        index %= 5;
        if((index === 1) || (index === 3)){ // swap
            swap(items, 1, items.length - 2);
        }
        else if((index === 2) || (index === 4)){ // re-order
            for(let i = 0; i < 10; i++){
                swap(items, 10 + i, 80 + i);
                swap(items, 60 + i, 30 + i);
            }
        }
        else{
            shuffle(items);
        }
        clone = enforce(items);
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

queue.push({
    name: "repaint",
    init: function(){
        this.fn(next());
    },
    test: null,
    start: function(){
        clone = enforce(items);
    },
    prepare: null,
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

let tmp;

queue.push({
    name: "append",
    init: null,
    test: null,
    start: function(){
        shuffle();
        tmp = next().splice(50);
        this.fn(enforce(items));
    },
    prepare: function(){
        clone = enforce(items.concat(tmp));
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

queue.push({
    name: "remove",
    init: null,
    test: null,
    start: function(){
        shuffle();
        this.fn(next());
    },
    prepare: function(){
        items.splice(50);
        clone = enforce(items);
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

queue.push({
    name: "toggle",
    init: function(){
        shuffle();
        this.fn(clone = next());
    },
    test: null,
    start: null,
    prepare: function(index){
        if(index % 2){
            clone = enforce(clone.concat(tmp));
        }
        else{
            tmp = clone.splice(50);
            clone = enforce(clone);
        }
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

queue.push({
    name: "clear",
    init: null,
    test: null,
    start: function(){
        shuffle();
        this.fn(next());
    },
    prepare: function(){
        items.splice(0);
        clone = items;
    },
    fn: null,
    end: null,
    complete: function(){
        items.splice(0);
        this.fn(items);
    }
});

/*
let defer_test, defer_start, defer_duration, defer_count;

export function defer(){

    defer_duration += (perf.now() - defer_start);

    if(++defer_count < defer_test.loop){

        Promise.resolve().then(defer_test.defer);
    }
    else{

        console.log(defer_duration);
    }
}

queue.push({
    name: "click",
    defer: function(){
        defer_start = perf.now();
        root.firstElementChild.firstElementChild.firstElementChild.dispatchEvent(new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true
        }));
    },
    init: function(){
        //root.textContent = "";
        defer_duration = 0;
        defer_count = 0;
        this.fn(items.slice(0));
    },
    test: null,
    start: null,
    fn: null,
    complete: function(){
        this.fn([]);
        //root.textContent = "";
    }
});
*/

// #####################################################################################
// #####################################################################################

window.onload = function(){

    if(queue.length){

        const lib = Object.keys(suite)[0];

        for(let i = 0, item; i < queue.length; i++){

            item = queue[i];
            item.fn || (item.fn = suite[lib]);
            item.test || (item.test = suite[lib]);
        }

        setTimeout(perform, 500);
    }
};

// #####################################################################################
// #####################################################################################

function check(fn){

    const data = generate(2);

    items.push(data[0]);
    fn(enforce(items));
    if(!validate(data[0])) return false;

    items.pop();
    items.push(data[1]);
    fn(enforce(items));
    if(!validate(data[1])) return false;

    items.pop();
    items.push(data[0]);
    fn(enforce(items));
    if(!validate(data[0])) return false;

    // checks if libs updates contents on same id

    const tmp = enforce(items);
    tmp[0].title = "test";
    fn(tmp);
    if(!validate(tmp[0])) return false;

    if(keyed){

        const node = root.firstElementChild.firstElementChild.firstElementChild;
        node._test = true;
        items.pop();
        items.push(data[1]);
        fn(enforce(items));
        if(root.firstElementChild.firstElementChild.firstElementChild._test){
            msg("lib does not run in keyed mode.");
            return false;
        }
        node._test = false;
    }
    else if(strict){

        items.pop();
        items.push(data[0]);
        fn(enforce(items));
        const node = root.firstElementChild.firstElementChild.firstElementChild;
        node._test = true;
        fn(enforce(items));
        if(root.firstElementChild.firstElementChild.firstElementChild._test){
            msg("lib does not run in strict mode.");
            return false;
        }
        node._test = false;
    }

    items.pop();
    fn(items);
    return (root.children.length === 0) || (root.firstElementChild.children.length === 0);
}

function check_test(test){

    if(test.init) test.init();

    for(let i = 0; i < 3; i++){

        if(test.start) test.start(i);
        if(test.prepare) test.prepare(i);
        test.fn(clone);
        if(!check_loop(test.name)) return false;
        if(test.end) test.end(i);
    }

    if(test.complete) test.complete();

    return (root.children.length === 0) || (root.firstElementChild.children.length === 0);
}

function check_loop(name){

    for(let i = 0; i < clone.length; i++){

        if(!validate(clone[i], i)){

            return msg("test failed: " + name + ", index:" + i);
        }
    }

    return true;
}

function validate(item, index){

    let section = root.firstElementChild;
    if(!section) return msg("root.firstElementChild");
        (section.tagName.toLowerCase() === "section") || (section = section.firstElementChild);
        (section.tagName.toLowerCase() === "section") || (section = section.firstElementChild);

    index && (section = section.parentElement.children[index]);

    const dataset = section.dataset;
    if(dataset.id !== item.id) return msg("dataset.id", dataset.id + " should be " + item.id);
    if(dataset.date !== item.date) return msg("dataset.date", dataset.date + " should be " + item.date);
    if(dataset.index !== String(item.index)) return msg("dataset.index", dataset.index + " should be " + item.index);

    const wrapper = section.firstElementChild;
    if(wrapper.className !== item.classname) return msg("wrapper.className", wrapper.className + " should be " + item.classname);
    if(wrapper.style.paddingRight !== "10px") return msg("wrapper.style", wrapper.style.paddingRight + " should be " + "10px");

    const title = wrapper.firstElementChild;
    if(title.textContent !== item.title) return msg("title.textContent", title.textContent + " should be " + item.title);

    const content = title.nextElementSibling;
    if(content.textContent !== item.content) return msg("content.textContent", content.textContent + " should be " + item.content);

    const footer = content.nextElementSibling;
    if(footer.textContent !== item.footer) return msg("footer.textContent", footer.textContent + " should be " + item.footer);

    return true;
}

function msg(message, a){

    a ? console.error(message, a) : console.error(message);
    return false;
}

// #####################################################################################
// #####################################################################################

let str_results = "";
const perf = window.performance;
      perf.memory || (perf.memory = { usedJSHeapSize: 0 });

let current = 0;
let update_failed;

function perform(){

    const test = queue[current];
    let elapsed = 0, memory = 0;

    if(current === 0 && test.test) check(test.test) || msg("Main test failed");
    let status = check_test(test) || msg("Test failed: " + test.name);

    // Not allowed when update test fails
    if(update_failed && (test.name === "repaint")){
        status = false;
    }

    let loops = 0, now = perf.now();

    if(status){

        if(test.init) test.init();

        // if(test.defer){
        //     defer_test = test;
        //     if(test.start) test.start();
        //     test.defer();
        //     return;
        // }

        const end = now + duration;

        for(let start, mem_start, mem; now < end; loops++){

            if(test.start) test.start(loops);
            if(!internal && test.prepare) test.prepare(loops);

            mem_start = perf.memory.usedJSHeapSize;
            start = perf.now();
            if(internal && test.prepare) test.prepare(loops);
            test.fn(clone);
            now = perf.now();
            mem = perf.memory.usedJSHeapSize - mem_start;
            elapsed += now - start;
            if(mem > 0) memory += mem;

            if(test.end) test.end(loops);
        }

        if(test.complete) test.complete();
    }
    else if(test.name === "update"){

        update_failed = true;
    }

    current++;

    if(window === window.top){

        result.nodeValue = (str_results += (status ? test.name.padEnd(12) + String(Math.floor(1000 / elapsed * loops)).padStart(8) + " op/s, Memory:\t" + (memory ? Math.floor(memory / loops) : "-") : "- failed -") + "\n") + (current < queue.length ? "running..." : "");
    }
    else{

        window.top.postMessage(test.name + "," + (status ? Math.floor(1000 / elapsed * loops) : 0) + "," + (status ? Math.floor(memory / loops) : 0), location.protocol + "//" + location.hostname) //"https://nextapps-de.github.io" "https://raw.githack.com"
    }

    if(current < queue.length){

        setTimeout(perform, 500);
    }
    else{

        current = 0;
    }
}

/*
function median(arr){

    arr.sort(function(a, b){

        return a - b;
    });

    const length = arr.length;
    const half = length / 2;

    return (

        length % 2 ?

            arr[half | 0]
        :
            (arr[half - 1] + arr[half]) / 2
    );
}

function normalize(arr){

    arr.sort(function(a, b){

        return a - b;
    });

    arr = arr.slice((arr.length / 4) | 0, (arr.length / 2) | 0);

    const length = arr.length;
    let sum = 0;

    for(let i = 0; i < length; i++){

        sum += arr[i];
    }

    return sum / length;
}
*/

function shuffle(items){

    items || (items = factory[pos]);

    for(let i = items.length - 1; i > 0; i--) {

        swap(items, i, (Math.random() * i) | 0);
    }

    return items;
}

function swap(items, a, b){

    if(a !== b){

        const tmp = items[b];
        items[b] = items[a];
        items[a] = tmp;
    }
}

function update(items, index){

    for(let i = 0, length = items.length; i < length; i++){

        if((i + index) % 29 === 0) swap_value(items, i, length, "date");
        if((i + index) % 23 === 0) swap_value(items, i, length, "classname");
        if((i + index) % 19 === 0) swap_value(items, i, length, "months");
        if((i + index) % 17 === 0) swap_value(items, i, length, "content");
        if((i + index) % 13 === 0) swap_value(items, i, length, "title");
        if((i + index) % 11 === 0) swap_value(items, i, length, "days");
        if((i + index) % 7 === 0) swap_value(items, i, length, "footer");
    }

    return items;
}

function swap_value(items, a, b, prop){

    b = (Math.random() * b) | 0;

    if(a !== b){

        const tmp = items[b][prop];
        items[b][prop] = items[a][prop];
        items[a][prop] = tmp;
    }
}
