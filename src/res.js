
// const serverUrl = 'http://localhost:8000';
// const serverUrl = 'http://192.168.1.152:8000';
const serverUrl = 'http://96.231.45.134:6085';
const socketUrl = 'ws://192.168.1.152:8000/ws';

const hex = "M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z";
const map = {"6-12":"*", "6-10":"a", "7-11":"b", "7-13":"c", "6-14":"d", "5-13":"e", "5-11":"f"};
for (let i=1;i<6;i++) {
  map["6-"+(10-2*i)] = "a"+i;
  map[""+(7+i)+"-"+(11-i)] = "b"+i;
  map[""+(7+i)+"-"+(13+i)] = "c"+i;
  map["6-"+(14+2*i)] = "d"+i;
  map[""+(5-i)+"-"+(13+i)] = "e"+i;
  map[""+(5-i)+"-"+(11-i)] = "f"+i;
  for (let j=1;j<i+1;j++) { 
    map[""+(6+j)+"-"+(10-2*i+j)] = "a"+i+j;
    map[""+(7+i)+"-"+(11-i+2*j)] = "b"+i+j;
    map[""+(7+i-j)+"-"+(13+i+j)] = "c"+i+j;
    map[""+(6-j)+"-"+(14+2*i-j)] = "d"+i+j;
    map[""+(5-i)+"-"+(13+i-2*j)] = "e"+i+j;
    map[""+(5-i+j)+"-"+(11-i-j)] = "f"+i+j;
  }
}
for (let i=0;i<12;i++) for (let j=0;j<25;j++) if (!map[''+i+'-'+j]) map[''+i+'-'+j]="XXX";

const revMap = {};
const keys = Object.keys(map);
for (const hex of keys) revMap[map[hex]] = hex; 
const off = 'drop-shadow(rgba(210, 128, 210, 0.4) 0px 0px 2px)';

