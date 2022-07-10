import {text, getPiece, serverUrl, hilite, analyse, whiteMove, revMap, flipped} from './res';
import Piece from "./Piece";
import $ from 'jquery';

function hover(e) { //console.log('hover',e.target.id);
    hilite([e.target.id],'style', 'filter: drop-shadow(rgba(255, 0, 255, 0.99) 0px 0px 3px)');
    hilite([e.target.id],'stroke', '#fff');
    hilite([e.target.id],'stroke-width', '0.2');
    if (e.target.id.startsWith('ready')) $('#hint4').text("Your turn");
    if (e.target.id.startsWith('wait')) $('#hint5').text("Opponent's turn");
    if (e.target.id.startsWith('open')) $('#hint2').text("Open Challenges");
    if (e.target.id.startsWith('myopen')) $('#hint2').text("Your Open Challenges");
    if (e.target.id.startsWith('finished')) $('#hint6').text("Finished Matches");

}
function leave(c, e) {
    hilite([e.target.id],'style', 'filter: drop-shadow(rgba(0, 0, 0, 0.0) 0px 0px 0px)');
    hilite([e.target.id],'stroke', c);
    hilite([e.target.id],'stroke-width', '0.1');
    $('.hint').text("");
}
function highlight(e, log, on, flip) { // console.log('highlight',log,on);
    const term = log.split(/[ABEIKNPQRS~xv#^|:=+]/);
    for (const id of term) {
        if (id) {
            let ele = document.getElementById(flip?flipped(id):id); // flip?flipped(id):id
            if (ele) {
                ele.setAttribute('style', 'filter: drop-shadow(rgba('+(on?'255, 255, 128, 0.99':'0, 0, 0, 0.0')+') 0px 0px 3px)');
                ele.setAttribute('stroke', on?'#fff':'#000');
                ele.setAttribute('stroke-width', on?'0.2':'0.1');
            }
        }
    }
    e.target.setAttribute('x',on?8:13);
    e.target.nextSibling.firstChild.setAttribute('x',on?9:14);
}
function toggleMain(command, menu) { // console.log('toggleMain',menu);
    command({order:'menu', choice:menu==='main'?'offline':'main'})
}
function about(command) {
    command ({order:'dialog', title:'About Chexx', 
        text:['h2:::A Chess variant played on a hexagonal board.', 
            'h4:::Lead developer: Jarran J Carr', 
            'h4:::Business Development: Jamie N Carr',
            'h5:::Version 0.5.11',
            'h3:::Expected Release~ October, 2022',
            'p:::Chexx is a player vs. player forum that allows for... ']});
}
function disselect() {
    [...document.getElementsByClassName('edit-b')].forEach(e=>e.setAttribute('fill','#ff909060'));
    [...document.getElementsByClassName('edit-w')].forEach(e=>e.setAttribute('fill','#ff909060'));
    [...document.getElementsByClassName('edit')].forEach(e=>e.setAttribute('fill','#ff909060'));
}
function promoteSelect(match, item, command, update) {
    let q = 'P';
    let copyMatch = {...match};
    const store = JSON.stringify(match);
    switch(item) {
        case 'promote-bishop': q='B'; break;
        case 'promote-knight': q='N'; break;
        case 'promote-archer': q='A'; break;
        case 'promote-rook': q='R'; break;
        case 'promote-prince': q='I'; break;
        case 'promote-princess': q='E'; break;
        case 'promote-queen': q='Q'; break;
        default: break;            
    }
    const p = getPiece(copyMatch, match.promote[0]);
    if (p[1]) { // white
        copyMatch.white.pieces = copyMatch.white.pieces.filter(f => f.substring(1)!==match.promote[0]);
        copyMatch.white.pieces.push(q+match.promote[1]);
    } else { // black
        copyMatch.black.pieces = copyMatch.black.pieces.filter(f => f.substring(1)!==match.promote[0]);
        copyMatch.black.pieces.push(q+match.promote[1]);
    }
    copyMatch.log.push(p[0]+'~'+q+match.promote[1]);
    const look = analyse(copyMatch);
    if ((!look.whiteInCheck && !look.blackInCheck)
        || ((!look.whiteInCheck || whiteMove(copyMatch)) && (!look.blackInCheck || !whiteMove(copyMatch)))) {
            if (!match.move) match.move = copyMatch.log[copyMatch.log.length-1];
            update(copyMatch);
    } else match = JSON.parse(store);
    match.first = '';
    command({order:'menu', choice:''});
}
function aiSelect(match, item, command, update) {
    switch(item) {
        case 'ai-veryeasy': command({order:'cpu', level:1}); break;
        case 'ai-easy': command({order:'cpu', level:2}); break;
        case 'ai-medium': command({order:'cpu', level:3}); break;
        case 'ai-hard': command({order:'cpu', level:4}); break;
        case 'ai-veryhard': command({order:'cpu', level:5}); break;
        case 'ai-best': command({order:'cpu', level:6}); break;
        default: match.editor = ''; break;            
    }
}
function editSelect(match, item, command, update) {
    if ((item.startsWith('edit-w-') || item.startsWith('edit-b-')) && !revMap[match.editor]) { console.log('init meta', match.editor, revMap[match.editor]);
        disselect();
        if (match.editor && item.endsWith(match.editor)) {
            match.editor = '';
        } else {
            match.editor = item.substring(5);
            hilite([item],'fill', '#8f8', false);
        }
        return
    }
    let copyMatch = {...match};
    copyMatch.log = [];
    switch(item) {
        case 'edit-w-king': copyMatch.white.pieces.push('K'+match.editor); break;
        case 'edit-w-queen': copyMatch.white.pieces.push('Q'+match.editor); break;
        case 'edit-w-prince': copyMatch.white.pieces.push('I'+match.editor); break;
        case 'edit-w-princess': copyMatch.white.pieces.push('E'+match.editor); break;
        case 'edit-w-rook': copyMatch.white.pieces.push('R'+match.editor); break;
        case 'edit-w-archer': copyMatch.white.pieces.push('A'+match.editor); break;
        case 'edit-w-bishop': copyMatch.white.pieces.push('B'+match.editor); break;
        case 'edit-w-knight': copyMatch.white.pieces.push('N'+match.editor); break;
        case 'edit-w-pawn': copyMatch.white.pieces.push('P'+match.editor); break;
        case 'edit-w-spear': copyMatch.white.pieces.push('S'+match.editor); break;
        case 'edit-b-king': copyMatch.black.pieces.push('K'+match.editor); break;
        case 'edit-b-queen': copyMatch.black.pieces.push('Q'+match.editor); break;
        case 'edit-b-prince': copyMatch.black.pieces.push('I'+match.editor); break;
        case 'edit-b-princess': copyMatch.black.pieces.push('E'+match.editor); break;
        case 'edit-b-rook': copyMatch.black.pieces.push('R'+match.editor); break;
        case 'edit-b-archer': copyMatch.black.pieces.push('A'+match.editor); break;
        case 'edit-b-bishop': copyMatch.black.pieces.push('B'+match.editor); break;
        case 'edit-b-knight': copyMatch.black.pieces.push('N'+match.editor); break;
        case 'edit-b-pawn': copyMatch.black.pieces.push('P'+match.editor); break;
        case 'edit-b-spear': copyMatch.black.pieces.push('S'+match.editor); break;
        case 'edit-trash': console.log('take out trash',match.editor);
            copyMatch.white.pieces = match.white.pieces.filter(f => f.substring(1)!==match.editor);
            copyMatch.black.pieces = match.black.pieces.filter(f => f.substring(1)!==match.editor);
            if (match.editor && match.editor==='XXXXX' ) { // item.endsWith(match.editor)
                copyMatch.editor = '';
                disselect();
            } else {
                copyMatch.editor = 'XXXXX';
                disselect();
                hilite(['edit-trash'],'fill', '#8f8', false);
            }
            break;
        case 'edit-details': command({order:'dialog', title:'Match Details', details:true, ok:true}); break;
        case 'edit-clear': update({id:0, name:'offline', white:{pieces:['Kc44'], time:300}, black:{pieces:['Ka41'], time:300}, log:[], type:{game:300, move:15}}); return;
        case 'edit-flip': command({order:'flip'}); break;
        default: match.editor = ''; break;
    }
    match.editor = '';
    update(copyMatch);
}
function itemsSelect(match, item, command, update) {
    switch(item) {
        case 'items-about': about(command); break;
        case 'items-login': command({order:'dialog', title:'Log in', text:['Select a login method.'], login:true}); break;
        case 'items-puzzles': command({order:'menu', choice:'puzzles'}); break;
        case 'items-profile': command({order:'profile'}); break;
        case 'items-resetboard': command({order:'setup'}); break;
        default: break;
    } 
}
function lessonSelect(match, item, command, update) {
    switch(item) {case 'lesson-starthere': lesson('Intro', command); break;
        case 'lesson-interface': lesson('Interface', command); break;
        case 'lesson-quickstart': lesson('Quick', command); break;
        case 'lesson-board': lesson('Board', command); break;
        case 'lesson-rules': lesson('Rules', command); break;
        case 'lesson-pawn': lesson('Pawn', command); break;
        case 'lesson-spear': lesson('Spearman', command); break;
        case 'lesson-knight': lesson('Knight', command); break;
        case 'lesson-bishop': lesson('Bishop', command); break;
        case 'lesson-rook': lesson('Rook', command); break;
        case 'lesson-archer': lesson('Archer', command); break;
        case 'lesson-queen': lesson('Queen', command); break;
        case 'lesson-prince': lesson('Prince', command); break;
        case 'lesson-princess': lesson('Princess', command); break;
        case 'lesson-special': lesson('Special', command); break;
        case 'lesson-promotion': lesson('Promotion', command); break;
        case 'lesson-forks': lesson('Forks', command); break;
        case 'lesson-skewers': lesson('Skewers', command); break;
        case 'lesson-pins': lesson('Pins', command); break;
        case 'lesson-tactics': lesson('Tactics', command); break;
        default: lesson('Unimplemented'); break;
    } 
}
function matchSelect(match, item, command, update) {
    switch(item) {
        case 'match-playcomputer':  command({order:'dialog', title:'New Game vs AI?', text:['Play against computer...'], yesno:true}); break;
        case 'match-save': command({order:'saveMatch', match:match}); break;
        case 'match-openchallenge': command({order:'dialog', title:'Open Challenge', text:['Only opponents within 200 points of your rank will be allowed to accept your challenge.'], challenge:true}); break;
        case 'match-delete': command({order:'dialog', title:'Delete Match', text:['h1:::'+match.name], yesno:true, openId:match.ID}); break;
        default: break;
    } 
}
//function Select(match, item, command, update) {}
function menuSelect(match, item, command, update) { //console.log('menuSelect('+item+')');
    if (item.startsWith('promote-')) {
        promoteSelect(match, item, command, update);
        return
    }
    if (item.startsWith('ai-')) { 
        aiSelect(match, item, command, update);
        return
    }
    if (item.startsWith('edit-')) {
        editSelect(match, item, command, update);
        return;
    }
    command({order:'menu', choice:''});
    if (item.startsWith('load-') || item.startsWith('ready-') || item.startsWith('wait-')) { 
        command({order:'loadMatch', id:item.split('-')[2]});
        return;
    }
    if (item.startsWith('open-')) { 
        command({order:'accept', id:item.split('-')[2]});
        return;
    }
    if (item.startsWith('myopen-')) { 
        const oc = item.split('-');
        command({order:'dialog', title:'Your Challenge',text:['h3:::Open challenge: '+oc[1],'h5:::Opened:','h4:::Close challenge?'], id:oc[2], yesno:true, noClose:true});
        return;
    }
    if (item.startsWith('items-')) { 
        itemsSelect(match, item, command, update);
        return;
    }
    if (item.startsWith('match-')) { 
        matchSelect(match, item, command, update);
        return;
    }
    if (item.startsWith('lesson-')) { 
        lessonSelect(match, item, command, update);
        return;
    }
    switch(item) {
        case 'user-logout': command({order:'dialog', title:'Log out?', text:['Leaving us so soon?'], yesno:true}); break;
        case 'user-matches': command({order:'listMatches'}); break;
        case 'user-profile': command({order:'profile'}); break;
        default: break;
    } // end menu not starts with...
}
function lesson(on, command) { // console.log('do lesson on',on);
    // selectMenu(state);
    fetch(serverUrl+'/tutor',{
    mode: 'cors',
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({'lesson':on})
  }).then(response => response.json() )
    .then(data => command({order:'tutorial',lesson:data}));
}
function mainMenu(command, menu) {
    const items = [];
    items.push(<path id="menu" key='menu' onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>toggleMain(command, menu)} transform={'rotate(-14,0,0) scale(4)'} stroke='#000' strokeWidth={0.1} fill={'#880'} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
    for (const l of [[-4.6,-0.3,'#b00',0.6],[-3.4,-0.3,'#00b',0.4],[-3.4,0.3,'#0b0',0.4],[-4.6,0.3,'#880',0.4],[-4,0,'#000', 1]])
        for(let j=-3;j<4;j+=3)
            items.push(<path className='noMouse' key={'dash'+l[0]+l[1]+j} stroke={l[2]} strokeWidth={1} opacity={l[3]} d={'M '+l[0]+' '+(l[1]+j)+' H '+(l[0]+8)}></path>);
    return items;
}
function help(command) { // console.log('help');
    const help = [];
    help.push(<path id="help" key='help' onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={()=>command({order:'menu', choice:'tutor'})} transform={'rotate(14,0,0) scale(4)'} stroke='#000' strokeWidth={0.1} fill={'#880'} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>);
    for (const l of [[-2,4.5,'#0a0',0.5],[-3,3.5,'#a00',0.5],[-2,3.5,'#00a',0.5],[-2.5,4,'#000',1]]) 
        help.push(<text key={'qMark'+l[0]+l[1]} className='noMouse' x={l[0]} y={l[1]} fontFamily="Verdana" fontSize="13" fill={l[2]} opacity={l[3]}>?</text>);
    
    return help;
}
function makeMenu(match, command, update, list, label, end, spin, bloom, size=2, font=4, color='#880', draw='#110', fill='#cc4') { // console.log('tutorials');
    const items=[];
    if (!list || list.length===0) return [];
    let iter = 0;
    for (const p of list) {
        const txt = p[0].split(':');
        if (p[1]!=='spacer') {
            const id = (label+'-'+p[0]).replaceAll('.','').replaceAll(' ','').replaceAll(':','-').trim().toLowerCase();
            
            items.push(<g key={id} transform={'rotate('+(end+iter*4.5*size)+',0,0) '}>
                <animateTransform className='spin' attributeName="transform" attributeType="XML" type="rotate" from={''+(spin+iter*bloom)+' 0 0'} to={''+(end+iter*4.5*size)+' 0 0'} dur='0.4s' begin='indefinite' repeatCount="1"/>
                <g transform={'translate(47, 0)'}>
                <path id={id} className={label} onMouseOver={hover} onMouseLeave={(e)=>leave('#000',e)} onClick={() => menuSelect(match, id, command, update)} transform={'rotate(30) scale('+size+')'} stroke='#000' strokeWidth='0.1' fill={color} d="M -1.7 -1 L 0 -2 L 1.7 -1 V 1 L 0 2 L -1.7 1 Z"></path>
                <g transform={'rotate('+(-end-iter*4.5*size)+',0,0)'} filter='drop-shadow(rgba(0, 0, 0, 0.99) 0px 0px 0.3px)'>
                    { p[1] && <g transform={'translate(-15.8, -11.2)'} filter='drop-shadow(#000 0.3px 0.3px 0.03px)'><Piece type={'x'+p[1]} x={0} y={0} c={fill} s={draw} id='tutor' sc={0.2}/></g>}
                    { !p[1] && text(0,0,0,font,0,fill,draw,'#00f 0.3px 0.3px 0.03px',txt[0], 'txt-'+id) }
                </g></g></g>);
        }
        iter++;
    }
    return items;
}
function tutorials(match, command, update) { // console.log('tutorials');
    return makeMenu(match, command, update, [['..Start. ..Here.',''],['...Quick.. .Start.',''],['....Interface.',''],['...Board..',''],['..Rules.',''],['pawn','P'],['spear','S'],['knight','N'],['bishop','B'],['rook','R'],['queen','Q'],['archer','A'],['prince','I'],['princess','E'],['king','K'],['...Special.',''],['......Promotion..',''],['...Forks.',''],['....Skewers.',''],['.Pins.',''],['...Tactics.','']], 'lesson', -110, -110, 9,2,2);
}
function puzzles(match, command, update) { // console.log('puzzles');
    return makeMenu(match, command, update, [['Mate in... One'],['Mate in... Two'],['Mate in.... Three'],['Mate in.... More']],'puzzle', -10, -6, 1,2,1.4);
}
function items(match, command, update, user) { // console.log('main items');
    const items = [['..About',''],['..Puzzles',''],['.Reset .Board','','']];
    if (!user.userid) items.push(['.Login','']);
    return makeMenu(match, command, update, items,'items', 20, 22, 7, 2, 1.6,'#884');
}
function matchMenu(match, command, update, user) { // console.log('match');
    const items = [['.Open ..Challenge',''],['.Save',''],['.Blitz ..Match',''],['Play ...Computer',''],['..History',''],['..Live']];
    if (match.move) items.unshift(['..Undo','']);
    if (match.ID>0 && match.white.player.ID === user.ID && match.black.player.ID===user.ID) items.unshift(['..Delete','']);
    let matchMenu = makeMenu(match, command, update, items,'match', 110, 112, 8,2,1.6,'#88a');
    if (user.savedMatches) matchMenu = matchMenu.concat(makeMenu(match, command, update, user.savedMatches,'load', 205, 205+user.savedMatches.length/2, 8, 2, 1.7,'#088','#888','#ff5'));
    if (user.myOpen) matchMenu = matchMenu.concat(makeMenu(match, command, update, user.myOpen,'myOpen', 325, 325+user.myOpen.length/2, 8, 2, 1.5,'#00a0f070','#000','#aaa'));
    if (user.open) matchMenu = matchMenu.concat(makeMenu(match, command, update, user.open,'open', 325+user.myOpen.length*9, 325+user.myOpen.length*9+user.open.length/2, 8, 2, 1.5,'#ffff4488','#fff','#000'));
    if (user.ready) matchMenu = matchMenu.concat(makeMenu(match, command, update, user.ready,'ready', 325+(user.open.length+user.myOpen.length)*9, 325+(user.open.length+user.myOpen.length)*9+user.ready.length/2, 8, 2, 1.7,'#60ff6070','#000','#f9f'));
    if (user.waiting) matchMenu = matchMenu.concat(makeMenu(match, command, update, user.waiting,'wait', 325+(user.open.length+user.myOpen.length+user.ready.length)*9, 325+(user.open.length+user.myOpen.length+user.ready.length)*9+user.waiting.length/2, 8, 2, 1.7,'#ff606070','#000','#9ff'));
    if (user.finished) matchMenu = matchMenu.concat(makeMenu(match, command, update, user.finished,'done', 325+(user.open.length+user.myOpen.length+user.ready.length+user.waiting.length)*9, 325+(user.open.length+user.myOpen.length+user.ready.length+user.ready.length+user.waiting.length)*9+user.finished.length/2, 8, 2, 1.7,'#002020a0','#000','#9ff'));
    return matchMenu;
}
function userMenu(match, command, update) {
    return makeMenu(match, command, update, [['...Friends.'],['...Coaches.'],['...Conquest',''],['..Teams/. ....Tournaments.',''],['.Leagues.',''],['.Ladders.',''],['..Matches',''],['..Profile',''],['..Logout','']],'user', 99.6, 108, 8,2.7,1.4,'#8080c050');
}
function editMenu(match, command, update) {
    let editMenu = makeMenu(match, command, update, [['pawn','P'],['spear','S'],['knight','N'],['bishop','B'],['rook','R'],['queen','Q'],['archer','A'],['prince','I'],['princess','E'],['king','K']],'edit-b', -65, -65, 9, 2, 1.5,'#ff909060','#ddd','#210');
    editMenu = editMenu.concat(makeMenu(match, command, update, [['Trash','X'],["Flip","F"],['Clear','C'],['Details','D']],'edit', 30, 30, 9, 2, 1.5,'#ff909060'));
    editMenu = editMenu.concat(makeMenu(match, command, update, [['pawn','P'],['spear','S'],['knight','N'],['bishop','B'],['rook','R'],['queen','Q'],['archer','A'],['prince','I'],['princess','E'],['king','K']],'edit-w', 72, 72, 9, 2, 1.5,'#ff909060','#444','#eee'));
    return editMenu;
}
function promMenu(match, command, update) {
    return makeMenu(match, command, update, [['knight','N'],['bishop','B'],['rook','R'],['queen','Q'],['archer','A'],['prince','I'],['princess','E']],'promote', 236, 246, 8, 2.5, 1.5,'#fe6','#fff','#779');
}
function waybackMenu(match, command, update) {
    return makeMenu(match, command, update, [['From Here']],'wayback', 50, 50, 10, 2, 1.5,'#8080c090','#fff','#779');
}
function aiMenu(match, command, update) {
    let items = makeMenu(match, command, update, [['Very Easy',''],['Easy','']],'ai', 163, 166, 5, 2.3, 1.3,'#50c05060','#f00','#fff');
    items = items.concat(makeMenu(match, command, update, [['Medium',''],['Hard','']],'ai', 184, 187, 5, 2.3, 1.3,'#80a07060','#f00','#fff'));
    items = items.concat(makeMenu(match, command, update, [['Very Hard',''],['Best','']],'ai', 205, 208, 5, 2.3, 1.3,'#b0607060','#f00','#fff'));
    return items;
}

export { waybackMenu, aiMenu, promMenu, editMenu, userMenu, matchMenu, items, puzzles, tutorials, help, mainMenu, highlight, hover, leave}