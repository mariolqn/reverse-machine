// Sample minified/obfuscated JavaScript code for testing cost estimation
function a(b,c){var d=0;for(var e=0;e<b.length;e++){d+=b[e]*c[e]}return d}function f(g){var h=[];for(var i=0;i<g.length;i++){if(g[i]%2===0){h.push(g[i])}}return h}var j=[1,2,3,4,5,6,7,8,9,10];var k=[2,4,6,8,10,12,14,16,18,20];console.log(a(j,k));console.log(f(j));

// Another minified function
(function(l,m,n){var o=function(p){return p.split('').reverse().join('')};var q=function(r,s){return r+s};var t=l.getElementById(m);if(t){t.innerHTML=o(n)}})(document,'output','Hello World');

// Compressed array operations
var u=function(v,w){return v.map(function(x){return x*w})};var y=function(z,aa){return z.filter(function(bb){return bb>aa})};var cc=[1,2,3,4,5];console.log(u(cc,3));console.log(y(cc,2)); 