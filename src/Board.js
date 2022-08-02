// import { logDOM } from '@testing-library/react';
import React from 'react';
import Hex from "./Hex"
// import $ from 'jquery';
import {display, map, revMap, flipped, inPromotePos, getPiece} from './res';

import {hex, genDefs, whiteMove, hilite, movePiece, swapPieces, analyse,isOnBoard, clear, text} from './res';
import { blitzMenu, waybackMenu, aiMenu, promMenu, editMenu, userMenu, matchMenu, items, puzzles, tutorials, help, mainMenu, leave, hover, highlight} from './menu'
//let move = '';
//let editor = '';
//let promote = [];

function Board({color, user, match, update, view, menu, command, flip, mode, history, queue, cpu}) { //console.log('<Board>   menu['+menu+']    mode['+mode+']');
    //console.log('match', match);
    const board = analyse(match);  // console.log('board', board);
    let formation = [];
    let muster = [];
    let march = '';
    let switchArms = [];
    let special = false;
    let left = 0;
    let right = 0;
    const grads = ["url(#grad1)", "url(#grad2)", "url(#grad3)"]

    // const chxPieces = Array.from(document.querySelectorAll('.chx-piece'));
    // chxPieces.forEach(p => { p.remove(); });

    function rose() {
        const points = [];
        for (let i=30;i<360;i+=60) {
          points.push(<path key={'left-'+i} transform={'rotate('+i+')'} className='noMouse' fill='#990' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 1.7 L 0.3 0.5 Z"></path>);
          points.push(<path key={'right-'+i}  transform={'rotate('+i+')'} className='noMouse' fill='#550' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 1.7 L -0.3 0.5 Z"></path>);
        }
        for (let i=0;i<360;i+=60) {
          points.push(<path key={'smLeft-'+i}  transform={'rotate('+i+')'} className='noMouse' fill='#990' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 2 L 0.3 0.5 Z"></path>);
          points.push(<path key={'smRight-'+i}  transform={'rotate('+i+')'} className='noMouse' fill='#550' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 2 L -0.3 0.5 Z"></path>);
        }
        return points;
    }
    function clocks() {
        const x=9;
        const y=9;
        const sc=4;
        const clocks = [];

        clocks.push(<path key="theirClock" id="theirClock" transform={'translate('+x+','+y+') rotate(-14,0,0) scale('+sc+')'} fill="#a53" stroke='#111' strokeWidth={0.1} d={hex}></path>);
        clocks.push(<circle key="theirClockFace" id="theirClockFace" transform={'translate('+x+','+y+') scale('+sc+')'} fill="#bbb" stroke='#111' strokeWidth={0.1} cx={0} cy={0} r={1.6}></circle>);

        clocks.push(<path key="myClock" id="myClock" transform={'translate('+x+','+(100-y)+') rotate(14,0,0) scale('+sc+')'} fill="#a53" stroke='#111' strokeWidth={0.1} d={hex}></path>);
        clocks.push(<circle key="myClockFace" id="myClockFace" transform={'translate('+x+','+(100-y)+') scale('+sc+')'} fill="#bbb" stroke='#111' strokeWidth={0.1} cx={0} cy={0} r={1.6}></circle>);

        clocks.push(    
            <g key='myHands' transform={'translate('+x+','+(100-y)+') scale('+sc/2+')'} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                <path id='myMoveHand' transform={'rotate(180,0,0)'} className='noMouse' fill='#440' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.3 1 L 0 3 L -0.3 1 Z"></path>
                <path id='myGameHand' transform={'rotate(0,0,0)'} className='noMouse' fill='#a00' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.5 1 L 0.1 2 L -0.1 2 L -0.5 1 Z"></path>
                <circle fill="#000" cx="0" cy="0" r="0.5"/>
            </g>);
        clocks.push(    
            <g key='theirHands' transform={'translate('+x+','+y+') scale('+sc/2+')'} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                <path id='theirMoveHand' transform={'rotate(180,0,0)'} className='noMouse' fill='#220' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.3 1 L 0 3 L -0.3 1 Z"></path>
                <path id='theirGameHand' transform={'rotate(0,0,0)'} className='noMouse' fill='#a00' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.5 1 L 0.1 2 L -0.1 2 L -0.5 1 Z"></path>
                <circle fill="#000" cx="0" cy="0" r="0.5"/>
            </g>);
        return clocks;
    }
    function users() { //console.log('users',user, match);
        const ui = [];
        const x=(mode === 'blitz'?20:9);
        const y=(mode === 'blitz'?95:91);
        const sc=(mode === 'blitz'?2:4);
        ui.push(<path key="user" id="user" transform={'translate('+x+','+y+') rotate(12,0,0) scale('+sc+')'} fill="#359" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'users'})} d={hex}></path>);
        ui.push(text(x,y,0,2*sc/3,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px',user.userid)); // x,y,r,sz,w,fc,sc,ds,text
        if (match.white.player && match.white.player.ID !== 0 && match.white.player.ID !== user.ID) {
            ui.push(<path key="opponent" id="opponent" transform={'translate('+x+','+(100-y)+') rotate(-2,0,0) scale('+2+')'} fill="#953" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'opponent', id:match.white.player.ID})} d={hex}></path>);
            ui.push(text(x,(100-y),0,2*sc/3,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px',match.white.player.userid)); // x,y,r,sz,w,fc,sc,ds,text       
        }
        if (match.black.player && match.black.player.ID !== 0 && match.black.player.ID !== user.ID) {
            ui.push(<path key="opponent" id="opponent" transform={'translate('+x+','+(100-y)+') rotate(-12,0,0) scale('+sc+')'} fill="#953" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'opponent', id:match.black.player.ID})} d={hex}></path>);
            ui.push(text(x,(100-y),0,2*sc/3,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px',match.black.player.userid)); // x,y,r,sz,w,fc,sc,ds,text
        }
        return ui;
    }
    function resign() { //console.log('resign');
        const ui = [];
        let x=95;        let y=80;
        ui.push(<path key="resign" id="resign" transform={'translate('+x+','+y+') rotate(-27,0,0) scale('+2+')'} fill="#f93" stroke='#333' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'resign', id:match.ID}); }} d={hex}></path>);
        ui.push(text(x, y, 0, 1.3, 0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px','resign')); // x,y,r,sz,w,fc,sc,ds,text
        y=95; x=80;
        ui.push(<path key="draw" id="draw" transform={'translate('+x+','+y+') rotate(0,0,0) scale('+2+')'} fill="#333" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'offerDraw', id:match.ID}); }} d={hex}></path>);
        ui.push(text(x,y,0, 1.4, 0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px','Offer Draw')); // x,y,r,sz,w,fc,sc,ds,text
   
        return ui;
    }
    function commit() { //console.log('commit');
        const ui = [];
        let x=5;        let y=80;
        ui.push(<path key="commit" id="commit" transform={'translate('+x+','+y+') rotate(27,0,0) scale('+2+')'} fill="#ff5" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'commit', move:match.move}); match.move=''; }} d={hex}></path>);
        ui.push(text(x,y,0,1.3,0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px',match.move.replace('~','~ ').replace('x','x '))); // x,y,r,sz,w,fc,sc,ds,text
        y=20;
        ui.push(<path key="retry" id="retry" transform={'translate('+x+','+y+') rotate(27,0,0) scale('+2+')'} fill="#ff5" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'loadMatch', id:match.ID}); }} d={hex}></path>);
        ui.push(text(x,y,0, 1.3,0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px','retry')); // x,y,r,sz,w,fc,sc,ds,text
   
        return ui;
    }
    function offline() { //console.log('offline',user);
        const ui = [];
        let x=80;
        let y=95;
        ui.push(<path key="editMatch" id="edit" transform={'translate('+x+','+y+') rotate(-2,0,0) scale('+2+')'} fill="#aa0" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:(menu==='edit'?'':'edit')})} d={hex}></path>);
        ui.push(text(x,y,-28,1.3,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px',menu==='edit'?'play':'edit')); // x,y,r,sz,w,fc,sc,ds,text
        // if (!user || !user.ID || user.ID<1 || !user.property.vet) {
        //     y=5;
        //     ui.push(<path key="quickTour" id="tour" transform={'translate('+x+','+y+') rotate(2,0,0) scale('+2+')'} fill="#aaf" stroke='#111' strokeWidth={0.2} onMouseOver={hover} onMouseLeave={(e)=>leave('#111',e)} onClick={()=>command({order:'menu', choice:'tour'})} d={hex}></path>);
        //     ui.push(text(x,y,28,2,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px','.tour')); // x,y,r,sz,w,fc,sc,ds,text
        // }
        x=9;
        y=9;
        ui.push(<g transform={'translate('+x+','+y+') scale(4)'} ><path key="cpu" id="cpu" transform={'rotate(27,0,0)'} fill="#8af" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'menu', choice:'cpu'}); match.move=''; }} d={hex}><animateTransform id='think' attributeName="transform" attributeType="XML" type="rotate" from="27 0 0" to="387 0 0" dur='1s' repeatCount='indefinite'/></path></g>);
        ui.push(text(x,y,0,2,0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px',cpu)); // x,y,r,sz,w,fc,sc,ds,text
        return ui;
    }
    function tiles() {
        const hex = [];    
        for (let i = 0; i<13; i++) {
            for (let j = 0; j<25; j+=2) {
                if (isOnBoard(i,j)) hex.push(<Hex key={'hex-'+i+'-'+(j + i%2)} x={i} y={j} color={grads} action={hexClicked}/>);
            }
        }
        return hex;
    }
    function selectPiece(moves, attacks, attacked, covered, occupants, pins, here) { // console.log('selectPiece(',moves, attacks, attacked, covered, occupants, pins, here,')');
        if (pins.filter(p=>p[0]===here).length>0) {
            const skewerer = pins.filter(p=>p[0]===here);
            // console.log('piece pinned by',skewerer[0][1].substring(1));
            if (skewerer.length>1) return; // multiple skewers? return.
            // console.log('attacks by pinned piece include attacker?', attacks);
            if (attacks[1].includes(skewerer[0][1].substring(1))) { // can pinned piece capture attacker ?
                match.first = here;
                hilite([skewerer[0][1]],'stroke', moves[0][0]==='w'?'#f25':'#f52', flip);
            }
            moves[0] = [];
            return;
        }
        if (moves) {
            hilite(moves[1],'stroke', moves[0][0]==='w'?'#8f2':'#2f8', flip);
            match.first = here;
        } else {
            if (attacked) { // this must be a blank space
                hilite(attacked[0],'stroke', '#f2a', flip);
                hilite(attacked[1],'stroke', '#fa2', flip);
            }
            if (covered) { // this must be a blank space
                hilite(covered[0],'stroke', '#a27', flip);
                hilite(covered[1],'stroke', '#a72', flip);
            }
        }
        if (attacks) {
            const me = occupants[here];
            if (me[1] === 'P' || me[1] === 'S') {
                hilite(attacks[1].filter(a=>occupants[a]),'stroke', moves[0][0]==='w'?'#f25':'#f85', flip);
            } else hilite(attacks[1],'stroke', moves[0][0]==='w'?'#f25':'#f85', flip);
            match.first = here;
        }
    }
    function specialMoves(pos) { // console.log('specialMoves', pos); // console.trace();
        if (!board.occupants[pos]) return [false, false];
        const p = board.occupants[pos];
        const [dir,coord] = [p[0]==='w'?-1:1, revMap[pos].split('-')];
        const [x, y] = [parseInt(coord[0]),parseInt(coord[1])];
        const [fm, flf, frf, lda, rda] = [map[''+x+'-'+(y+dir*2)], map[''+(x-1)+'-'+(y+dir)], map[''+(x+1)+'-'+(y+dir)], map[''+(x-1)+'-'+(y+dir*3)], map[''+(x+1)+'-'+(y+dir*3)]];
        const [occ, att, cov] = [board.occupants, board.attacked, board.covered];
        return [!((att[pos] && att[pos][(1-dir)/2].length>0) || (cov[fm] && cov[fm][(1-dir)/2].length>0) || occ[fm]), 
        !((occ[flf] && occ[flf][0]!==p[0]) || (occ[frf] && occ[frf][0]!==p[0]) || (occ[lda] && occ[lda][0]!==p[0]) || (occ[rda] && occ[rda][0]!==p[0]) || occ[fm])];
    }
    function getChain(pos, left, right) { // console.log('getChain',pos, left, right, board);
        const muster=['',''];
        const switchArms=['',''];
        const dir = whiteMove(match)?-1:1;
        const coord = revMap[pos].split('-');
        const [x, y] = [parseInt(coord[0]),parseInt(coord[1])];
        if (left) {
            const lPawn = map[''+(x-1)+'-'+(y-dir)];
            const lSpear = map[''+(x-1)+'-'+(y-dir*3)];
            let p = board.occupants[lPawn];
            if (p && p[1]==='P' && p[0]===(dir===1?'b':'w')) { // console.log('left pawn');
                const [canMarch, canSwArm] = specialMoves(lPawn);
                if (canMarch) muster[0]=lPawn;
                if (canSwArm) switchArms[0]=lPawn;
            }
            let s = board.occupants[lSpear];
            if (s && s[1]==='S' && s[0]===(dir===1?'b':'w')) { // console.log('left spearman');
                const [canMarch, canSwArm] = specialMoves(lSpear);
                if (canMarch) muster[0]=lSpear;
                if (canSwArm) switchArms[0]=lSpear;
            }
        }
        if (right) {
            const rPawn = map[''+(x+1)+'-'+(y-dir)];
            const rSpear = map[''+(x+1)+'-'+(y-dir*3)];
            let p = board.occupants[rPawn];
            if (p && p[1]==='P' && p[0]===(dir===1?'b':'w')) { // console.log('right pawn');
                const [canMarch, canSwArm] = specialMoves(rPawn);
                if (canMarch) muster[1]=rPawn;
                if (canSwArm) switchArms[1]=rPawn;
            }
            let s = board.occupants[rSpear];
            if (s && s[1]==='S' && s[0]===(dir===1?'b':'w')) { // console.log('right spearman');
                const [canMarch, canSwArm] = specialMoves(rSpear);
                if (canMarch) muster[1]=rSpear;
                if (canSwArm) switchArms[1]=rSpear;
            }
        } // console.log('muster,switchArms',muster,switchArms);
        return [muster,switchArms];
    }
    function clean(match) {
        special = false;
        match.first = '';
        muster = [];
        switchArms = [];
        left = 0;
        right = 0;
    }
    function hexClicked(here) { //console.log('hexClicked  first:', match.first, '  here',here);
        if (history>-1) return;
        if (flip) here = flipped(here);
        if (menu==='tutor') {
            command({order:'guess', here: here});
            return;
        } else if (menu==='edit') { // console.log('edit mode', match.editor);
            clear();
            hilite([here],"stroke","#aaf", flip);
            if (match.editor && match.editor !== here) { console.log('meta command',match.editor, here);
                let copyMatch = {...match};
                copyMatch.log = [];
                switch(match.editor) {
                    case 'w-king': copyMatch.white.pieces.push('K'+here); break;
                    case 'w-queen': copyMatch.white.pieces.push('Q'+here); break;
                    case 'w-prince': copyMatch.white.pieces.push('I'+here); break;
                    case 'w-princess': copyMatch.white.pieces.push('E'+here); break;
                    case 'w-rook': copyMatch.white.pieces.push('R'+here); break;
                    case 'w-archer': copyMatch.white.pieces.push('A'+here); break;
                    case 'w-bishop': copyMatch.white.pieces.push('B'+here); break;
                    case 'w-knight': copyMatch.white.pieces.push('N'+here); break;
                    case 'w-pawn': copyMatch.white.pieces.push('P'+here); break;
                    case 'w-spear': copyMatch.white.pieces.push('S'+here); break;
                    case 'b-king': copyMatch.black.pieces.push('K'+here); break;
                    case 'b-queen': copyMatch.black.pieces.push('Q'+here); break;
                    case 'b-prince': copyMatch.black.pieces.push('I'+here); break;
                    case 'b-princess': copyMatch.black.pieces.push('E'+here); break;
                    case 'b-rook': copyMatch.black.pieces.push('R'+here); break;
                    case 'b-archer': copyMatch.black.pieces.push('A'+here); break;
                    case 'b-bishop': copyMatch.black.pieces.push('B'+here); break;
                    case 'b-knight': copyMatch.black.pieces.push('N'+here); break;
                    case 'b-pawn': copyMatch.black.pieces.push('P'+here); break;
                    case 'b-spear': copyMatch.black.pieces.push('S'+here); break;
                    case 'XXXXX':
                        copyMatch.white.pieces = match.white.pieces.filter(f => f.substring(1)!==here);
                        copyMatch.black.pieces = match.black.pieces.filter(f => f.substring(1)!==here);
                        break;
                    default: // console.log('switch pieces');
                        if (swapPieces(copyMatch, match.editor, here)) {
                            copyMatch.editor = '';
                            clear();
                        } else {
                            copyMatch.editor = here;
                        }
                    break;
                }
                clean(copyMatch);
                update(copyMatch);
            } else {
                match.editor = here;
            }
            return
        }
        clear();
        hilite([here],"stroke","#00f", flip);
        const attacks = board.attacks[here];
        const attacked = board.attacked[here];
        attacked && hilite(attacked[0], "stroke",'#f00', flip);
        attacked && hilite(attacked[1], "stroke",'#f00', flip);
        const covered = board.covered[here];
        const moves = board.moves[here];
        const myGuy = moves?((moves[0][0]==='w')===whiteMove(match)):false;
        // console.log('validPiece',moves); console.log('myGuy',myGuy);
        if (special) {
            if (here===march) { //console.log('march');
                const copyMatch = {...match};
                copyMatch.promotions = [];
                for (const ps of formation) {
                    const [dir,coord] = [whiteMove(match)?-1:1, revMap[ps].split('-')];
                    const [x, y] = [parseInt(coord[0]),parseInt(coord[1])];
                    const fm = map[''+x+'-'+(y+dir*2)];
                    // console.log(march,'to',fm);
                    if (whiteMove(match)) {
                        for (const idx in match.white.pieces)
                            if (match.white.pieces[idx].substring(1)===ps) {
                                if (inPromotePos(fm, true)) copyMatch.promotions.push(fm);
                                copyMatch.white.pieces[idx]=match.white.pieces[idx][0]+fm;
                            }
                    } else {
                        for (const idx in match.black.pieces)
                            if (match.black.pieces[idx].substring(1)===ps) {                                
                                if (inPromotePos(fm, false)) copyMatch.promotions.push(fm);
                                copyMatch.black.pieces[idx]=match.black.pieces[idx][0]+fm;
                            }
                    }
                }
                // order promotions from left to right.
                const sorter = (x)=>parseInt(x.replace('f','2').replace('a','3').replace('b','4').replace('c','2').replace('d','3').replace('e','4'))*(x.length===2?10:1);
                if (whiteMove(match)) copyMatch.promotions = copyMatch.promotions.sort((a,b)=> sorter(a)-sorter(b));
                else copyMatch.promotions = copyMatch.promotions.sort((a,b)=> sorter(b)-sorter(a));
                if (whiteMove(match)) copyMatch.move = '^^^^^^^^^'.substring(0,left)+match.first+'^^^^^^^^'.substring(0,right)
                else copyMatch.move = 'vvvvvvvvv'.substring(0,left)+match.first+'vvvvvvvvv'.substring(0,right)
                copyMatch.log.push(copyMatch.move);
                clean(copyMatch);
                update(copyMatch);
                if (mode==='blitz') command({order:'blitz-move', move:copyMatch.move});
                // if ((match.white.pieces[idx][0]==='P' || match.white.pieces[idx][0]==='S') && inPromotePos(fm, true)) {
                //     match.promote = [ps, fm]; // [match.first, here];
                //     match.first = ps;
                //     console.log('ps:',ps,'    fs:',fm); 
                //     command({order:'menu', choice:'promote'})
                // }
                // console.log('inPromotePos(piece, white)',inPromotePos(fm, true));





            } else if (here===formation[0]) { // console.log('switch arms');
                const copyMatch = {...match};
                for (const ps of formation) {
                    console.log('switch for',ps);
                    if (whiteMove(match)) {
                        for (const idx in match.white.pieces)
                            if (match.white.pieces[idx].substring(1)===ps) // { console.log('ps',ps);
                                copyMatch.white.pieces[idx]=(match.white.pieces[idx][0]==='P'?'S':'P')+ps;
                    } else {
                        for (const idx in match.black.pieces)
                            if (match.black.pieces[idx].substring(1)===ps) 
                                copyMatch.black.pieces[idx]=(match.black.pieces[idx][0]==='P'?'S':'P')+ps;
                    }
                }
                copyMatch.move ='#########'.substring(0,left)+here+'#########'.substring(0,right);
                copyMatch.log.push(copyMatch.move);
                clean(copyMatch);
                update(copyMatch);
                if (mode==='blitz') command({order:'blitz-move', move:copyMatch.move});
            } else { //console.log('add soldier    march:', march, '    muster:', muster, '   sa:', switchArms);
                if (!board.occupants[here]) {
                    clean(match);
                } else {
                    const [m,sa] = getChain(here, true, true); //console.log(m,sa);
                    //const [canMarch, swArms] = specialMoves(here); 
                    //console.log('   canMarch',canMarch, 'swArms',swArms,'   ...muster',muster,'   switchArms', switchArms);
                    if (muster.length>0) { // console.log('call to muster');
                        if (here===muster[0]) { // console.log('add left flank, muster');
                            formation.push(here);
                            muster[0]=m[0];
                        } else if (here===muster[1]) { // console.log('add right flank, muster');
                            formation.push(here);
                            muster[1]=m[1];
                        } else { muster = []; march=''; } // add soldier who couldn't march
                    }
                    if (switchArms.length>0) { // console.log('ready arms');
                        if (here===switchArms[0]) { console.log('add left flank, switch');
                                if (!formation.includes(here)) formation.push(here);
                                switchArms[0]=sa[0];   
                                left++;
                        } else if (here===switchArms[1]) { // console.log('add right flank, switch');
                            if (!formation.includes(here)) formation.push(here);
                            switchArms[1]=sa[1];   
                            right++;
                        } else switchArms = []; // add soldier who couldn't switch
                    } 
                    if (switchArms.length===0 && muster.length===0)  {
                        clean(match);
                    }
                    // console.log('muster', muster); console.log('switchArms', switchArms); console.log('formation',formation);
                    hilite(muster,'stroke', '#0ff', flip);
                    hilite(switchArms,'stroke', '#a0a');
                    hilite(switchArms.filter(sa=>muster.includes(sa)),'stroke', '#afa', flip);
                    hilite(formation,'stroke', '#ff4', flip);
                    hilite([formation[0]],'stroke', '#f8f', flip);
                    hilite([march],'stroke', '#9f9', flip);
                }
            }
        } else { // not special
            if (!match.first || match.first === '') { //console.log('first selection'); // no piece was selected
                selectPiece(moves, attacks, attacked, covered, board.occupants, board.pinned, here);
                // console.log('moves',moves); console.log('attacks',attacks); console.log('attacked, covered',attacked, covered);
            } else { // console.log('second selection');  // piece had already been chosen...
                const me = board.occupants[here];
                if (match.first === here && me[0]===(whiteMove(match)?'w':'b') && (me[1]==='P' || me[1]==='S')) { 
                    // console.log('init special moves');  // select piece again.... special moves
                    const [canMarch, swArms] = specialMoves(here);
                    const [m,sa] = getChain(here, true, true); //console.log('muster, switchArms',muster, switchArms)
                    formation = [here]
                    if (canMarch) muster=m; else muster=[];
                    if (swArms) switchArms=sa; else switchArms=[];
                    hilite(switchArms,'stroke', '#f0f', flip);
                    hilite(muster,'stroke', '#0ff', flip);
                    hilite(switchArms.filter(sa=>muster.includes(sa)),'stroke', '#afa', flip);
                    hilite(formation,'stroke', '#ff4', flip)
                    special = true;
                    const [dir,coord] = [board.occupants[here][0]==='w'?-1:1, revMap[here].split('-')];
                    const [x, y] = [parseInt(coord[0]),parseInt(coord[1])];
                    march = muster.length>0?map[''+x+'-'+(y+dir*2)]:'';
                } else if (myGuy || (board.moves[match.first][0][0]==='w' && !whiteMove(match)) || (board.moves[match.first][0][0]==='b' && whiteMove(match))) { // is the first selection not mine
                    // console.log('this is either another of my guys or the first selection was the enemy.');
                    match.first = '';
                    selectPiece(moves, attacks, attacked, covered, board.occupants, board.pinned, here);
                } else if (board.moves[match.first][1].includes(here) || board.attacks[match.first][1].includes(here)) { // console.log('valid move');
                    const me = getPiece(match, match.first);
                    //console.log('me', me, 'here', here);
                    //if (me && (me[1]==='P' || me[1]==='S') && inPromotePos(here)) {

                    let copyMatch = {...match};
                    if (me && (me[0][0]==='P' || me[0][0]==='S') && inPromotePos(here, whiteMove(match))) {
                        //command({order:'menu', choice:'promote', pos:[match.first, here]})
                        copyMatch.promotions = [here];
                    }
                    const store = JSON.stringify(match);
                    movePiece(copyMatch, board, [match.first, here]);
                    const look = analyse(copyMatch);
                    if ((!look.whiteInCheck && !look.blackInCheck)
                        || ((!look.whiteInCheck || whiteMove(copyMatch)) && (!look.blackInCheck || !whiteMove(copyMatch)))) {
                            if (!copyMatch.move) copyMatch.move = copyMatch.log[copyMatch.log.length-1];
                            clean(copyMatch);
                            update(copyMatch);
                            if (mode==='blitz') command({order:'blitz-move', move:copyMatch.move});
                    } else match = JSON.parse(store);
                } else { // console.log('invalid move');
                    match.first = '';
                    selectPiece(moves, attacks, attacked, covered, board.occupants, board.pinned, here);
                    // console.log('destination',board.moves[first],board.attacks[first]);
                }

            } // console.log('check',board.check);
        } // else not special moves
    }
    function ledger(match) { // console.log('ledger', history);
        if (!match) return [];
        const ledge = history>-1?31:63;
        const notes = [];
        let start = 0;
        let end = history>-1?history+1:match.log.length;
        //const delta = history>0?match.log.length-history:0;
        if (end>ledge) {
            start = end - ledge;
        }
        
        let fade = 0;
        if (start>10) fade = start-10;


        if (history>-1) { // future events
            for (let l=end;l<end+25;l++) {
                if (l<match.log.length) {
                    let t = "rotate("+(-l+end-1)*5+", 50, 50)";
                    let f ='#444';
                    let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
                    const lge = match.log[l].split('::')[0];
                    notes.push(
                        <g key={'log-'+l} transform={t} onMouseOver={(e) => highlight(e, lge,true, flip)} onMouseLeave={(e) => highlight(e, lge,false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                            <rect id={'rect-'+lge} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                            {text(8,17.6,0,-3.3,0,l%2===0?'#fff':'#000','#888',(notes.length%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',lge)}
                        </g>);
                }
            }
            for (let l=end+25;l<end+32;l++) { // fade out future
                if (l<match.log.length) {
                    let t = "rotate("+(-l+end-1)*5+", 50, 50)";
                    let f ='#444';
                    let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
                    const lge = match.log[l].split('::')[0];
                    notes.push(
                        <g key={'log-'+l} transform={t} opacity={(7-l+end+25)/7} onMouseOver={(e) => highlight(e, lge,true, flip)} onMouseLeave={(e) => highlight(e, lge,false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                            <rect id={'rect-'+lge} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                            {text(8,17.6,0,-3.3,0,l%2===0?'#fff':'#000','#888',(l%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',lge)}
                        </g>);
                }
            }
            
        }
        for (let l=start;l<end;l++) {
            let t = "rotate("+(-l+end-1)*5+", 50, 50)";
            let f = l===end-1?"#99f":match.log[l].indexOf('x')>0?"#a55":"#363";
            let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
            const lge = match.log[l].split('::')[0];
            notes.push(
                <g key={'log-'+l} transform={t} onMouseOver={(e) => highlight(e, lge,true, flip)} onMouseLeave={(e) => highlight(e, lge,false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                    <rect id={'rect-'+lge} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                    {text(8,17.6,0,-3.3,0,l%2===0?'#fff':'#000','#888',(l%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px', lge)}
                </g>); // .split('=')[0]
        }
        if (start>0) {
            for (let l=fade;l<start;l++) { // fade out past
                let t = "rotate("+(-l+end-1)*5+", 50, 50)";
                let f = match.log[l].indexOf('x')>0?"#a55":"#363";
                let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
                notes.push(
                    <g key={'log-'+l} transform={t} opacity={(10+l-start)/10} onMouseOver={(e) => highlight(e, match.log[l],true, flip)} onMouseLeave={(e) => highlight(e, match.log[l],false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                        <rect id={'rect-'+match.log[l].split('::')[0]} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                        {text(8,17.6,0,-3.3,0,l%2===0?'#fff':'#000','#888',(l%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',match.log[l].split('::')[0])}
                    </g>);
            }
        }
        return notes;
    }
    function showMessages() { //console.log('showMessages', queue);
        const messageQueue = [];
        let rgx = new RegExp(/(\p{L}{1})\p{L}+/, 'gu');
        let idx = 72;
        for (const m of queue.message) {
            let initials = [...m.from.matchAll(rgx)] || [];
            initials = ((initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')).toUpperCase();
            messageQueue.push(<g key={'msg-'+idx} transform={'rotate('+idx*2+',0,0)'}>
                <path id={'msg-'+idx} transform={'translate(52,0) scale(1.5)'} fill="#ccc" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> command({order:'read', id:m.ID}) } d={hex}></path>
                {text(52,0,-idx*2,1.1,0,'#000','#ff8','#f80 0.2px 0.2px 0.5px',initials,'txt-'+idx)}
                </g>);
            idx += 8/queue.message.length;
        }
        idx = 102;
        for (const fr of queue.friendRequest) {
            let initials = [...fr.from.matchAll(rgx)] || [];
            initials = ((initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')).toUpperCase();
            messageQueue.push(<g key={'fr-'+idx} transform={'rotate('+idx*2+',0,0)'}>
                <path id={'fr-'+idx} transform={'translate(53,0) scale(1.8)'} fill="#a4e" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> command({order:'befriend', id:fr.ID}) } d={hex}></path>
                {text(53,0,-idx*2,1,0,'#000','#ff8','#f80 0.2px 0.2px 0.5px',initials,'fr-txt-'+idx)}
                </g>);
            idx += 8/queue.friendRequest.length;
        }
        idx = 344;
        for (const f of queue.friend) { console.log('friend', f);
            let initials = [...f.name.matchAll(rgx)] || [];
            initials = ((initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')).toUpperCase();
            messageQueue.push(<g key={'friend-'+idx} transform={'rotate('+idx*2+',0,0)'}>
                <path id={'friend-'+f.userid} transform={'translate(53,0) scale(1.8)'} fill={f.colors.split('|')[f.online?f.incoming?2:0:1]} stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> command({order:'buddy', id:f.ID}) } d={hex}></path>
                {text(52.5,0,-idx*2,1.2,0,'#000','#ff8','#f80 0.2px 0.2px 0.5px',initials,'f-txt-'+idx)}
                </g>);
            idx += 8/queue.friend.length;
        }
        return messageQueue;
    }
    React.useEffect(() => { // console.log('menu',menu);
        [...document.getElementsByClassName('spin')].forEach(e=>e.beginElement())
        hilite(['ledgerList'],'opacity',menu===''||menu==='wayback'?'0.9':'0.2');

        // const ledge = document.getElementById('ledgerList');
        // if (ledge) ledge.setAttribute('opacity',menu?'0.1':'0.2');

    }, [match, menu])

    return (
      <div className="App">
        <svg id='board' viewBox={view} xmlns="http://www.w3.org/2000/svg">
            <defs> { genDefs(color) }
            </defs>
            <rect fill="#343" x="0" y="0" width="100" height="200"/>    
            <g transform={'translate(91, 8)'}> { help(command) } </g>   
            <g transform={'translate(91, 91)'}> { mainMenu(command, menu) } </g>
            { <g transform={'translate(50, 50)'}> { showMessages() } </g> }
            <circle fill="#000" cx="50" cy="50" r="50"/>            
            { match && display([[match.name, 45, 273, '#440', 6], [match.name, 45, 333, '#440', 6], [match.name, 45, 33, '#440', 6], [match.name, 45, 93, '#440', 6],[match.name, 45, 153, '#440', 6],[match.name, 45, 213, '#440', 6]]) }
            { mode === 'blitz' && clocks() }
            { user.userid && users() }
            { (mode === 'match' || mode === 'blitz') && resign() }
            { mode === 'match' && match.move && commit() }
            { mode === '' && offline() }
            <g id='ledgerList' opacity={0.5}>{ledger(match)}</g>
            { menu==='puzzles' && <g transform={'translate(50, 50)'}> { puzzles(match, command, update) } </g>}
            { menu==='tutor' && <g transform={'translate(50, 50)'}> { tutorials(match, command, update) } </g>}
            { menu==='main' && <g transform={'translate(50, 50)'}> { items(match, command, update, user) } </g>}
            { menu==='match' && <g transform={'translate(50, 50)'}> { matchMenu(match, command, update, user) } </g>}
            { menu==='users' && <g transform={'translate(50, 50)'}> { userMenu(match, command, update) } </g>}
            { menu==='edit' && <g transform={'translate(50, 50)'}> { editMenu(match, command, update) } </g>}
            { menu==='cpu' && <g transform={'translate(50, 50)'}> { aiMenu(match, command, update) } </g>}
            { menu==='blitz' && <g transform={'translate(50, 50)'}> { blitzMenu(match, command, update, user) } </g>}
            { match.promotions && match.promotions.length>0 && <g transform={'translate(50, 50)'}> { promMenu(match, command, update, flip) } </g>}
            { menu==='wayback' && <g transform={'translate(50, 50)'}> { waybackMenu(match, command, update) } </g>}
            <circle fill={board.whiteInCheck||board.blackInCheck?'#F33':'#321'} cx="50" cy="50" r="43"/>
            <circle fill="url(#feltPattern1)" cx="50" cy="50" r="42"/>
            <circle fill="url(#feltPattern2)" cx="50" cy="50" r="42" opacity={0.5}/>
            <circle fill="url(#feltPattern3)" cx="50" cy="50" r="42" opacity={0.25}/>
            <circle fill="url(#feltPattern4)" cx="50" cy="50" r="42" opacity={0.125}/>
            { tiles() }
            <g transform={"translate(50,50) scale(1.5)"} style={{ filter: 'drop-shadow(rgba(210, 128, 210, 0.4) 0px 0px 2px)'}}>
                { rose() }
            </g> 
            { match.checkmate && display([["Checkmate!", 45, 270, '#f40', 9],["Checkmate!", -50, 270, '#f40', 9]]) }
            { match.stalemate && display([["Stalemate.", 45, 270, '#f40', 9],["Stalemate.", -50, 270, '#f40', 9]]) }
            { match.draw && display([["Draw.", 45, 260, '#8aa', 9],["Draw.", -50, 280, '#8aa', 9]]) }    
            { match && !flip && display([['A', 38, 300, '#cc0', 8],['B', 38, 0, '#cc0', 8],['C', 38, 60, '#cc0', 8],['D', 38, 120, '#cc0', 8],['E', 38, 180, '#cc0', 8],['F', 38, 240, '#cc0', 8]]) }       
            { match && flip && display([['C', 38, 300, '#cc0', 8],['B', 38, 0, '#cc0', 8],['A', 38, 60, '#cc0', 8],['F', 38, 120, '#cc0', 8],['E', 38, 180, '#cc0', 8],['D', 38, 240, '#cc0', 8]]) }       
        </svg>
      </div>
    );
  }
  
  export default Board;
  