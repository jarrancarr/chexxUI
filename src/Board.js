// import { logDOM } from '@testing-library/react';
import React from 'react';
import Hex from "./Hex"
import {map, revMap, flipped, inPromotePos, getPiece} from './res';

import {whiteMove, hilite, movePiece, swapPieces, analyse,isOnBoard, clear, text} from './res';
import { waybackMenu, aiMenu, promMenu, editMenu, userMenu, matchMenu, items, puzzles, tutorials, help, mainMenu, leave, hover, highlight} from './menu'
//let move = '';
//let editor = '';
//let promote = [];

function Board({color, user, match, update, view, menu, command, flip, mode, history}) { // console.log('Board: match:', menu, mode);
    //console.log('match', match);
    const board = analyse(match);  // console.log('board', board);
    let formation = [];
    let muster = [];
    let march = '';
    let switchArms = [];
    let special = false;
    let left = 0;
    let right = 0;

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

        clocks.push(<path key="opponentClock" id="opponentClock" transform={'translate('+x+','+y+') rotate(-14,0,0) scale('+sc+')'} fill="#a53" stroke='#111' strokeWidth={0.1} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        clocks.push(<circle key="opponentClockFace" id="opponentClockFace" transform={'translate('+x+','+y+') scale('+sc+')'} fill="#bbb" stroke='#111' strokeWidth={0.1} cx={0} cy={0} r={1.6}></circle>);

        clocks.push(<path key="myClock" id="myClock" transform={'translate('+x+','+(100-y)+') rotate(14,0,0) scale('+sc+')'} fill="#a53" stroke='#111' strokeWidth={0.1} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        clocks.push(<circle key="myClockFace" id="myClockFace" transform={'translate('+x+','+(100-y)+') scale('+sc+')'} fill="#bbb" stroke='#111' strokeWidth={0.1} cx={0} cy={0} r={1.6}></circle>);

        clocks.push(    
            <g key='whiteHands' transform={'translate('+x+','+(100-y)+') scale('+sc/2+')'} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                <path id='whiteMoveHand' transform={'rotate(180,0,0)'} className='noMouse' fill='#440' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.3 1 L 0 3 L -0.3 1 Z"></path>
                <path id='whiteGameHand' transform={'rotate(0,0,0)'} className='noMouse' fill='#a00' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.5 1 L 0.1 2 L -0.1 2 L -0.5 1 Z"></path>
                <circle fill="#000" cx="0" cy="0" r="0.5"/>
            </g>);
        clocks.push(    
            <g key='blackHands' transform={'translate('+x+','+y+') scale('+sc/2+')'} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                <path id='blackMoveHand' transform={'rotate(180,0,0)'} className='noMouse' fill='#220' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.3 1 L 0 3 L -0.3 1 Z"></path>
                <path id='blackGameHand' transform={'rotate(0,0,0)'} className='noMouse' fill='#a00' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 L 0.5 1 L 0.1 2 L -0.1 2 L -0.5 1 Z"></path>
                <circle fill="#000" cx="0" cy="0" r="0.5"/>
            </g>);
        return clocks;
    }
    function users() { // console.log('users',user, match);
        const ui = [];
        const x=20;
        const y=95;
        ui.push(<path key="user" id="user" transform={'translate('+x+','+y+') rotate(2,0,0) scale('+2+')'} fill="#359" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'users'})} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        ui.push(text(x,y,0,2,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px','.'+user.userid)); // x,y,r,sz,w,fc,sc,ds,text
        if (match.white.player && match.white.player.ID !== 0 && match.white.player.ID !== user.ID) {
            ui.push(<path key="opponent" id="opponent" transform={'translate('+x+','+(100-y)+') rotate(-2,0,0) scale('+2+')'} fill="#953" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'opponent'})} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
            ui.push(text(x,(100-y),0,2,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px','.'+match.white.player.userid)); // x,y,r,sz,w,fc,sc,ds,text       
        }
        if (match.black.player && match.black.player.ID !== 0 && match.black.player.ID !== user.ID) {
            ui.push(<path key="opponent" id="opponent" transform={'translate('+x+','+(100-y)+') rotate(-2,0,0) scale('+2+')'} fill="#953" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'opponent'})} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
            ui.push(text(x,(100-y),0,2,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px','.'+match.black.player.userid)); // x,y,r,sz,w,fc,sc,ds,text
        }
        return ui;
    }
    function commit() { console.log('commit');
        const ui = [];
        let x=5;
        let y=80;
        ui.push(<path key="commit" id="commit" transform={'translate('+x+','+y+') rotate(27,0,0) scale('+2+')'} fill="#ff5" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'commit', move:match.move}); match.move=''; }} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        ui.push(text(x,y,0,1.5 ,0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px','.'+match.move.replace('~','~ ').replace('x','x '))); // x,y,r,sz,w,fc,sc,ds,text

        x=5;
        y=20;
        ui.push(<path key="retry" id="retry" transform={'translate('+x+','+y+') rotate(27,0,0) scale('+2+')'} fill="#ff5" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'loadMatch', id:match.ID}); }} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        ui.push(text(x,y,0,2.0 ,0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px','.retry')); // x,y,r,sz,w,fc,sc,ds,text
   
        return ui;
    }
    function offline() {
        const ui = [];
        let x=80;
        let y=95;
        ui.push(<path key="editMatch" id="edit" transform={'translate('+x+','+y+') rotate(-2,0,0) scale('+2+')'} fill="#aa0" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:(menu==='edit'?'offline':'edit')})} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        ui.push(text(x,y,-28,2,0.01,'#fff','#500','#ff0000ff 0.2px 0.2px 0.25px',menu==='edit'?'.play':'.edit')); // x,y,r,sz,w,fc,sc,ds,text
        
        if (menu==='offline') {
            x=5;
            y=20;
            ui.push(<path key="cpu" id="cpu" transform={'translate('+x+','+y+') rotate(27,0,0) scale('+2+')'} fill="#8af" stroke='#111' strokeWidth={0.1} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=> { command({order:'menu', choice:'cpu'}); match.move=''; }} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
            ui.push(text(x,y,0,2.0 ,0.01,'#000','#500','#000000ff 0.2px 0.2px 0.25px','..CPU')); // x,y,r,sz,w,fc,sc,ds,text
        }
        return ui;
    }
    function tiles() {
        const hex = [];    
        for (let i = 0; i<13; i++) {
            for (let j = 0; j<25; j+=2) {
                if (isOnBoard(i,j)) hex.push(<Hex key={'hex-'+i+'-'+(j + i%2)} x={i} y={j} color={color} action={hexClicked}/>);
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
    function clean() {
        special = false;
        match.first = '';
        muster = [];
        switchArms = [];
        left = 0;
        right = 0;
    }
    function hexClicked(here) { // console.log('hexClicked  first:',first, '  here',here);
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
            if (here===march) { console.log('march');
                const copyMatch = {...match};
                for (const ps of formation) {
                    const [dir,coord] = [whiteMove(match)?-1:1, revMap[ps].split('-')];
                    const [x, y] = [parseInt(coord[0]),parseInt(coord[1])];
                    const fm = map[''+x+'-'+(y+dir*2)];
                    // console.log(march,'to',fm);
                    if (whiteMove(match)) {
                        for (const idx in match.white.pieces)
                            if (match.white.pieces[idx].substring(1)===ps) // { console.log('ps',ps);
                                copyMatch.white.pieces[idx]=match.white.pieces[idx][0]+fm;
                    } else {
                        for (const idx in match.black.pieces)
                            if (match.black.pieces[idx].substring(1)===ps) 
                                copyMatch.black.pieces[idx]=match.black.pieces[idx][0]+fm;
                    }
                }
                if (whiteMove(match)) copyMatch.move = '^^^^^^^^^'.substring(0,left)+match.first+'^^^^^^^^'.substring(0,right)
                else copyMatch.move = 'vvvvvvvvv'.substring(0,left)+match.first+'vvvvvvvvv'.substring(0,right)
                copyMatch.log.push(copyMatch.move);
                update(copyMatch);
                clean();
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
                update(copyMatch);
                clean();
            } else { console.log('add soldier    march:', march, '    muster:', muster, '   sa:', switchArms);
                if (!board.occupants[here]) {
                    clean();
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
                        clean();
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
            if (match.first === '') { // console.log('first selection'); // no piece was selected
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
                    //console.log('me', me);
                    //if (me && (me[1]==='P' || me[1]==='S') && inPromotePos(here)) {

                    if (me && (me[0][0]==='P' || me[0][0]==='S') && inPromotePos(here)) {
                        match.promote = [match.first, here];
                        command({order:'menu', choice:'promote'})
                    } else {
                        let copyMatch = {...match};
                        const store = JSON.stringify(match);
                        movePiece(copyMatch, board, [match.first, here]);
                        const look = analyse(copyMatch);
                        if ((!look.whiteInCheck && !look.blackInCheck)
                            || ((!look.whiteInCheck || whiteMove(copyMatch)) && (!look.blackInCheck || !whiteMove(copyMatch)))) {
                                if (!copyMatch.move) copyMatch.move = copyMatch.log[copyMatch.log.length-1];
                                update(copyMatch);
                        } else match = JSON.parse(store);
                        match.first = '';
                    }
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
                    notes.push(
                        <g key={'log-'+l} transform={t} onMouseOver={(e) => highlight(e, match.log[l],true, flip)} onMouseLeave={(e) => highlight(e, match.log[l],false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                            <rect id={'rect-'+match.log[l]} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                            {text(16,17.8,0,2,0,l%2===0?'#fff':'#000','#888',(notes.length%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',match.log[l].split('=')[0])}
                        </g>);
                }
            }
            for (let l=end+25;l<end+32;l++) { // fade out future
                if (l<match.log.length) {
                    let t = "rotate("+(-l+end-1)*5+", 50, 50)";
                    let f ='#444';
                    let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
                    notes.push(
                        <g key={'log-'+l} transform={t} opacity={(7-l+end+25)/7} onMouseOver={(e) => highlight(e, match.log[l],true, flip)} onMouseLeave={(e) => highlight(e, match.log[l],false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                            <rect id={'rect-'+match.log[l]} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                            {text(16,17.8,0,2,0,l%2===0?'#fff':'#000','#888',(l%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',match.log[l].split('=')[0])}
                        </g>);
                }
            }
            
        }
        for (let l=start;l<end;l++) {
            let t = "rotate("+(-l+end-1)*5+", 50, 50)";
            let f = l===end-1?"#99f":match.log[l].indexOf('x')>0?"#a55":"#363";
            let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
            notes.push(
                <g key={'log-'+l} transform={t} onMouseOver={(e) => highlight(e, match.log[l],true, flip)} onMouseLeave={(e) => highlight(e, match.log[l],false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                    <rect id={'rect-'+match.log[l]} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                    {text(16,17.8,0,2,0,l%2===0?'#fff':'#000','#888',(l%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',match.log[l].split('=')[0])}
                </g>);
        }
        if (start>0) {
            for (let l=fade;l<start;l++) { // fade out past
                let t = "rotate("+(-l+end-1)*5+", 50, 50)";
                let f = match.log[l].indexOf('x')>0?"#a55":"#363";
                let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
                notes.push(
                    <g key={'log-'+l} transform={t} opacity={(10+l-start)/10} onMouseOver={(e) => highlight(e, match.log[l],true, flip)} onMouseLeave={(e) => highlight(e, match.log[l],false, flip)} onClick={()=>command({order:'rewind', event:l})} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                        <rect id={'rect-'+match.log[l]} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                        {text(16,17.8,0,2,0,l%2===0?'#fff':'#000','#888',(l%2===0?'#80f':'#f80')+' 0.2px 0.2px 0.5px',match.log[l].split('=')[0])}
                    </g>);
            }
        }
        return notes;
    }
    React.useEffect(() => {
        [...document.getElementsByClassName('spin')].forEach(e=>e.beginElement())
        //match.move = 'test';
    }, [match, menu])

    return (
      <div className="App">
        <svg id='board' viewBox={view} xmlns="http://www.w3.org/2000/svg">
            <rect fill="#343" x="0" y="0" width="100" height="200"/>    
            <g transform={'translate(91, 8)'}> { help(command) } </g>   
            <g transform={'translate(91, 91)'}> { mainMenu(command, menu) } </g>
            <circle fill="#000" cx="50" cy="50" r="50"/>
            { clocks() }
            { user.userid && users() }
            { mode === 'match' && match.move && commit() }
            { mode === 'offline' && offline() }
            { ledger(match) }
            { menu==='puzzles' && <g transform={'translate(50, 50)'}> { puzzles(match, command, update) } </g>}
            { menu==='tutor' && <g transform={'translate(50, 50)'}> { tutorials(match, command, update) } </g>}
            { menu==='main' && <g transform={'translate(50, 50)'}> { items(match, command, update, user) } </g>}
            { menu==='match' && <g transform={'translate(50, 50)'}> { matchMenu(match, command, update, user) } </g>}
            { menu==='users' && <g transform={'translate(50, 50)'}> { userMenu(match, command, update) } </g>}
            { menu==='edit' && <g transform={'translate(50, 50)'}> { editMenu(match, command, update) } </g>}
            { menu==='cpu' && <g transform={'translate(50, 50)'}> { aiMenu(match, command, update) } </g>}
            { menu==='promote' && <g transform={'translate(50, 50)'}> { promMenu(match, command, update) } </g>}
            { menu==='wayback' && <g transform={'translate(50, 50)'}> { waybackMenu(match, command, update) } </g>}
            <circle fill={board.whiteInCheck||board.blackInCheck?'#F33':'#321'} cx="50" cy="50" r="43"/>
            <circle fill="#131" cx="50" cy="50" r="42"/>
            { tiles() }
            <g transform={"translate(50,50) scale(1.5)"} style={{ filter: 'drop-shadow(rgba(210, 128, 210, 0.4) 0px 0px 2px)'}}>
                { rose() }
            </g>
            { board.mate && text(25,53,11,0.3,'#f0f','#f20','Checkmate') }
        </svg>
      </div>
    );
  }
  
  export default Board;
  