function flipped(here) {
    const coord = revMap[here].split('-');
    const flip = coord[0]+'-'+(24-parseInt(coord[1]));
    return map[flip];
}
function inStartPos(piece) { // console.log('inStartPos',piece);
    return 'wPd55 wPd44 wPd33 wPd21 wPc22 wPc31 wPc41 wPc51 wSd43 wSd32 wSd2 wSc32 wSc42 bPf51 bPf41 bPf31 bPf22 bPa21 bPa33 bPa44 bPa55 bSf42 bSf32 bSa2 bSa32 bSa43 '.includes(piece+' ');
}
function inPromotePos(piece) {
    return 'f5 f51 f52 f53 f54 f55 a5 a51 a52 a53 a54 a55 b5 c5 c51 c52 c53 c54 c55 d5 d51 d52 d53 d54 d55 e5 '.includes(piece+' ');
}
function whiteMove(match) {
    return match.log.length%2===0;
}
function get(who, match) { // console.log('get(',who,')');
    if (who[0]==='w') return match.white.pieces.filter(f => f[0]===who[1]);
    else return match.black.pieces.filter(f => f[0]===who[1]);

}
function getPiece(match, here) { //console.log('getPiece', match, here);
    const h = here.replace(/[PSARBNKQIE]/,'');
    for (const p in match.white.pieces) if (match.white.pieces[p].substring(1)===h) return [match.white.pieces[p], true, p];
    for (const p in match.black.pieces) if (match.black.pieces[p].substring(1)===h) return [match.black.pieces[p], false, p];
    return null;
}
function swapPieces(match, a, b) { // console.log('swapPieces',a,b);
    const p = getPiece(match, a); console.log('p',p);
    if (!p) return false;
    const q = getPiece(match, b); console.log('q',q);
    if (p) // first selected on piece
        if (p[1]) match.white.pieces = match.white.pieces.filter(f => f.substring(1)!==a);
        else match.black.pieces = match.black.pieces.filter(f => f.substring(1)!==a);
    if (q) // second selected on piece
        if (q[1]) match.white.pieces = match.white.pieces.filter(f => f.substring(1)!==b);
        else match.black.pieces = match.black.pieces.filter(f => f.substring(1)!==b);     

    if (p && q) {
        if (q[1]) match.white.pieces.push(q[0][0]+p[0].substring(1));
        else match.black.pieces.push(q[0][0]+p[0].substring(1));
        if (p[1]) match.white.pieces.push(p[0][0]+q[0].substring(1));
        else match.black.pieces.push(p[0][0]+q[0].substring(1));
    } else if (p) {
        if (p[1]) match.white.pieces.push(p[0][0]+b);
        else match.black.pieces.push(p[0][0]+b);
    }
    return true;
}
function marchOn(match, pos, left, right) {  // console.log("marchOn", pos, left, right)
    const p = getPiece(match, pos); // console.log("the p", p);
    if (p[1]) { // white
        const coord = revMap[p[0].substring(1)].split('-');
        const march = coord[0]+'-'+(parseInt(coord[1])-2);
        movePiece(match, null, [p[0].substring(1), map[march]])
        if (left > 0) {
            const lp = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])+1)]);
            if (lp) marchOn(match, lp[0], left-1, 0);
            else {
                const ls = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])+3)]);
                if (ls) marchOn(match, ls[0], left-1, 0);
            }
        }
        if (right > 0) {
            const rp = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])+1)]);
            if (rp) marchOn(match, rp[0], 0, right-1);
            else {
                const rs = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])+3)]);
                if (rs) marchOn(match, rs[0], 0, right-1);
            }
        }
    } else { // black
        const coord = revMap[p[0].substring(1)].split('-');
        const march = coord[0]+'-'+(parseInt(coord[1])+2);
        movePiece(match, null, [p[0], map[march]])
        if (left > 0) {
            const lp = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])-1)]);
            if (lp) marchOn(match, lp[0], left-1, 0);
            else {
                const ls = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])-3)]);
                if (ls) marchOn(match, ls[0], left-1, 0);
            }
        }
        if (right > 0) {
            const rp = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])-1)]);
            if (rp) marchOn(match, rp[0], 0, right-1);
            else {
                const rs = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])-3)]);
                if (rs) marchOn(match, rs[0], 0, right-1);
            }
        }

    }
}
function formationSwitchArms(match, pos, left, right) {  // console.log("formationSwitchArms", pos, left, right)
    const p = getPiece(match, pos); // console.log("the p", p);
    const coord = revMap[p[0].substring(1)].split('-');
    switchArms(match, p[0].substring(1));
    if (p[1]) { // white
        if (left > 0) {
            const lp = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])+1)]);
            if (lp) formationSwitchArms(match, lp[0], left-1, 0);
            else {
                const ls = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])+3)]);
                if (ls) formationSwitchArms(match, ls[0], left-1, 0);
            }
        }
        if (right > 0) {
            const rp = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])+1)]);
            if (rp) formationSwitchArms(match, rp[0], 0, right-1);
            else {
                const rs = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])+3)]);
                if (rs) formationSwitchArms(match, rp[0], 0, right-1);
            }
        }
    } else { // black
        if (left > 0) {
            const lp = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])-1)]);
            if (lp) formationSwitchArms(match, lp[0], left-1, 0);
            else {
                const ls = getPiece(match,map[''+(parseInt(coord[0])-1)+'-'+(parseInt(coord[1])-3)]);
                if (ls) formationSwitchArms(match, ls[0], left-1, 0);
            }
        }
        if (right > 0) {
            const rp = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])-1)]);
            if (rp) formationSwitchArms(match, rp[0], 0, right-1);
            else {
                const rs = getPiece(match,map[''+(parseInt(coord[0])+1)+'-'+(parseInt(coord[1])-3)]);
                if (rs) formationSwitchArms(match, rs[0], 0, right-1);
            }
        }

    }
}
function switchArms(match, pos) {
    const p = getPiece(match, pos);
    if (p[1]) { // white
        match.white.pieces[p[2]] = (p[0][0]==='P'?'S':'P')+p[0].substring(1)
    } else { // black
        match.black.pieces[p[2]] = (p[0][0]==='P'?'S':'P')+p[0].substring(1)
    }
}
function movePiece(match, board, hexs) { //console.log('movePiece(match,', hexs,')');
    if (hexs.length === 1) { // formation moves
        const temp = [...match.log]
        const pos = hexs[0].match(/[/abcdef*]\d*/)[0];
        const leftright = hexs[0].split(pos);
        if (leftright[0].length===0 && leftright[1].length===0) {
            switchArms(match, pos);
        } else if ((leftright[0]+leftright[1])[0]==='#') {
            formationSwitchArms(match, pos, leftright[0].length, leftright[1].length);
        } else marchOn(match, pos, leftright[0].length, leftright[1].length);
        match.log = [...temp]
        match.log.push(hexs[0]);
    } else {
        const pos0 = hexs[0].replace(/[PSARBNKQIE]/,'');
        const pos1 = hexs[1].replace(/[PSARBNKQIE]/,'');
        const p = getPiece(match, hexs[0]); //console.log('p',p);
        const q = getPiece(match, hexs[1]); //console.log('q',q);
        if (p[1]) { // console.log('looking for',here,'in',match.black.pieces);
            // if pinned and not attacking skewerer... return
            const skewer = board?board.pinned.filter(p=>p[0]===pos0)[0]:false;
            if (skewer && skewer[1] !== q[0]) return;
            const index = match.white.pieces.indexOf(p[0]);
            match.white.pieces[index]=p[0][0]+pos1;
            match.log.push(p[0]+(match.black.pieces.filter(f => f.substring(1)===pos1).length>0?'x':'~')+(q?q[0]:pos1));
            match.black.pieces = match.black.pieces.filter(f => f.substring(1)!==pos1);
        } else { // console.log('looking for',pos1,'in',match.white.pieces);
            const index = match.black.pieces.indexOf(p[0]);
            const skewer = board?board.pinned.filter(p=>p[0]===pos0)[0]:false;
            if (skewer && skewer[1] !== q[0]) return;
            // if (board.pinned.filter(p=>p[0]===pos0 && p[1]!==q[0])) console.log('pinned piece dint attack skewer!');
            match.black.pieces[index]=p[0][0]+pos1;
            match.log.push(p[0]+(match.white.pieces.filter(f => f.substring(1)===pos1).length>0?'x':'~')+(q?q[0]:pos1));
            match.white.pieces = match.white.pieces.filter(f => f.substring(1)!==pos1);
        }
    }
}
function clear() {
    let all = document.getElementsByClassName("hex");
    Array.from(all).forEach((el) => {
        el.setAttribute('style', off)
        el.setAttribute('stroke', '#000');
        el.setAttribute('strokeWidth', '0.4');
    });
}
function isOnBoard(i,j) { //console.log('isOnBoard',i,j);
    const x = i;
    const y = j + i%2;
    if (x<0 || x>12 || x+y<6 || x+y>31 || x-y>6 || y-x>19) return false;
    return true;
}
function parsePiece(piece) { //console.log('parsePiece', piece);
    const where = piece.substring(2);
    const start = revMap[where].split('-'); // console.log('start',start)
    const xy = [parseInt(start[0]),parseInt(start[1])]
    return [[piece[0]==='w',piece[1]],xy];
}
function slide(piece,occupants,direction) { // console.log('slide',piece,occupants,direction);
    const moves = []; 
    const attacks = [];
    const pinned = [];
    // eslint-disable-next-line
    const [who, xy] = parsePiece(piece);
    for (const d of direction) { // console.log('d',d);
        let go = true;
        for (let pos = [xy[0]+d[0],xy[1]+d[1]];isOnBoard(pos[0],pos[1])&&go;pos=[pos[0]+d[0],pos[1]+d[1]]) {
            const loc = map[pos.join('-')];
            const occupant = occupants[loc];
            if (!occupant) moves.push(loc);
            else {
                if (occupant[0]!==piece[0]) { // enemy piece
                    attacks.push(loc);
                    for (let cont = [pos[0]+d[0],pos[1]+d[1]];isOnBoard(cont[0],cont[1])&&go;cont=[cont[0]+d[0],cont[1]+d[1]]) {
                        const isKing = occupants[map[cont.join('-')]];
                        //console.log('isKing',isKing);
                        if (isKing) {
                            if (isKing[1]==='K') pinned.push([loc, piece.substring(1),d[0],d[1]]);
                            go = false;
                        }
                    }   
                } else { // friendly piece
                    go = false;
                }
}   }   }
    //console.log('    slide moves',moves,'    attacks',attacks,'    pinned',pinned);
    //console.log('    occupants:', occupants);
    return [moves, attacks, pinned];
}
function jump(piece,occupants,direction) { //console.log('jump',piece,occupants,direction);
    const moves = [];
    const attacks = [];
    // eslint-disable-next-line
    const [who, xy] = parsePiece(piece);
    for (const d of direction) { // console.log('d',d);
        let pos = [xy[0]+d[0],xy[1]+d[1]];
        const loc = map[pos.join('-')];
        if (isOnBoard(pos[0],pos[1])) {
            if (!occupants[loc]) moves.push(loc);
            else if (occupants[loc][0]!==piece[0]) attacks.push(loc);
    }   }
    // console.log('    jump moves attacks',moves,attacks);
    return [moves, attacks];
}
function rookMoves(piece,occupants) { return slide(piece,occupants,[[0,2],[0,-2],[1,1],[1,-1],[-1,1],[-1,-1]]); }
function bishopMoves(piece,occupants) { return slide(piece,occupants,[[1,3],[1,-3],[-1,3],[-1,-3],[2,0],[-2,0]]); }
function knightMoves(piece,occupants) { return jump(piece,occupants,[[1,5],[1,-5],[-1,5],[-1,-5],[3,1],[3,-1],[-3,1],[-3,-1],[2,4],[2,-4],[-2,4],[-2,-4]]); }
function archerMoves(piece,occupants) { return jump(piece,occupants,[[1,7],[1,-7],[-1,7],[-1,-7],[3,5],[3,-5],[-3,5],[-3,-5],[4,2],[4,-2],[-4,2],[-4,-2]]); }
function kingMoves(piece,occupants) { return jump(piece,occupants,[[0,2],[0,-2],[1,1],[1,-1],[-1,1],[-1,-1]]); }
function pawnAttack(piece, pos, attacks, occupants) {
    const loc = map[pos.join('-')];
    if (isOnBoard(pos[0],pos[1]) && (!occupants[loc] || (occupants[loc] && occupants[loc][0]!==piece[0]))) attacks.push(loc);
}
function getAttacks(match,piece,occupants){ // console.log('getAttacks',match, piece);
    const moves = [];
    const attacks = [];
    const [who, xy] = parsePiece(piece);
    let pos = [];
    let loc = '';
    switch(piece[1]) {
        case 'R': return rookMoves(piece,occupants);
        case 'N': return knightMoves(piece,occupants);
        case 'B': return bishopMoves(piece,occupants);
        case 'A': return archerMoves(piece,occupants);
        case 'K': return kingMoves(piece,occupants);
        case 'Q': 
            const [qm, qa, qp] = rookMoves(piece,occupants);
            const qmap = bishopMoves(piece,occupants);
            return [qm.concat(qmap[0]), qa.concat(qmap[1]), qp.concat(qmap[2])];
        case 'I': 
            const [im, ia] = knightMoves(piece,occupants);
            const imap = rookMoves(piece,occupants);
            return [im.concat(imap[0]), ia.concat(imap[1]), imap[2]];
        case 'E': 
            const [em, ea] = archerMoves(piece,occupants);
            const emap = bishopMoves(piece,occupants);
            return [em.concat(emap[0]), ea.concat(emap[1]), emap[2]];
        case 'P': // console.log('   switch pawn', xy, who,);
            pos = [xy[0],xy[1]+(who[0]?-2:2)]; loc = map[pos.join('-')];
            if (isOnBoard(pos[0],pos[1]) && !occupants[loc]) {
                moves.push(loc);
                pos = [xy[0],xy[1]+(who[0]?-4:4)]; loc = map[pos.join('-')];
                if (inStartPos(piece) && isOnBoard(pos[0],pos[1]) && !occupants[loc] && inStartPos) moves.push(loc);
            }
            pawnAttack(piece, [xy[0]+1,xy[1]+(who[0]?-1:1)], attacks, occupants);
            pawnAttack(piece, [xy[0]-1,xy[1]+(who[0]?-1:1)], attacks, occupants);
            return [moves, attacks];
        case 'S':
            pos = [xy[0],xy[1]+(who[0]?-2:2)]; loc = map[pos.join('-')];
            if (isOnBoard(pos[0],pos[1]) && !occupants[loc]) {
                moves.push(loc);
                pos = [xy[0],xy[1]+(who[0]?-4:4)]; loc = map[pos.join('-')];
                if (inStartPos(piece) && isOnBoard(pos[0],pos[1]) && !occupants[loc] && inStartPos) moves.push(loc);
            }
            pawnAttack(piece, [xy[0]+1,xy[1]+(who[0]?-3:3)], attacks, occupants);
            pawnAttack(piece, [xy[0]-1,xy[1]+(who[0]?-3:3)], attacks, occupants);
            return [moves, attacks];
        default: break;
    }
    return null;
}
function surrounded(match, board, king, isWhite) { // console.log('surrounded',board,king, isWhite);
    const [moves, attacks] = getAttacks(match, (isWhite?'wK':'bK')+king, board.occupants);
    // console.log('    moves', moves); console.log('    attacks', attacks);
    for (const m of moves) { // console.log(m, board.covered[m], !board.covered[m]||board.covered[m][isWhite?1:0].length===0?board.occupants[m]?'blocked':'escape':'no');
        if ((!board.covered[m] || board.covered[m][isWhite?1:0].length===0) && !board.occupants[m]) return false;
    }
    for (const att of attacks) if (!board.attacked[att] || board.attacked[att][isWhite?1:0].length===0) return false;
    return true;
}
function killAttacker(match, board, king, isWhite) { // console.log('killAttacker',board,king, isWhite);
    if (!board.attacked[board.attacked[king][isWhite?1:0][0].substring(1)]) return false;
    for (const attacker of board.attacked[board.attacked[king][isWhite?1:0][0].substring(1)][isWhite?0:1]) {
        if (!board.pinned.includes(attacker.substring(1))) return true;
    }
    return false;   
}
function analyse(match){ //console.log('analyse', match);
    const board = {};
    board.occupants = {};
    board.attacks = {}; // 'd41':['wR',['d31','d21','d11'...]]
    board.attacked = {}; // 'b23':[(white attack)['Qe11','Sb33'...],[black attacks]]
    board.covered = {}; // 'b23':[(white attack)['Qe11','Sb33'...],[black attacks]]
    board.moves = {};
    board.pinned = [];
    board.whiteInCheck = false;
    board.blackInCheck = false;
    board.mate = false;
    board.stale = false;
    if (match.white.pieces.length === 0 || match.black.pieces.length === 0) return board;

    for (const m of match.white.pieces) {
        const where = m.substring(1);
        board.occupants[where] = 'w'+m[0];
    }
    for (const m of match.black.pieces) {
        const where = m.substring(1);
        board.occupants[where] = 'b'+m[0];
    }
    for (const m of match.white.pieces) {
        const where = m.substring(1);
        const [moves, attacks, pinned] = getAttacks(match,'w'+m,board.occupants);
        board.attacks[where] = ['w'+m[0], attacks];
        board.moves[where] = ['w'+m[0], moves];
        if (pinned) board.pinned = board.pinned.concat(pinned);
        for (const att of attacks) {
            if (m[0] === 'P' || m[0] === 'S') {
                if (board.occupants[att]) addAttacked(att,m,0);
                else { addCovered(att,m,0);
                    board.attacks[where][1]=board.attacks[where][1].filter(a=>a!==att);
                }
            } else addAttacked(att,m,0);
        }
        for (const cov of moves) {
            if (m[0] !== 'P' && m[0] !== 'S') addCovered(cov,m,0);
        }
    }
    for (const m of match.black.pieces) {
        const where = m.substring(1);
        const [moves, attacks, pinned] = getAttacks(match,'b'+m,board.occupants);
        board.attacks[where] = ['b'+m[0], attacks];
        board.moves[where] = ['b'+m[0], moves];
        if (pinned) board.pinned = board.pinned.concat(pinned);
        for (const att of attacks) {
            if (m[0] === 'P' || m[0] === 'S') {
                if (board.occupants[att]) addAttacked(att,m,1);
                else { addCovered(att,m,1);
                    board.attacks[where][1]=attacks.filter(a=>a!==att);
                }
            } else addAttacked(att,m,1);
        }
        for (const cov of moves) {
            if (m[0] !== 'P' && m[0] !== 'S') addCovered(cov,m,1);
        }
    }
    if (get('wK',match).length>0) {
        const wKing = get('wK',match)[0].substring(1); 
        if (wKing.length>0 && board.attacked[wKing] && board.attacked[wKing][1].length>0) {
            board.whiteInCheck=true;
            // if (!surrounded(match, board, wKing, true)) return board;
            // console.log('board.attacked[wKing][1].length',board.attacked[wKing][1].length);
            // if (killAttacker(match, board, wKing, true)) return board;
            // board.mate = true;
        }
    }
    if (get('bK',match).length>0) {
        const bKing = get('bK',match)[0].substring(1); // console.log('black king is at',bKing);
        if (bKing.length>0 && board.attacked[bKing] && board.attacked[bKing][0].length>0) {
            board.blackInCheck=true;
            // if (!surrounded(match, board, bKing, false)) return board;
            // if (board.attacked[bKing][0].length===1){ // console.log('One attacker');
            //     if (killAttacker(match, board, bKing, false)) return board;
            // }
            board.mate = true;
        }
    }
    return board;
    function addAttacked(att, m, white) { // console.log('addAttacked',att, m, white);
        if (!board.attacked[att]) board.attacked[att]=[[],[]];
        board.attacked[att][white].push(m);
    }
    function addCovered(att, m,white) { // console.log('addCovered',att, m,white);
        if (!board.covered[att]) board.covered[att]=[[],[]];
        board.covered[att][white].push(m);
    }
}

