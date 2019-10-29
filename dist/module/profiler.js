const timers=window._timers={},queue=[];export function profiler_start(a){const b=timers[a]||(timers[a]={count:0,time:0,start:0,ops:0});if(queue.length){const a=performance.now();for(let b=0;b<queue.length;b++){const c=timers[queue[b]],d=a-c.start;c.time+=d}}queue[queue.length]=a,b.start=performance.now()}export function profiler_end(a){const b=performance.now(),c=timers[a];c.count++,c.time+=b-c.start,c.ops=format_number(1000/c.time*c.count,0,",","."),queue.pop(),queue.length&&(timers[queue[queue.length-1]].start=performance.now())}function format_number(a,b,c,d){0===b?a|=0:(b=Math.pow(10,b||2),b&&(a=(0|a*b)/b));const e=(""+(0>a?-a:a)).split("."),g=e[0],h=e[1],f=g.length;let j=f,k="";for(;j--;)k=(0===j?"":(f-j)%3?"":d||",")+g.charAt(j)+k;return(0>a?"-":"")+k+(h?(c||".")+h:"")}