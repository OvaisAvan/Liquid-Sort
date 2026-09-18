(function(root){
'use strict';
const capacity=4;
const levels=[[[0,1,0,1],[1,0,1,0],[],[]],[[0,1,2,0],[1,2,0,1],[2,0,1,2],[],[]],[[0,1,2,3],[1,2,3,0],[2,3,0,1],[3,0,1,2],[],[]]];
function pour(board,from,to){
 if(from===to||!board[from]?.length||!board[to]||board[to].length>=capacity)return null;
 const source=board[from],dest=board[to],colour=source.at(-1);
 if(dest.length&&dest.at(-1)!==colour)return null;
 let count=0;for(let i=source.length-1;i>=0&&source[i]===colour;i--)count++;
 count=Math.min(count,capacity-dest.length);
 const next=board.map(j=>j.slice());next[from].splice(-count);next[to].push(...Array(count).fill(colour));return {board:next,count,colour};
}
function won(board){return board.every(j=>!j.length||(j.length===capacity&&j.every(c=>c===j[0])));}
function legalMoves(board){return board.flatMap((_,a)=>board.map((_,b)=>pour(board,a,b)?[a,b]:null).filter(Boolean));}
const api={capacity,levels,pour,won,legalMoves};if(typeof module!=='undefined')module.exports=api;else root.LiquidSort=api;
})(typeof window!=='undefined'?window:globalThis);