function text(x,y,r,sz,w,fc,sc,ds,text, id) { // console.log('text',text);
    if (!text) return [];
    if (!id) id = ('t-'+text).replaceAll('.','').replaceAll(' ','').trim().toLowerCase();
    const words = text.trim().split(' ').filter(w=>w&&w!=='.'); 
    const fs = [];
    const nudge = [];
    for (const w of words) {
        const t = w.split(w.replaceAll('.',''));
        nudge.push((t[1].length-t[0].length)/3-2-w.length/50);
        fs.push(sz*20/(8+w.length));
    }
    return <g key={id} id={id} transform={'rotate('+r+','+x+','+y+')'} filter={'drop-shadow('+ds+')'} fill={fc}>
        { words.length === 1 && <text className='noMouse' x={x+nudge[0]} y={y+fs[0]/4} fontFamily="Verdana" fontSize={fs[0]} stroke={sc} strokeWidth={w}>{words[0].replaceAll('.','')}</text> }
        { words.length === 2 && <text className='noMouse' x={x+nudge[0]} y={y-fs[0]/5} fontFamily="Verdana" fontSize={fs[0]} stroke={sc} strokeWidth={w}>{words[0].replaceAll('.','')}</text> }
        { words.length === 2 && <text className='noMouse' x={x+nudge[1]} y={y+(fs[0]+fs[1])/3} fontFamily="Verdana" fontSize={fs[1]} stroke={sc} strokeWidth={w}>{words[1].replaceAll('.','')}</text> }
        { words.length >2 && <text className='noMouse' x={x+nudge[0]} y={y-(fs[1]+fs[2])/5} fontFamily="Verdana" fontSize={fs[0]} stroke={sc} strokeWidth={w}>{words[0].replaceAll('.','')}</text> }
        { words.length >2 && <text className='noMouse' x={x+nudge[1]} y={y+fs[2]/3} fontFamily="Verdana" fontSize={fs[1]} stroke={sc} strokeWidth={w}>{words[1].replaceAll('.','')}</text> }
        { words.length >2 && <text className='noMouse' x={x+nudge[2]} y={y+2*(fs[1]+fs[2])/3} fontFamily="Verdana" fontSize={fs[2]} stroke={sc} strokeWidth={w}>{words[2].replaceAll('.','')}</text> }
    </g>
}
function hilite(idList, what, to, flip) { //console.log('hilite',idList, what, to);
    for (const id of idList) {
        if (id) {
            let ele = document.getElementById(flip?flipped(id.replace(/[ABEIKNPQRS]/, '')):id.replace(/[ABEIKNPQRS]/, ''));
            if (ele) ele.setAttribute(what, to);
    }   }
}
       
export {hex, whiteMove, inStartPos, inPromotePos, map, revMap, flipped, hilite, getPiece, swapPieces, movePiece, clear, off, analyse,isOnBoard, text, serverUrl, socketUrl}
