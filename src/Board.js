// import { logDOM } from '@testing-library/react';
import React from 'react';
import Hex from "./Hex"
import Piece from "./Piece";
import {map, revMap} from './res';

import {whiteMove, hilite, movePiece, analyse,isOnBoard, clear} from './res';

function rose() {
  const points = [];
  for (let i=30;i<360;i+=60) {
    points.push(<path key={'left-'+i} transform={'rotate('+i+')'} className='noMouse' fill='#990' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 1.7 L 0.3 0.5 Z"></path>);
    points.push(<path key={'right-'+i}  transform={'rotate('+i+')'} className='noMouse' fill='#550' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 1.7 L -0.3 0.5 Z"></path>);
  }
  for (let i=0;i<360;i+=60) {
    points.push(<path key={'left-'+i}  transform={'rotate('+i+')'} className='noMouse' fill='#990' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 2 L 0.3 0.5 Z"></path>);
    points.push(<path key={'right-'+i}  transform={'rotate('+i+')'} className='noMouse' fill='#550' stroke='#000' strokeWidth={0.02} strokeOpacity={0.5} d="M 0 0 V 2 L -0.3 0.5 Z"></path>);
  }
  return points;
}

function Board({color, user, match, update, view, menu, command}) { console.log('Board');

    let first = ''; // selection of piece
    const board = analyse(match);  // console.log('board',board);
    let formation = [];
    let muster = [];
    let march = '';
    let switchArms = [];
    let special = false;
    let left = 0;
    let right = 0;
    const serverUrl = 'http://localhost:8000';


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
                first = here;
                hilite([skewerer[0][1]],'stroke', moves[0][0]==='w'?'#f25':'#f52');
            }
            moves[0] = [];
            return;
        }
        if (moves) {
            hilite(moves[1],'stroke', moves[0][0]==='w'?'#8f2':'#2f8');
            first = here;
        } else {
            if (attacked) { // this must be a blank space
                hilite(attacked[0],'stroke', '#f2a');
                hilite(attacked[1],'stroke', '#fa2');
            }
            if (covered) { // this must be a blank space
                hilite(covered[0],'stroke', '#a27');
                hilite(covered[1],'stroke', '#a72');
            }
        }
        if (attacks) {
            const me = occupants[here];
            if (me[1] === 'P' || me[1] === 'S') {
                hilite(attacks[1].filter(a=>occupants[a]),'stroke', moves[0][0]==='w'?'#f25':'#f85');
            } else hilite(attacks[1],'stroke', moves[0][0]==='w'?'#f25':'#f85');
            first = here;
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

    function hexClicked(here) { // console.log('hexClicked  first:',first, '  here',here);
        if (menu==='tutor') {
            command({order:'guess', here: here});
            return;
        }
        clear();
        hilite([here],"stroke","#00f");
        const attacks = board.attacks[here];
        const attacked = board.attacked[here];
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
                copyMatch.log.push('--------'.substring(0,left)+here+'--------'.substring(0,right));
                update(copyMatch);
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
                copyMatch.log.push('%%%%%%%%'.substring(0,left)+here+'%%%%%%%%'.substring(0,right));
                update(copyMatch);
            } else { // console.log('add soldier');
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
                    special = false;
                    first = '';
                    muster = [];
                    switchArms = [];
                }
                // console.log('muster', muster); console.log('switchArms', switchArms); console.log('formation',formation);
                hilite(muster,'stroke', '#0ff');
                hilite(switchArms,'stroke', '#a0a');
                hilite(switchArms.filter(sa=>muster.includes(sa)),'stroke', '#afa');
                hilite(formation,'stroke', '#ff4');
                hilite([formation[0]],'stroke', '#f8f');
                hilite([march],'stroke', '#9f9');
            }
        } else { // not special
            if (first === '') { // console.log('first selection'); // no piece was selected
                selectPiece(moves, attacks, attacked, covered, board.occupants, board.pinned, here);
                // console.log('moves',moves); console.log('attacks',attacks); console.log('attacked, covered',attacked, covered);
            } else { // console.log('second selection');  // piece had already been chosen...
                if (first === here && board.occupants[here][0]===(whiteMove(match)?'w':'b')) { console.log('init special moves');  // select piece again.... special moves
                    const [canMarch, swArms] = specialMoves(here);
                    const [m,sa] = getChain(here, true, true); //console.log('muster, switchArms',muster, switchArms)
                    formation = [here]
                    if (canMarch) muster=m; else muster=[];
                    if (swArms) switchArms=sa; else switchArms=[];
                    hilite(switchArms,'stroke', '#f0f');
                    hilite(muster,'stroke', '#0ff');
                    hilite(switchArms.filter(sa=>muster.includes(sa)),'stroke', '#afa');
                    hilite(formation,'stroke', '#ff4')
                    special = true;
                    const [dir,coord] = [board.occupants[here][0]==='w'?-1:1, revMap[here].split('-')];
                    const [x, y] = [parseInt(coord[0]),parseInt(coord[1])];
                    march = map[''+x+'-'+(y+dir*2)];
                } else if (myGuy || (board.moves[first][0][0]==='w' && !whiteMove(match)) || (board.moves[first][0][0]==='b' && whiteMove(match))) { // is the first selection not mine
                    // console.log('this is either another of my guys or the first selection was the enemy.');
                    first = '';
                    selectPiece(moves, attacks, attacked, covered, board.occupants, board.pinned, here);
                } else if (board.moves[first][1].includes(here) || board.attacks[first][1].includes(here)) { // console.log('valid move');
                    let copyMatch = {...match};
                    const store = JSON.stringify(match);
                    movePiece(copyMatch, board, first, here);
                    // console.log('updating match',match)
                    const look = analyse(copyMatch);
                    if (!look.whiteInCheck && !look.blackInCheck) update(copyMatch);
                    if ((look.whiteInCheck && whiteMove(copyMatch))||(look.blackInCheck && !whiteMove(copyMatch))) update(copyMatch);
                    else match = JSON.parse(store);
                    first = '';
                } else { // console.log('invalid move');
                    first = '';
                    selectPiece(moves, attacks, attacked, covered, board.occupants, board.pinned, here);
                    // console.log('destination',board.moves[first],board.attacks[first]);
                }

            } // console.log('check',board.check);
        } // else not special moves
    }

    function highlight(e, log, on) { // console.log('highlight',log,on);
        const term = log.split(/[ABEIKNPQRS~x|:=+]/);
        for (const id of term) {
            let ele = document.getElementById(id);
            if (ele) {
                ele.setAttribute('style', 'filter: drop-shadow(rgba('+(on?'255, 255, 128, 0.99':'0, 0, 0, 0.0')+') 0px 0px 3px)');
                ele.setAttribute('stroke', on?'#fff':'#000');
                ele.setAttribute('stroke-width', on?'0.2':'0.1');
                e.target.setAttribute('x',on?8:13);
                e.target.nextSibling.setAttribute('x',on?9:14);
            }
        }
    }
    function ledger() {
        const notes = [];
        for(let l in match.log) {
            let t = "rotate("+(-l+match.log.length-1)*5+", 50, 50)";
            let f = match.log[l].indexOf('x')>0?"#a55":"#363";
            let s = match.log[l].indexOf('+')>0?"#ff3":"#666";
            notes.push(
                <g key={match.log[l]} transform={t} onMouseOver={(e) => highlight(e, match.log[l],true)} onMouseLeave={(e) => highlight(e, match.log[l],false)} style={{ filter: 'drop-shadow(rgba(180, 180, 0, 0.5) 0.3px 0px 1px)'}}>
                    <rect id={'rect-'+match.log[l]} x="13" y="16" fill={f} stroke={s} strokeWidth={0.35} height="3" width="20"/>
                    <text id={'text-'+match.log[l]} x="14" y="18.3" className='noMouse' fontFamily="Verdana" fontSize="2.5" fill={notes.length%2===0?"white":"black"}>{match.log[l].split('=')[0]}</text>
                </g>);
        }
        return notes;
    }
    function hover(e) { // console.log('hover',e.target.id);
        hilite([e.target.id],'style', 'filter: drop-shadow(rgba(255, 0, 255, 0.99) 0px 0px 3px)');
        hilite([e.target.id],'stroke', '#fff');
        hilite([e.target.id],'stroke-width', '0.2');
    }
    function leave(c, e) {
        hilite([e.target.id],'style', 'filter: drop-shadow(rgba(0, 0, 0, 0.0) 0px 0px 0px)');
        hilite([e.target.id],'stroke', c);
        hilite([e.target.id],'stroke-width', '0.1');
    }

    function mainMenu() {
        const menu = [];
        menu.push(<path id="menu" key='menu' onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'main'})} transform={'rotate(-14,0,0) scale(4)'} stroke='#000' strokeWidth={0.1} fill={'#880'} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        for (const l of [[-4.6,-0.3,'#b00',0.6],[-3.4,-0.3,'#00b',0.4],[-3.4,0.3,'#0b0',0.4],[-4.6,0.3,'#880',0.4],[-4,0,'#000', 1]])
            for(let j=-3;j<4;j+=3)
                menu.push(<path className='noMouse' key={'dash'+l[0]+l[1]+j} stroke={l[2]} strokeWidth={1} opacity={l[3]} d={'M '+l[0]+' '+(l[1]+j)+' H '+(l[0]+8)}></path>);
        return menu;
    }
    function help() { // console.log('help');
        const help = [];
        help.push(<path id="help" key='help' onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'tutor'})} transform={'rotate(14,0,0) scale(4)'} stroke='#000' strokeWidth={0.1} fill={'#880'} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
        for (const l of [[-2,4.5,'#0a0',0.5],[-3,3.5,'#a00',0.5],[-2,3.5,'#00a',0.5],[-2.5,4,'#000',1]]) 
            help.push(<text key={'qMark'+l[0]+l[1]} className='noMouse' x={l[0]} y={l[1]} fontFamily="Verdana" fontSize="13" fill={l[2]} opacity={l[3]}>?</text>);
        
        return help;
    }

    function makeMenu(list, label, end, spin, bloom) { // console.log('tutorials');
        const items=[];
        let iter = 0;
        for (const p of list) {
            const id = (label+'-'+p[0]).replaceAll('.','').replaceAll(' ','').trim().toLowerCase();
            const words = p[0].trim().split(' '); 
            const fs = [];
            const nudge = [];
            for (const w of words) {
                const t = w.split(w.replaceAll('.',''));
                nudge.push((t[1].length-t[0].length)/3-2-w.length/50);
                fs.push(60/(3+w.length*2));
            }
            items.push(<g key={id} transform={'rotate('+(end+iter*10)+',0,0) '}>
                <animateTransform className='spin' attributeName="transform" attributeType="XML" type="rotate" from={''+(spin+iter*bloom)+' 0 0'} to={''+(end+iter*10)+' 0 0'} dur='0.4s' begin='indefinite' repeatCount="1"/>
                <g transform={'translate(47, 0)'}>
                <path id={id} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={() => menuSelect(id)} transform={'rotate(30) scale(2)'} stroke='#000' strokeWidth='0.1' fill='#880' d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>
                <g transform={'rotate('+(-end-iter*10)+',0,0)'} filter='drop-shadow(rgba(0, 0, 0, 0.99) 0px 0px 0.3px)'>
                    { p[1] && <g transform={'translate(-15.8, -11.2)'} filter='drop-shadow(rgba(0, 0, 0, 0.99) 0.3px 0.3px 0.03px)'><Piece w={p[1]} x={0} y={0} c='#cc4' s={'#110'} id='tutor' sc={0.2}/></g>}
                    { !p[1] && words.length===1 && <text className='noMouse' x={nudge[0]} y={fs[0]/4} fontFamily="Verdana" fontSize={fs} fill='#cc4'>{words[0].replaceAll('.','')}</text> }
                    { !p[1] && words.length===2 && <text className='noMouse' x={nudge[0]} y={-fs[0]/5} fontFamily="Verdana" fontSize={fs[0]} fill='#cc4'>{words[0].replaceAll('.','')}</text> }
                    { !p[1] && words.length===2 && <text className='noMouse' x={nudge[1]} y={(fs[0]+fs[1])/3} fontFamily="Verdana" fontSize={fs[1]} fill='#cc4'>{words[1].replaceAll('.','')}</text> }
                    { !p[1] && words.length===3 && <text className='noMouse' x={nudge[0]} y={-(fs[1]+fs[2])/5} fontFamily="Verdana" fontSize={fs[0]} fill='#cc4'>{words[0].replaceAll('.','')}</text> }
                    { !p[1] && words.length===3 && <text className='noMouse' x={nudge[1]} y={fs[2]/3} fontFamily="Verdana" fontSize={fs[1]} fill='#cc4'>{words[1].replaceAll('.','')}</text> }
                    { !p[1] && words.length===3 && <text className='noMouse' x={nudge[2]} y={2*(fs[1]+fs[2])/3} fontFamily="Verdana" fontSize={fs[2]} fill='#cc4'>{words[2].replaceAll('.','')}</text> }
               
                </g></g></g>);
            iter++;
        }
        return items;
    }



    function tutorials() { // console.log('tutorials');
        return makeMenu([['...Start. ...Here..',''],['...Quick. ...Start.',''],['....Interface..',''],['....Board.',''],['....Rules.',''],['pawn','P'],['spear','S'],['knight','N'],['bishop','B'],['rook','R'],['queen','Q'],['archer','A'],['prince','I'],['princess','E'],['king','K'],['.....Special...',''],['......Promotion...',''],['....Forks..',''],['.....Skewers..',''],['...Pins.',''],['....Tactics.','']], 'lesson', -130, -90, 7);
    }
    function puzzles() { // console.log('tutorials');
        return makeMenu([['Mate in.. One'],['Mate in.. Two'],['Mate in.. Three'],['Mate in.. More']],'puzzle', -10, -6, 1);
    }
    function items() { // console.log('tutorials');
        return makeMenu([['....About.',''],['....Login. ',''],['....Puzzles..',''],['....Match..',''],['....Teams/.... .....Tournaments...',''],['.....Conquest..','']],'items', 20, 40, 3);
    }
    function matchMenu() { // console.log('tutorials');
        return makeMenu([['....Load..',''],['...Save.',''],['...Play.. ....Online.',''],['...Play... ......Computer...','']],'match', 40, 55, 1);
    }

    function menuSelect(item) { console.log('menuSelect('+item+')');
        command({order:'menu', choice:''});
        switch(item) {
            case 'items-about': command({order:'dialog', title:'About Chexx', text:'A Chess variant'}); break;
            case 'items-login': command({order:'dialog', title:'Log in', text:'Select a login method.', login:true}); break;
            case 'Play Cpu':  command({order:'dialog', title:'New Game vs AI?', text:'Play against computer...', yesno:true}); break;
            case 'items-puzzles': command({order:'menu', choice:'puzzles'}); break;
            case 'items-match': command({order:'menu', choice:'match'}); break;
            case 'lesson-starthere': lesson('Intro'); break;
            case 'lesson-interface': lesson('Interface'); break;
            case 'lesson-quickstart': lesson('Unimplemented'); break;
            case 'lesson-board': lesson('Board'); break;
            case 'lesson-rules': lesson('Rules'); break;
            case 'lesson-pawn': lesson('Pawn'); break;
            case 'lesson-spear': lesson('Spearman'); break;
            case 'lesson-knight': lesson('Knight'); break;
            case 'lesson-bishop': lesson('Bishop'); break;
            case 'lesson-rook': lesson('Rook'); break;
            case 'lesson-archer': lesson('Archer'); break;
            case 'lesson-queen': lesson('Queen'); break;
            case 'lesson-prince': lesson('Prince'); break;
            case 'lesson-princess': lesson('Princess'); break;
            case 'lesson-special': lesson('Special'); break;
            case 'lesson-promotion': lesson('Promotion'); break;
            case 'lesson-forks': lesson('Forks'); break;
            case 'lesson-skewers': lesson('Skewers'); break;
            case 'lesson-pins': lesson('Pins'); break;
            case 'lesson-tactics': lesson('Tactics'); break;
            default: lesson('Unimplemented'); break;
        }
    }

    function lesson(on) { console.log('do lesson on',on);
        // selectMenu(state);
        fetch(serverUrl+'/tutor',{
        mode: 'cors',
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({'lesson':on})
      }).then(response => response.json() )
        .then(data => command({order:'tutorial',lesson:data}));
    }

    React.useEffect(() => {
        [...document.getElementsByClassName('spin')].forEach(e=>e.beginElement())
    }, [menu])

    return (
      <div className="App">
        <svg id='board' viewBox={view} xmlns="http://www.w3.org/2000/svg">
            <rect fill="#343" x="0" y="0" width="100" height="200"/>    
            <g transform={'translate(91, 8)'}> { help() } </g>   
            <g transform={'translate(91, 91)'}> { mainMenu() } </g>
            <circle fill="#000" cx="50" cy="50" r="50"/>
            { clocks() }
            { ledger() }
            { menu==='puzzles' && <g transform={'translate(50, 50)'}> { puzzles() } </g>}
            { menu==='tutor' && <g transform={'translate(50, 50)'}> { tutorials() } </g>}
            { menu==='main' && <g transform={'translate(50, 50)'}> { items() } </g>}
            { menu==='match' && <g transform={'translate(50, 50)'}> { matchMenu() } </g>}
            <circle fill={board.whiteInCheck||board.blackInCheck?'#F33':'#321'} cx="50" cy="50" r="43"/>
            <circle fill="#131" cx="50" cy="50" r="42"/>
            { tiles() }
            <g transform={"translate(50,50) scale(1.5)"} style={{ filter: 'drop-shadow(rgba(210, 128, 210, 0.4) 0px 0px 2px)'}}>
                { rose() }
            </g>
            {user.name && <text x={25} y={53} fontFamily="Verdana" fontSize="11" fill='#f0f' stroke='#f20'strokeWidth={0.3} >{user.name}</text>}
            { board.mate && <text x={25} y={53} fontFamily="Verdana" fontSize="11" fill='#f0f' stroke='#f20'strokeWidth={0.3} >Checkmate</text>}
        </svg>
      </div>
    );
  }
  
  export default Board;
  