import React from 'react';
import useWebSocket from 'react-use-websocket';
import $ from 'jquery';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import './App.css';
import Board from "./Board"
import Pieces from "./Pieces"
import Piece from "./Piece"
import { revMap, setLetterWidths, display, genDefs, serverUrl, socketUrl, clear, hilite, movePiece, analyse } from './res';
let onHint = 0;
let lesson = {};
const zoomed = false;
let cpuPlayer = 0;
let cpu=['CPU','cpu very easy','cpu easy','cpu moderate','cpu hard','cpu very hard','cpu master']
let timer = null;
let tutor = '';
let history = -1;
let lastReadMessage = null;
let stdGetRequest = {}; // fetch(serverUrl+'/'+data, stdGetRequest).then(response => response.json()).then(x => { if (x.status) { cmd({order:'menu', choice:'?'}); } else cmd({order:'dialog', title:'Error', text:['h2:::'+x.message]}); }).catch((error) => { cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]}) });
                        // fetch(serverUrl+'/xxx',post({data})).then(response => response.json())
                        //   .then(x => { if (x.status) { } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
                        //   .catch((e) => { cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]}); });
let boardColor = {neutral:['#555','#585','#545'],light:['#aab','#aa8','#aaa'], dark:['#011','#111','#012'], 
  white:['#eeb'], black:['#012'], felt:['#131','#444','#131','#131','#000'], table:['#000'],
  grain:[[2.9, 0.5, 0.02, 2.912, 0.505],[-2.8, 0.3, 0.025, -2.8, 0.312],[0.9, 0.4, 0.027, 0.908, 0.407],[2.7, -0.65, 0.023, 2.703, -0.651]]};

function post(data) {
  let request = {...stdGetRequest}
  request.body = JSON.stringify(data);
  request.method = "POST"
 return request;
}

function App() { // console.log('App');
  const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  let [view, zoom] = React.useState(zoomed?'14 0 72 200':'0, -4, 100, 200');
  let [mode, setMode] = React.useState('dialog');
  let [dialog, setDialog] = React.useState({order:'dialog', title:'Welcome', text:['Select a login method.'], login:true});
  let [user, loginUser] = React.useState({});
  let [idx, move] = React.useState(0);
  let [state, setBoard] = React.useState('main');
  let [drawing, scribble] = React.useState([]);
  let [flip, turn] = React.useState(false);
  let [hints, onoffHints] = React.useState(false);
  let [person, setProfile] = React.useState({});
  let [queue, updateQueue] = React.useState({message:[], friendRequest:[], friend:[]});

  const { sendMessage, lastMessage } = useWebSocket(socketUrl);
  
  const h = $(window).height();
  const w = $(window).width();
  const m = h<w?h:w;

  const alphabet = [];
  const letters = [];

  for (let i=31;i<128;i++) {
    alphabet.push(<text id={'alpha-'+i} x='20px' y='15px' fontFamily="Verdana" fontSize={10}>{String.fromCharCode(i)}</text>);
  }

  function cmd(data) { //console.log('command', data);
    switch(data.order) {
      case 'dialog': // console.log('opening dialog');
        setDialog(data)
        setMode('dialog'); 
        break; 
      case 'tutorial':
        lesson = data.lesson;
        setMode('tutor');
        turn(false);
        teach(0);
        break; 
      case 'flip': turn(!flip); break;
      case 'profile': setMode('profile', user.ID); break;
      case 'opponent': openProfile(data.id); setMode('other'); break;
      case 'zoom' : zoom(view==='0, 0, 100, 200'?'14 0 72 200':'0, 0, 100, 200'); break;
      case 'login' : loginUser(data.user); getQueues(data.user); setMode(''); break;
      case 'logout' : loginUser({}); cmd({order:'dialog', title:'Thanks for Playing', text:['h2:::Hope to see you again soon.','h4:::Any social media attention would be appreciated.','h4:::Leaving comments is my best way to help improve Chexx.']}); break;
      case 'menu' : setBoard(data.choice); break;
      case 'users' : setBoard(data.choice); break;
      case 'cpu' : cpuPlayer=data.level; setMode(''); setBoard(''); cpuMove(); break;
      case 'blitz-start' : startBlitz(data.type); break;
      case 'blitz-move' : blitzMove(data.move); break;
      case 'blitz-live' : blitzLive(); break;
      case 'live': update(user.live[data.game]); break;
      case 'rewind' : goBack(data.event); break;
      case 'befriend' : befriend(data.id); break;
      case 'resign' : resign(data.id); break;
      case 'setup' : newGame(); break;
      case 'read' : showMessage(data.id); break;
      case 'buddy' : openChat(data.id); break;
      case 'saveMatch' : saveMatch(data.match); break;
      case 'loadMatch' : loadMatch(data.id); break;
      case 'listMatches' : listMatches(); break;
      case 'accept' : previewMatch(data.id); break;
      case 'commit' : commitMove(data.move); break;
      case 'guess' : console.log('user guessed:',tutor, data.here, lesson); 
        clear();
        const ansKey = lesson.step[idx].answer;
        if (ansKey) { console.log('answer key ',ansKey);
          let check = ansKey.filter(ak=>ak[0].split(' ').includes((tutor?tutor+'~':'')+data.here));
          if (check.length===0) { // no good answers... reset
            if (!tutor[0]==='+') tutor = '';
            check = ansKey.filter(ak=>ak[0].split(' ').includes(data.here));
          }
          const sketch = [];
          if (check.length>0) { console.log('got an answer', check);
            const textAttr = check[0][2].split(',');
            let numAns = 0;
            if (check[0][3]) { // action taken
              //clear();
              let stop = false;
              for (const specs of check[0][3].split('||')) {
                if (stop) continue;
                const spec = specs.split('|');
                switch(spec[0]) {
                  case '~' : tutor = data.here; hilite([data.here],"stroke","#00f"); break;
                  case '+' : 
                  if (!tutor.includes(data.here+'+')) tutor += data.here+'+'; 
                    hilite(tutor.split('+'),"stroke","#0ff"); 
                    const d = check[0][4].split('|');
                    numAns = parseInt(d[0]); 
                    for (let wp of tutor.split('+').filter(f=>f)) {
                      const xy = revMap[wp].split('-');
                      sketch.push(<Piece key={'ans'+wp} type={'a'+d[1]} x={parseInt(xy[0])} y={parseInt(xy[1])} c='none' s={d[2]} id='ans'/>);
                    }
                    if (tutor.split('+').length<numAns+1) stop = true;
                    break;
                  case '-' : movePiece(match, null,[tutor,data.here]); tutor = ''; break; // move piece 
                  case 'mv' : movePiece(match, null,spec[1].split('~')); tutor = ''; break; // move piece 
                  case 'hl' : hilite(spec[2].split(' '),'stroke',spec[1]); break;
                  case 'cw' : match.white.pieces.push(spec[1]); break;
                  case 'cb' : match.black.pieces.push(spec[1]); break;
                  default: break;
                }
              }
            } else tutor = '';
            let space = parseInt(textAttr[1]);
            if (check[0][1] && (numAns===0 || tutor.split('+').length===numAns+1)) {
              const lines = check[0][1].split('||');
              let longest = 0;
              for (const line of lines) {
                sketch.push(<text id='critique' x={parseInt(textAttr[0])} y={space} className='noMouse' fontFamily="Verdana" fontSize={textAttr[2]} fill={textAttr[3]}>{line}</text>);
                space += parseInt(textAttr[2])
                if (line.length>longest) longest = line.length;
              }
              sketch.unshift(<rect id='ans-back' x={parseInt(textAttr[0])-2} y={parseInt(textAttr[1])-parseInt(textAttr[2])} style={{ filter: 'drop-shadow(rgba(0, 0, 0, 0.9) 0px 0px 2px)'}}
                            fill={textAttr[4]} stroke={textAttr[3]} strokeWidth={0.05} height={(lines.length+0.5)*parseInt(textAttr[2])} width={parseInt(textAttr[2])*longest*2/5+2}/>);
            }

          } else {
            tutor = '';
            const textAttr = ansKey[0][2].split(',');
            sketch.push(<rect id='ans-back' x={parseInt(textAttr[0])-2} y={parseInt(textAttr[1])-parseInt(textAttr[2])} fill={textAttr[4]}
                          strokeWidth={0.25} height={textAttr[2]*1.5} width={textAttr[2]*ansKey[0][1].length*2/5+2} style={{ filter: 'drop-shadow(rgba(0, 0, 0, 0.9) 0px 0px 2px)'}}/>);

            sketch.push(<text id='critique' x={textAttr[0]} y={textAttr[1]} className='noMouse' fontFamily="Verdana" fontSize={textAttr[2]} fill={textAttr[3]}>{ansKey[0][1]}</text>);            
          }
          scribble(sketch);
        }
      break;
      default: break;
    }
  }
  function goBack(event) { // console.log('goBack',event, match.log.length);
    const copyMatch = {id:0, name:'history', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}};
    for (const l in match.log) {
      if (l < event +1) {
        const mvs = match.log[l].split('::')[0].replace(/[+=]/,'').split(/[x~]/);
        movePiece(copyMatch, null, mvs)
      }
    }
    copyMatch.log = match.log;
    history = event===match.log.length-1?-1:event;
    if (history>-1) {
      setBoard('wayback');
      setMode('history');

    } else {
      setBoard('');
      setMode('');
      
    }
    update(copyMatch);
  }
  function cpuMove() { // console.log('cpuMove');
    if ((flip && match.log.length%2===1) || (!flip && match.log.length%2===0)) return;
    document.getElementById('think').beginElement();
    fetch(serverUrl+'/match/cpu/'+cpuPlayer, post(match)).then(response => response.json() ).then(data => {
        document.getElementById('think').endElement();
        let copyMatch = {...match};
        const board = analyse(match); 
        if (data.move === 'Checkmate') {
          copyMatch.checkmate = true;
          cpuPlayer = 0;
        } else if (data.move === 'Stalemate') {
          copyMatch.stalemate = true;
          cpuPlayer = 0;
        } else movePiece(copyMatch, board, data.move.split('~'));
        update(copyMatch);
      }
    );
  }
  function startBlitz(type) {
    sendMessage(JSON.stringify({type:'blitz', game:type, token:user.token})); 
    setBoard('');
    setMode('wait-blitz');
  }
  function abortBlitz() {
    sendMessage(JSON.stringify({type:'abort-blitz', token:user.token})); 
    setMode('');
  }
  function blitzLive() {
    fetch(serverUrl+'/match/live', stdGetRequest).then(response => response.json() ).then(data => {
      if (data.status) {
        user.live = {}
        cmd({order:'menu', choice:'live'});
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
    .catch((error) => { cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]})});
  }
  function blitzMove(move) {
    clickClock(match, false);
    sendMessage(JSON.stringify({type:'blitz-move', token:user.token, move:move})); 
  }
  function clickClock(match, my) {
    clearInterval(timer); // stop old timer
    const start = new Date().getTime()
    
    timer = setInterval(
      () => {
        const s = new Date().getTime()-start;
        const hand = $(my?'#myMoveHand':'#theirMoveHand');
        const gameHand = $(my?'#myGameHand':'#theirGameHand');
        const timeLeft = flip?my?match.black.time:match.white.time:my?match.white.time:match.black.time;
        $(!my?'#myClockFace':'#theirClockFace').attr('fill', '#555');
        if (s/1000>match.Game.move) {
          if (s/1000>match.Game.move+timeLeft) {
            sendMessage(JSON.stringify({type:'blitz-timesup', token:user.token, move:move})); 
          } else {
            const tl = timeLeft+match.Game.move-s/1000;
            $(my?'#myClockFace':'#theirClockFace').attr('fill', tl>20?'#ff0':'#f00');
            if (hand) hand.attr('transform', 'rotate(180,0,0)');
            let gTime = 360*(tl/match.Game.game);
            if (gameHand) gameHand.attr('transform', 'rotate('+(180+gTime)+',0,0)');
          }
        } else {
          $(my?'#myClockFace':'#theirClockFace').attr('fill', '#fff');
          let mTime = 360*((match.Game.move-s/1000)/match.Game.move);
          let gTime = 360*(timeLeft/match.Game.game);
          if (hand) hand.attr('transform', 'rotate('+(180+mTime)+',0,0)');
          if (gameHand) gameHand.attr('transform', 'rotate('+(180+gTime)+',0,0)');
        }
      }, 200);
  }
  function waitBlitz() {
    return (
      <div className='Full Overlay'>
        <div className='Dialog' style={{width:(4*m/5)+'px', top:(m/2)+'px', left:(m/2)+'px', backgroundColor: '#444444bb'}}>
          <div className='topper'><h2>Waiting for Opponent...</h2></div>
          <div className='bottomer'>
            <div className='group'>
              <button className='smButton' onClick={abortBlitz}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function commitMove(move) { // console.log('commit move',move,'to match id',match.ID);
    fetch(serverUrl+'/match/move/'+match.ID, post({move:move})).then(response => response.json() ).then(data => { 
      if (data.status) { 
        listMatches();
        resume();
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
    });
  }
  function loadMatch(id) {
    clear();
    setBoard('');
    history = -1;
    fetch(serverUrl+'/match/load/'+id, stdGetRequest).then(response => response.json() ).then(data => { 
      if (data.status) { 
        data.match.log = data.match.log.filter(l=>l!=='');
        if (data.white) data.match.white.player = data.white;
        if (data.black) data.match.black.player = data.black;
        if ((data.match.white.ID !== user.ID && data.match.white.ID !== 0)
          || (data.match.black.ID !== user.ID && data.match.black.ID !== 0)) setMode("match");
        else setMode('');
        turn(data.match.black.player && data.match.black.player.ID === user.ID);
        update(data.match); 
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
    });
  }
  function previewMatch(id) { //console.log('previewMatch',id);
    let open = {};
    fetch(serverUrl+'/match/load/'+id, stdGetRequest).then(response => response.json() ).then(data => { 
      if (data.status) { 
        data.match.log = data.match.log.filter(l=>l!=='');
        open = data.match;
        let oid = open.white.userid;
        if (oid===0) oid = open.black.userid;
        fetch(serverUrl+'/user/'+oid, stdGetRequest).then(response => response.json() )
          .then(data => { 
            if (data.status) { 
              let o = data.opponent;
              cmd({order:'dialog', title:'Accept Challenge?', text:['h2:::Match: '+open.name,'h4:::Opponent: '+o.fullName,'h5:::rating:'+o.rank,'h5:::You will be playing '+(open.white.userid===0?'white':'black')], yesno:true, noClose:true, openId:id});
              console.log(data['opponent']);                
            } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
          });
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
    });
  }
  function accept() {
    fetch(serverUrl+'/match/accept/'+dialog.openId, stdGetRequest).then(response => response.json() ).then(data => { 
      if (data.status) {
        cmd({order:'listMatches'});  
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
    });
  }
  function readyMatches(data) {
    user.savedMatches = data.savedMatches;
    user.open = data.open
    user.myOpen = data.myOpen
    user.ready = data.ready
    user.waiting = data.waiting
    user.victory = data.victory
    user.defeat = data.defeat
  }
  function deleteMatch() {
    fetch(serverUrl+'/match/delete/'+dialog.openId, stdGetRequest).then(response => response.json()).then(data => {
      if (data.status) {
        readyMatches(data);
        cmd({order:'menu', choice:'match'});
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
    .catch((error) => { cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]}) });
  }
  function saveMatch(match) {
    fetch(serverUrl+'/match/save',post(match)).then(response => response.json() )
      .then(data => cmd(data.status?{order:'dialog', title:'Match Saved', text:[], ok:true, noClose:true}:{order:'dialog', title:'Error', text:['h2:::'+data.message]}));
  }
  function resign(match) {
    if (mode==='blitz') {
      sendMessage(JSON.stringify({type:'resign', token:user.token})); 
      setMode('');
      // loop closed when message returned with new rating.
    }
    if (mode==='match') {
      fetch(serverUrl+'/match/resign',post(match)).then(response => response.json() )
        .then(data => cmd(data.status?{order:'dialog', title:'Match Resigned', text:['h2:::'+data.message, 'h3:::'+data.rank], ok:true, noClose:true}:{order:'dialog', title:'Error', text:['h2:::'+data.message]}));
    }
  }
  function listMatches() {
    fetch(serverUrl+'/match/list', stdGetRequest).then(response => response.json() ).then(data => {
        if (data.status) {
          readyMatches(data);
          cmd({order:'menu', choice:'match'});
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
      .catch((error) => {
        // Handle the error
        console.log(error);
        cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]})
      });
  }
  const responseFacebook = (response) => { // console.log("responseFacebook", response);
    response.id = parseInt(response.id);
    fetch(serverUrl+'/user/facebook',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(response)
    }).then(response => response.json() )
    .then(data => cmd({order:'login',user:data}));
    // setMode('profile');
  }
  const responseGoogle = (response) => { // console.log("responseGoogle", response);
    // fetch(serverUrl+'/user',{
    //   mode: 'cors',
    //   method: "POST",
    //   headers: {"Content-Type": "application/json"},
    //   body: JSON.stringify({'thisGuy':response})
    // }).then(response => response.json() )
    // .then(data => cmd({order:'login',user:data}));
    //setMode('profile');
  }
  function yes() { // console.log('yes',dialog);
    switch (dialog.title) {
      case 'New Game vs AI?': newGame(); resume(); break;
      case 'Log out?': chexxLogout(); resume(); break;
      case 'Accept Challenge?': accept(); resume(); break;
      case 'Delete Match': deleteMatch(); resume(); break;
      // case '': break;
      // case '': break;
      // case '': break;
      default: resume(); break;
    }
    
  }
  function no() { resume(); }
  function ok() {
    switch (dialog.title) {
      case 'Match Details':
        const title = document.getElementById('title').value;
        const notes = document.getElementById('notes').value;
        let copyMatch = {...match};
        if (title) copyMatch.name = title;
        if (notes) copyMatch.notes = notes;
        update(copyMatch);
        break;
      case 'Condolences': break;
      case 'Congratulations': break;
      // case '': break;
      // case '': break;
      default: break;
    }
    resume();
  }
  function press(context, button, data) { // console.log('button',button,'from',context,'with data',data);
    switch (context) {
      case 'Telegram': 
        if (button==='Ok') {
          fetch(serverUrl+'/user/message/ok/'+data, stdGetRequest).then(response => response.json())
            .then(x => { if (!x.status) cmd({order:'dialog', title:'Error', text:['h2:::'+x.message]}); })
            .catch((error) => { cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]}) });
        }
        resume();
      break;
      case 'Friend Request': 
      if (button==='Accept') friendAccept(data);
      if (button==='Deny') friendDeny(data);
        updateQueue((prev)=> { prev.friendRequest = prev.friendRequest.filter(m=>m.ID!==data); return prev; });
        resume();
    break;
      default: break;
    }
  }
  function newGame() {
    update({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
    resume();
  }
  function resume() { setMode(''); setBoard(''); history = -1; }
  function openChallenge() {
    const title = document.getElementById('title').value;
    const dpm = document.getElementById('dpm').value;
    const color = document.getElementById('color').value;
    console.log('Form',title,dpm,color);
    fetch(serverUrl+'/match/challenge',post({title:title, dpm:dpm, color:color})).then(response => response.json() ).then(data => {
        if (data.status) {
          user.savedMatches = data.matches;
          listMatches();
          resume();
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
      .catch((error) => { cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]})
      });
  } 
  function loginForm() {
    const form = [];
    form.push(<div className='subPanel'><FacebookLogin appId="1326440067839844" autoLoad={false} fields="name,email,picture" callback={responseFacebook}/></div>);
    form.push(<div className='subPanel'><GoogleLogin clientId="1326440067839844" buttonText="Login" onSuccess={responseGoogle} onFailure={responseGoogle} cookiePolicy={'single_host_origin'}/></div>);
    form.push(<div className='subPanel' id='chexxLogin'><table><tbody>
      <tr><td>Login Id:</td><td><input id='loginName' className='input' type="text" name="username" size="10" maxLength="20"/></td></tr>
      <tr><td>Password:</td><td><input id='loginPassword' className='input' type="password" name="password" size="10" maxLength="20"  onKeyPress={enterPass}/></td></tr>
      </tbody></table></div>);
    return form;
  }
  function registerForm() {
    const form = [];
    const fieldSz = 20;
    const pwSz = 5;
    form.push(<div className='subPanel' id='chexxRegistration'><table><tbody>
      <tr><td>Full Name:</td><td colSpan={5}><input id='fullName' className='input' type="text" name="fullname" size={fieldSz} maxLength="40"/></td></tr>
      <tr><td>User Name:</td><td colSpan={5}><input id='loginName' className='input' type="text" name="username" size={fieldSz} maxLength="40"/></td></tr>
      <tr><td>Password:</td><td colSpan={2}><input id='loginPassword' className='input' type="password" name="password" size={pwSz} maxLength="40"/></td>
      <td>Confirm:</td><td colSpan={2}><input id='confirmPassword' className='input' type="password" name="password" size={pwSz} maxLength="40"/></td></tr>
      <tr><td>Email:</td><td colSpan={5}><input id='email' className='input' type="text" name="email" size={fieldSz} maxLength="80"/></td></tr>
      <tr><td id='registrationError' colSpan={6}></td></tr>
      
      </tbody></table></div>);
    return form;

  }
  function showDialog(dialog) { //console.log('dialog', dialog);
    return (
      <div className='Full Overlay'>
        <div className='Dialog' >
          <div className='topper'><h2>{dialog.title}</h2></div>
          { dialog.text && textOut(dialog.text) }
          { dialog.login && loginForm() }
          { dialog.register && registerForm() }
          { dialog.challenge && <div className='group'>
            <table><tbody>
              <tr><td><h1>Title:</h1></td><td colSpan={3}><input id="title" type="text" className='input' name="title" size="20" maxlength="120" defaultValue="Chexx Battle"/></td></tr>
              <tr>{tdr('Game Type:')}<td><select id='dpm' name="dpm"><option value="2">2 days per move</option><option value="3">3 days per move</option><option value="5">5 days per move</option><option value="10">10 days per move</option><option value="14+1dpm">14 days + 1 day per move</option><option value="21+2dpm">21 days + 2 days per move</option><option value="30+1dpm">30 days + 1 day per move</option></select></td>{tdr('Play as (color):')}<td><select id='color' name="color"><option value="2" selected="">random color</option><option value="1">white</option><option value="0">black</option></select></td></tr>
            </tbody></table>
          </div> }
          { dialog.details && <div className='group'>
            <table><tbody>
              <tr><td>Title:</td><td colSpan={3}><input id="title" type="text" className='input' name="title" size="30" maxlength="120" defaultValue={match.name}/></td></tr>
              <tr><td>created</td><td>{match.CreatedAt}</td><td>updated</td><td>{match.UpdatedAt}</td></tr>
              <tr><td colSpan={4}>notes</td></tr>
              <tr><td colSpan={4}><textarea id="notes" className='subInput' cols="40" rows="5" defaultValue={match.notes}></textarea></td></tr>
            </tbody></table>
          </div> }
          { h<=w*1.5 && <div className='bottomer'>
            <div className='group'>
              { dialog.challenge && <button className='smButton' onClick={openChallenge}>Post Game</button>}
              { dialog.yesno && <div className='group'><button className='smButton' onClick={yes}>Yes</button><button className='smButton' onClick={no}>No</button></div> }
              { dialog.ok && <button id='ok' className='smButton' onClick={ok}>OK</button> }
              { dialog.login && <button className='smButton' onClick={chexxLogin}>Login</button> }
              { dialog.login && <button className='smButton' onClick={()=> cmd({order:'dialog', register:true, title:'Register', text:['h2:::Kindly fill out the following form to experience the rich experience of Chexx.']})}>Register</button> }
              { dialog.login && <button className='smButton' onClick={chexxLogin}>Email Password Link</button> }
              { dialog.register && <button className='smButton' onClick={chexxRegister}>Submit</button> }
              { !dialog.noClose && <button className='smButton' onClick={resume}>Close</button> }
              { dialog.button && dialog.button.map((b, idx)=> <button id={b} className='smButton' onClick={()=>press(dialog.title, b, dialog.id)}>{b}</button>)}
            </div>
          </div> }
        </div>
        { h>w*1.5 && <div className='footer'>
            <div className='group'>
              { dialog.challenge && <button className='lgButton' onClick={openChallenge}>Post Game</button>}
              { dialog.yesno && <div className='lgButton'><button className='button' onClick={yes}>Yes</button><button className='button' onClick={no}>No</button></div> }
              { dialog.ok && <button className='lgButton' onClick={ok}>OK</button> }
              { dialog.login && <button className='lgButton' onClick={chexxLogin}>Login</button> }
              { dialog.login && <button className='lgButton' onClick={()=> cmd({order:'dialog', register:true, title:'Register', text:['h2:::Kindly fill out the following form to experience the rich experience of Chexx.']})}>Register</button> }
              { dialog.login && <button className='lgButton' onClick={chexxLogin}>Email Password Link</button> }
              { dialog.register && <button className='lgButton' onClick={chexxRegister}>Submit</button> }
              { !dialog.noClose && <button className='lgButton' onClick={resume}>Close</button> }
              { dialog.button && dialog.button.map((b, idx)=> <button className='lgButton' onClick={()=>press(dialog.title, b, dialog.id)}>{b}</button>)}

            </div></div> }
      </div>
    );
  }
  function getQueues(user) {
    fetch(serverUrl+'/user/queues', stdGetRequest).then(response => response.json() ).then(data => {
      if (!data.status)cmd({order:'dialog', title:'Problem', text:['h2:::Queue data unavailable.']});
      else updateQueue((prev)=> {return {message:data.messages, friendRequest:data.requests, friend:user.friend}});
    });
  }
  function enterPass(key) { if (key.charCode === 13) chexxLogin(); }
  function chexxLogin() { // console.log('chexxLogin');
    const user = {userid:document.getElementById('loginName').value, password:document.getElementById('loginPassword').value};
    if (user.userid && user.password) {
      fetch(serverUrl+'/user/login',post(user)).then(response => response.json()).then(data => {
        stdGetRequest = { mode: 'cors', method: "GET", headers: {"Content-Type": "application/json", "Authorization": data.user.token} };
        if (data.user.property.board) boardColor = JSON.parse(data.user.property.board);
        if (!boardColor.white) boardColor.white=['#012'];
        if (!boardColor.black) boardColor.black=['#0e0'];
        if (!boardColor.felt) boardColor.felt=['#131','#444','#131','#131','#000'];
        if (!boardColor.table) boardColor.table=['#000'];
        if (!boardColor.neutral) boardColor.neutral=['#555','#585','#545'];
        if (!boardColor.light) boardColor.light=['#aab','#aa8','#aaa'];
        if (!boardColor.dark) boardColor.dark=['#011','#111','#012'];
        if (!boardColor.grain) boardColor.grain=grain(); //[[2.9, 0.5, 0.02, 2.912, 0.505],[-2.8, 0.3, 0.025, -2.8, 0.312],[0.9, 0.4, 0.027, 0.908, 0.407],[2.7, -0.65, 0.023, 2.703, -0.651]];


        cmd(data.status?{order:'login',user:data.user}:{order:'dialog', title:'Not Authorized', text:['h2:::Please check you login credentials and try again.']});
        sendMessage(JSON.stringify({type:'login', token:data.user.token})); 
      });
    } else { // highlight error
      document.getElementById('chexxLogin').style.border='2px solid #f00';
    }
  }
  function grain() {
    const grain = [];
    for (let i=0;i<4;i+=1) {
      const x = 3-Math.random()*6;
      const y = 3-Math.random()*6;
      grain.push([x, y, 0.02+Math.random()/50, x+0.01-Math.random()/150, y+0.01-Math.random()/150]);
    }
    console.log('grain',grain);
    return grain;
  }
  function chexxLogout() {
    fetch(serverUrl+'/user/logout',post({token:user.token})).then(response => response.json() )
    .then(data => cmd(data.status?{order:'logout'}:{order:'dialog', title:'Error', text:['h2:::'+data.message], ok:true}))
    .catch((error) => {
      // Handle the error
      console.log(error);
      cmd({order:'dialog',title:'Error', text:['h3:::Syntax error.']})
    });
  }
  function chexxRegister() { // console.log('chexxRegister');
    function warn(m) { const e = document.getElementById('registrationError'); e.style.border='2px solid #f00'; e.innerHTML=m; }
    const user = {
      userid:document.getElementById('loginName').value, 
      fullName:document.getElementById('fullName').value, 
      password:document.getElementById('loginPassword').value, 
      confirm:document.getElementById('confirmPassword').value, 
      email:document.getElementById('email').value};

      if (!user.userid) warn('<h4>No Username</h4>');
      else if (!user.fullName) warn('<h4>No Full Name</h4>');
      else if (!user.password) warn('<h4>No Password</h4>');
      else if (user.password.length<6) warn('<h4>Password too small</h4>');
      else if (!user.email) warn('<h4>No Email</h4>');
      else if (user.email.split('@').length!==2 || user.email.split('@')[1].split('.').length===1) warn('<h4>Invalid Email</h4>');
      else if (user.confirm !== user.password) warn('<h4>Passwords dont match.</h4>');
      else {
        fetch(serverUrl+'/user/register',{ mode: 'cors', method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(user)
        }).then(response => response.json() )
        .then(data => cmd(data.status?{order:'login',user:data.user}:{order:'dialog', title:'Error', text:['h2:::'+data.message], ok:true})); //cmd({order:'login',user:data}));
      }
  }
  function hint() {
    const sketch = [];
    const h = lesson.step[idx].hint[onHint].split('||');
    const hAttr = h[1].split(',');
    sketch.push(<text id='critique' x={hAttr[0]} y={hAttr[1]} className='noMouse' fontFamily="Verdana" fontSize={hAttr[2]} fill={hAttr[3]} style={{filter: 'drop-shadow('+hAttr[4]+' 1px 1px 2px)'}}>{h[0]}</text>);
    scribble(sketch);
    onHint += 1;
  }  
  function textOut(dat) { // console.log('textOut', dat);
    const text=[];
    let index = 0;
    for (const line of dat) {
      const s = line.split(':::');
      if (s.length===1) text.push(<h3 key={'step'+index++}>{s[0]}</h3>);
      else switch(s[0]) {
        case 'p': text.push(<p key={'step'+index++}>{s[1]}</p>); break;
        case 'h1': text.push(<h1 key={'step'+index++}>{s[1]}</h1>); break;
        case 'h2': text.push(<h2 key={'step'+index++}>{s[1]}</h2>); break;
        case 'h3': text.push(<h3 key={'step'+index++}>{s[1]}</h3>); break;
        case 'h4': text.push(<h4 key={'step'+index++}>{s[1]}</h4>); break;
        case 'h5': text.push(<h5 key={'step'+index++}>{s[1]}</h5>); break;
        case 'h6': text.push(<h6 key={'step'+index++}>{s[1]}</h6>); break;
        default: break;
      }
    }
    return text;
  }
  function tdr(txt) { return <td className='right'>{textOut([txt])}</td>; }
  function tdl(txt) { return <td className='left'>{textOut([txt])}</td>; }
  function welcome() { }
  function openProfile(id) { fetch(serverUrl+'/user/'+id, stdGetRequest).then(response=>response.json() ).then(data=>setProfile(data.opponent)); }
  function myProfile() { // console.log("profile",user);
    function makeHexColors(color, num) {
      let colors = [];
      for (let i=0;i<num;i++) {
        colors.push(<td><input type='color' id={color+'-'+i} name={color+'-'+i} defaultValue={boardColor[color][i]}/></td>);
      }
      return colors;
    }
    function ratings(user) {
      const ranks = JSON.parse(user.rank)
      console.log(ranks);
      const r = [];
      $.each(ranks, function(k,v){ 
        r.push(<tr>{tdr('h4:::'+k)}{tdl('h4:::'+v)}</tr>);
      });
      return r;
    }
    // tdr('h3:::Rank:')}{tdl('h2:::'+user.rank)
    const table = [<table><tbody>
      <tr><td colSpan={2}><img src={serverUrl+'/pub/smiley.png'} alt="Smiley face" width="80" height="120" style={{border:'5px solid black'}}/></td></tr>
      <tr>{tdr('h3:::User Name:')}{tdl('h2:::'+user.userid)}{tdr('h3:::Email:')}{tdl('h2:::'+user.email)}</tr>
      <tr><td colSpan={2}><div style={{'border':'2px solid black','margin':'auto', 'height':'100px', 'overflow-y':'scroll'}}>
          <table>{ratings(user)}</table>
          </div></td>{tdr('h3:::Account:')}{tdl('h2:::silver')}</tr>
      <tr>{tdr('h3:::History:')}{tdl('-------')}{tdr('h3:::About:')}{tdl('xxxxxx')}</tr>
      <tr></tr>
      <tr><td colSpan={6}>
        <div style={{'border':'2px solid black','margin':'auto', 'height':'100px', 'overflow-y':'scroll'}}>
          <table>
            <tr>{tdr('h3:::Show Hints')}<td><input type="checkbox" id="showHints" className='left'tname="showHints" checked={hints} onChange={()=>{onoffHints(!hints)}}/></td></tr>
            <tr>{tdr('h3:::Show Moves')}<td><input type="checkbox" id="showMoves" className='left'tname="showMoves" checked={hints} onChange={()=>{onoffHints(!hints)}}/></td></tr>
            <tr>{tdr('h3:::Show Notation')}<td><input type="checkbox" id="showNotation" className='left'tname="showNotation" checked={hints} onChange={()=>{onoffHints(!hints)}}/></td></tr>
          </table>
          </div>
      </td></tr>
      <tr><td colSpan={2} rowSpan={2}>
        <table style={{'border':'2px solid black','margin':'auto'}}>
          <caption>Board Colors</caption>
          { <tr><td>light</td>{makeHexColors('light',2)}</tr> }
          { <tr><td>neutral</td>{makeHexColors('neutral',2)}</tr> }
          { <tr><td>dark</td>{makeHexColors('dark',2)}</tr> }
        </table>
        <table style={{'border':'2px solid black','margin':'auto'}}>
          <caption>Chexx Set Options</caption>
          { <tr><td>White</td><td><input type='color' id='whitePiece' name='whitePiece' defaultValue={boardColor['white'][0]}/></td></tr> }
          { <tr><td>Black</td><td><input type='color' id='blackPiece' name='blackPiece' defaultValue={boardColor['black'][0]}/></td></tr> }
          <tr><td>Set:</td><td><select id='set' name="set"><option value="default">default</option><option value="minimal">minimalistic</option></select></td></tr>
        </table>
      </td>
        <td colSpan={2} rowSpan={2}>
          <table style={{'border':'2px solid black','margin':'auto'}}>
            <caption>Table Colors</caption>
            { <tr><td>
              <input type='color' id='feltA' name='feltA' defaultValue={boardColor['felt'][0]}/>
              <input type='color' id='feltB' name='feltB' defaultValue={boardColor['felt'][1]}/>
              <input type='color' id='feltC' name='feltC' defaultValue={boardColor['felt'][2]}/>
              <input type='color' id='feltD' name='feltD' defaultValue={boardColor['felt'][3]}/>
              <input type='color' id='feltE' name='feltE' defaultValue={boardColor['felt'][4]}/>
              </td></tr> }
            { <tr><td><svg viewBox='48 48 4 4' xmlns="http://www.w3.org/2000/svg"><defs> { genDefs(boardColor) }
            </defs><circle fill="url(#feltPattern1)" cx="50" cy="50" r="2"/>
            <circle fill="url(#feltPattern2)" cx="50" cy="50" r="2" opacity={0.5}/>
            <circle fill="url(#feltPattern3)" cx="50" cy="50" r="2" opacity={0.25}/>
            <circle fill="url(#feltPattern4)" cx="50" cy="50" r="2" opacity={0.125}/></svg></td></tr> }
          </table></td>
      </tr>
      <tr></tr>
    </tbody></table>];
    return (
      <div className='Full Overlay'>
        <div className='Dialog' style={{width:(4*m/5)+'px', top:(m/2)+'px', left:(m/2)+'px', backgroundColor: '#444444bb'}}>
          <div className='topper'><h2>{'Welcome, '+user.fullName}</h2></div>
          
          {textOut(["h5:::This is your public profile..."])}
          {table}
          <div className='bottomer'>
            <div className='group'>
              <button className='smButton' onClick={resume}>Close</button>
              <button className='smButton' onClick={storeProfile}>Save</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function profile(user) { //console.log("profile",user);
    const table = [<table><tbody>
      <tr><td colSpan={2}><img src={serverUrl+'/pub/smiley.png'} alt="Smiley face" width="80" height="120" style={{border:'5px solid black'}}/></td></tr>
      <tr>{tdr('h3:::User Name:')}{tdl('h2:::'+user.userid)}{tdr('h3:::Rank:')}{tdl('h2:::'+user.rank)}{tdr('h3:::Account:')}{tdl('h2:::silver')}</tr>
      <tr>{tdr('h3:::Rank:')}{tdl('h2:::'+user.rank)}{tdr('h3:::Account:')}{tdl('h2:::silver')}</tr>
      <tr>{tdr('h3:::About:')}{tdl('xxxxxx')}</tr>
      <tr><td>*</td><td>*</td><td colSpan={2}>Message</td><td>*</td><td>*</td></tr>
      <tr><td></td><td colSpan={4}><input id="message" type="text" className='input' name="message" size="20" maxLength="255" defaultValue="Hello..."/></td> </tr>
      <tr></tr>
    </tbody></table>];
    return (
      <div className='Full Overlay'>
        <div className='Dialog' style={{width:(4*m/5)+'px', top:(m/2)+'px', left:(m/2)+'px', backgroundColor: '#444444bb'}}>
          <div className='topper'><h2>{user.fullName}</h2></div>
          {table}
          <div className='bottomer'>
            <div className='group'>
              <button className='smButton' onClick={resume}>Close</button>
              <button className='smButton' onClick={()=>{message("emoji","Wave","",user.userid);}}>Wave</button>
              <button className='smButton' onClick={()=>{message("emoji","Hi 5","",user.userid);}}>Hi 5</button>
              <button className='smButton' onClick={()=>{message("text",document.getElementById('message').value,"",user.userid); document.getElementById('message').value='';}}>Send</button>
              <button className='smButton' onClick={()=>{friendRequest(user.userid);}}>Friend Request</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function friendRequest(id, message) { fetch(serverUrl+'/user/friendRequest', post({userid:id, message:message})).then(response=>response.json()).then(data => { if (!data.status) cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]})});
  }
  function befriend(id) { console.log('befriend',id);
    for (const m of queue.friendRequest) {
      if (m.ID === id) {
        cmd({order:'dialog', title:'Friend Request', text:['h3:::from: '+m.from, 'h2:::'+m.text], noClose:true, button:['Accept', 'Deny'], id:m.ID})
  } } }
  function friendAccept(id) { console.log('friend accept',id);
    const invite = {requestId:id}
    fetch(serverUrl+'/user/friendAccept', post(invite)).then(response => response.json() )
      .then(data => { if (!data.status) cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
                      else { // add friend to friend list
                        updateQueue((prev)=> { prev.friend.push(data.friend); return prev; } );
                      }
          });
  }
  function friendDeny(id) {
    const reject = {requestId:id}
    fetch(serverUrl+'/user/friendReject',post(reject)).then(response => response.json() )
      .then(data => { if (!data.status) cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); });
  }
  function openChat(id) { //console.log('openChat',id);
    let bud=-1;
    for (const i in user.friend) {
      //console.log(i,user.friend[i]);
      if (user.friend[i].ID===id) bud=i;
    }
    if (bud > -1) {
        setProfile(user.friend[bud]);
        setMode('chat');
  } }
  function chat(e, bud) {
    if (e.charCode === 13) {
      message("chat","****",$('#chat').val(), bud.userid);
      if ($('#chatArea li:last-child').hasClass('talk')) $('#chatArea li:last-child').append("<p>"+$('#chat').val()+"</p>");
      else $('#chatArea').append("<li class='talk'><p>"+$('#chat').val()+"</p></li>");
      $('#chat').val('');
      $('#chatArea').scrollTop(99999);
    }
  }
  function hear(incoming) { // console.log('hear!',incoming);
    if (!$('#chatArea').length) {
      const copyQ = {...queue};
      let isFriend = false;
      for (const f in copyQ.friend) { 
        if (copyQ.friend[f].userid===incoming.userid) {
          if (!copyQ.friend[f].incoming) copyQ.friend[f].incoming = [];
          copyQ.friend[f].incoming.push(incoming.text); 
          isFriend = true;
        }
      }
      if (!isFriend) copyQ.message.push(incoming);
      updateQueue(copyQ);
      return false;
    }
    if ($('#chatArea li:last-child').hasClass('listen')) $('#chatArea li:last-child').append("<p>"+incoming.text+"</p>");
    else $('#chatArea').append("<li class='listen'><p>"+incoming.text+"</p></li>");
    $('#chatArea').scrollTop(99999);
    return true;
  }
  function showChat(bud) { //console.log('showChat',bud);
    //sendMessage(JSON.stringify({type:'chat', game:type, token:user.token})); 
    const backlog = [];
    if (bud.incoming) for (const m of bud.incoming) backlog.push(<p>{m}</p>);
    const table = [<table><tbody>
      <tr><td colSpan={4}><ul id='chatArea' style={{'height':'16em','overflow':'auto', 'listStyle':'none'}}><li className='listen'>{backlog}</li></ul></td></tr>
      <tr><td colSpan={4}><input id="chat" type="text" className='input' name="message" size="20" maxLength="255" onKeyPress={(e)=>chat(e,bud)}/></td> </tr>
      <tr></tr>
    </tbody></table>];
    return (
      <div className='Full Overlay'>
        <div className='Dialog' style={{width:(4*m/5)+'px', top:(m/2)+'px', left:(m/2)+'px', backgroundColor: '#444444bb'}}>
          <div className='topper'><h2>{bud.name}</h2></div>
          {table}
          <div className='bottomer'>
            <div className='group'>
              <button className='smButton' onClick={resume}>Close</button>
              <button className='smButton' onClick={()=>{message("emoji","Wave","",bud.userid);}}>Wave</button>
              <button className='smButton' onClick={()=>{message("emoji","Hi 5","",bud.userid);}}>Hi 5</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function message(meta, topic, text, id) { fetch(serverUrl+'/user/message',post({meta:meta, topic:topic, body:text, recipient:id})).then(response=>response.json()).then(data => { if (!data.status) cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]})});}
  function showMessage(id) {
    for (const m of queue.message) {
      if (m.ID === id) {
        cmd({order:'dialog', title:'Telegram', text:['h3:::from: '+m.from, 'h2:::'+m.topic, m.text], noClose:true, button:['Reply', 'Save', 'Ok'], id:m.ID})
  } } 
  updateQueue((prev)=> { prev.message = prev.message.filter(m=>m.ID!==id); return prev; });
}
  function storeProfile() {
    boardColor = {neutral:[],light:[], dark:[], white:[], black:[], table:[], felt:[]};
    for (let i=0;i<2;i++) {
      const l = $('#light-'+i).val();
      const n = $('#neutral-'+i).val();
      const d = $('#dark-'+i).val();
      boardColor['light'].push(l);
      boardColor['neutral'].push(n);
      boardColor['dark'].push(d);
    }
    boardColor['white'].push($('#whitePiece').val());
    boardColor['black'].push($('#blackPiece').val());
    boardColor['felt'].push($('#feltA').val());
    boardColor['felt'].push($('#feltB').val());
    boardColor['felt'].push($('#feltC').val());
    boardColor['felt'].push($('#feltD').val());
    boardColor['felt'].push($('#feltE').val());
    //boardColor['table'].push($('#table').val());
    boardColor.table=['#000'];
    boardColor.grain=grain();
    user.property = {hints:hints?'true':'false', board:JSON.stringify(boardColor)};
    fetch(serverUrl+'/user/save',post(user)).then(response => response.json() )
      .then(data => cmd(data.status?{order:'dialog', title:'Profile Saved', text:[], ok:true, noClose:true}:{order:'dialog', title:'Error', text:['h2:::'+data.message]}));
  }
  function teacher(lines) { // console.log('teacher', idx,lesson);
    boardColor = {neutral:['#444','#333','#545'],light:['#887','#878','#777'], dark:['#011','#111','#012'], 
      white:['#eeb'], black:['#012'], felt:['#111','#222','#131','#202','#000'], table:['#000'],
      grain:[[2.9, 0.5, 0.02, 2.912, 0.505],[-2.8, 0.3, 0.025, -2.8, 0.312],[0.9, 0.4, 0.027, 0.908, 0.407],[2.7, -0.65, 0.023, 2.703, -0.651]]};
    const step = lesson.step[idx];
    const h = $(window).height();
    const w = $(window).width();
    const m = h<w?h:w;
    const top = m*step.posY/100
    return (
      <div className='Full' style={{pointerEvents: 'none'}}>
        <div id='Tutor' style={{width:step.width+'vw', top:top, left:step.posX+'%', backgroundColor: step.background}}>
          {step.title && <div className='topper'><h2>{step.title}</h2></div>}
          {textOut(lesson.step[idx].text)}
          
        { h<=w*1.5 && <div className='bottomer'>
          <div className='group'>
            { idx > 0 && <button className='smButton' onClick={()=>teach(idx>0?idx-1:0)}>Prev</button> }
            <button className='smButton' onClick={resume}>Close</button>
            <button className='smButton' onClick={()=>teach(idx)}>Reset</button>
            { idx < lesson.step.length-1 && <button className='smButton' onClick={()=>teach(idx+1)}>Next</button> }
            { lesson.step[idx].hint && onHint < lesson.step[idx].hint.length && <button className='smButton' onClick={()=>hint()}>?</button>}
          </div></div> }
        
          </div>
        { h>w*1.5 && <div className='footer'>
            <div className='group'>
              { idx > 0 && <button className='lgButton' onClick={()=>teach(idx>0?idx-1:0)}>Prev</button> }
              <button className='lgButton' onClick={resume}>Close</button>
              <button className='lgButton' onClick={()=>teach(idx)}>Reset</button>
              { idx < lesson.step.length-1 && <button className='lgButton' onClick={()=>teach(idx+1)}>Next</button> }
              { lesson.step[idx].hint && onHint < lesson.step[idx].hint.length && <button className='lgButton' onClick={()=>hint()}>?</button>}
            </div></div> }
      </div>
    );
  }
  function teach(num) { console.log('teach', lesson.step[num]);
    scribble([]);
    if (num > lesson.step.length-1) return;
    onHint = 0;
    tutor = '';
    const copy = {...match};
    const step = lesson.step[num];
    if (step.audio) {
      let audio = new Audio('tutor/'+step.audio+'.mp3');
      audio.load();
      audio.muted = false;
      audio.play();
    }
    if (step.white) copy.white.pieces = [...step.white];
    if (step.black) copy.black.pieces = [...step.black];
    if (step.log) copy.log = step.log;
    move(num)
    copy.name='tutor'+(step.title?':'+step.title:'');
    update(copy);
    clear();
    const sketch = [];
    if (step.hilite) for (const h of step.hilite) hilite(h[0].split(' '), h[1], h[2]);
    if (step.order) for (const o of step.order) {
      const oo = o.split(' ');
      switch(oo[0]) {
        case 'menu' : setBoard(oo[1]); break;
        case 'draw' :
          switch(oo[1]){
            case 'circle': 
              const ooo = oo[2].split(',');
              sketch.push(<circle fill="#00000000" cx={ooo[0]} cy={ooo[1]} r={ooo[2]} stroke={ooo[3]} strokeWidth={1}/>); 
              break;
            default: break;
          } 
          break;
        case 'P': case 'S': case 'N': case 'B': case 'R': case 'A': case 'I': case 'E': case 'Q': case 'K':
          const xy = revMap[oo[1]].split('-');
          sketch.push(<Piece key={'tut-'+oo[0]} type={'?'+oo[0]} x={parseInt(xy[0])} y={parseInt(xy[1])} c='none' s={oo[2]} id='tut'/>);
          break;  
        default: break;
      }
    }
    scribble(sketch);
  }

  // document.addEventListener('keydown', function(event){
	// 	console.log(`Key: ${event.key} with keycode ${event.keyCode} has been pressed`);
  //   if (event.keyCode===13) { console.log('success');
  //     $('#Ok').trigger();
  //   }
  // });

  React.useEffect(() => { // console.log('App useEffect#1:',state, mode, user, cpuPlayer);
    if (lastMessage !== null && lastMessage !== lastReadMessage) {
      lastReadMessage = lastMessage;
      const message = JSON.parse(lastMessage.data);
      console.log('new message:',message);
      const copyQ = {...queue};
      const copyU = {...user};
      switch(message.type) {
        case 'notify':
          hilite(['wait-'+message.match],'fill',message.state==='Checkmate'?'#000000a0':message.state==='Stalemate'?'#999999a0':'#00ff00b0', false);
          hilite(['txt-wait-'+message.match],'fill',message.state==='Checkmate'?'#d0d0f0e0':message.state==='Stalemate'?'#000000ff':'#ffaaffb0', false);
          break;
        case 'message':
          const mm = message.message;
          if (mm.meta && mm.meta==="FriendRequest") {
            if (!queue.friendRequest[queue.friendRequest.length-1] || queue.friendRequest[queue.friendRequest.length-1].ID !== mm.ID) {
              copyQ.friendRequest.push(mm);
              updateQueue(copyQ);
            } //updateQueue((prev)=> { prev.friendRequest.push(mm); return prev; } );
          } else if (mm.meta && mm.meta==="chat") { // console.log('incoming chat',mm, person);
            hear(mm);
            // if (person.userid===mm.userid) hear(mm);
            // else updateQueue((prev)=> { prev.message.push(mm); return prev; } );
          } else if (!queue.message[queue.message.length-1] || queue.message[queue.message.length-1].ID !== mm.ID){
            copyQ.message.push(mm);
            updateQueue(copyQ);
          } //updateQueue((prev)=> { prev.message.push(mm); return prev; } );
          break;
        case 'blitz': // console.log('user',user); console.log('message',message);
          message.match.log = message.match.log.filter(l=>l!=='');
          if (message.white) message.match.white.player = message.white;
          if (message.black) message.match.black.player = message.black;
          turn(message.match.black.userid === user.ID);
          update(message.match);
          setMode('blitz');
          clickClock(message.match, message.match.log.length%2===0?message.match.black.userid !== user.ID:message.match.black.userid === user.ID);
          break;
        case 'view': if (!copyU.live) copyU.live = {}; copyU.live[message.match.name]=message.match; loginUser(copyU); break;
        case 'win':
          clearInterval(timer); 
          cmd({order:'dialog', title:'Congratulations', text:['h2:::You won!','h3:::'+message.info,'h3::: Your new rating is: '+message.rating], ok:true, noClose:true});
          break;
        case 'loss':
          clearInterval(timer); 
          cmd({order:'dialog', title:'Condolences', text:['h2:::You lost!','h3:::'+message.info,'h3::: Your new rating is: '+message.rating], ok:true, noClose:true});
        break;
        case 'online': for (const f in copyQ.friend) { if (copyQ.friend[f].userid===message.friend) copyQ.friend[f].online=true; } updateQueue(copyQ); break;
        case 'offline': for (const f in copyQ.friend) { if (copyQ.friend[f].userid===message.friend) copyQ.friend[f].online=false; } updateQueue(copyQ); break;
        default: break;
      }
    }
  }, [lastMessage, person.userid, user])
  React.useEffect(() => { // console.log('App useEffect#2:',state, mode, user, cpuPlayer);
    if (letters.length===0) {
      for(let i=31;i<128;i++) {
        const l = document.getElementById('alpha-'+i);
        letters.push([l.getComputedTextLength(), l.width]);
      }
      setLetterWidths(letters);
    }
    if (cpuPlayer>0) cpuMove();
    else {
      const e = document.getElementById('think');
      if (e) { // console.log('stopping cpu');
        e.endElement();
      }
    }  
    if (user) {
      if (user.property) {
        if (user.property.hints === 'true') {
          let sketch = [];
          switch(state+':'+mode) { // M -35,0 A 35,35 0 0 0 0,35 35,35 0 0 0 35,0 35,35 0 0 0 0,-35 35,35 0 0 0 -35,0 Z // M 40,0 A 40,40 0 0 1 0,40 40,40 0 0 1 -40,0 40,40 0 0 1 0,-40 40,40 0 0 1 40,0 Z
            case 'match:': 
            sketch = display([["Current Matches", 40, 302, '#f40', 7],["Saved Games", 40, 212, '#f40', 7]])
              // sketch.push(<defs><path id="hintPath1" transform={'translate(50,50) rotate(220,0,0)'} d="M -42,0 A 42,42 0 0 0 0,42 42,42 0 0 0 42,0 42,42 0 0 0 0,-42 42,42 0 0 0 -42,0 Z"></path></defs>); 
              // sketch.push(<defs><path id="hintPath2" transform={'translate(50,50) rotate(215,0,0)'} d="M 38,0 A 38,38 0 0 1 0,38 38,38 0 0 1 -38,0 38,38 0 0 1 0,-38 38,38 0 0 1 38,0 Z"></path></defs>); 
              // sketch.push(<text className='noMouse' fontFamily='Verdana' fontSize={7} fill='#ff9'><textPath href="#hintPath1">Current Matches</textPath></text>);
              // sketch.push(<text className='noMouse' fontFamily='Verdana' fontSize={7} fill='#ff9'><textPath href="#hintPath2">Saved Games</textPath></text>);
              break;
            default: break;
          }
          scribble(sketch);
        }
        onoffHints(user.property.hints === 'true')
      }
    }
  }, [state, mode, user, match]);

  return (
    <div className="App Full">
      <Board color={boardColor} user={user} match={match} menu={state} update={update} view={view} command={cmd} flip={flip} mode={mode} history={history} queue={queue} cpu={cpu[cpuPlayer]}/>
      { (mode === 'history' || mode === '' || mode === 'tutor' || mode === 'match' || mode === 'blitz') &&  <Pieces white={match.white.pieces} black={match.black.pieces} light={flip?boardColor.black:boardColor.white} dark={flip?boardColor.white:boardColor.black} view={view} flip={flip}/>}
      { mode === 'dialog' && showDialog(dialog) }
      { mode === 'tutor' && teacher() }
      { mode === 'profile' && myProfile() }
      { mode === 'other' && profile(person) }
      { mode === 'chat' && showChat(person) }
      { mode === 'welcome' && welcome() }
      { mode === 'wait-blitz' && waitBlitz() }

      { drawing && <div className="Overlay Full"><svg viewBox={view} xmlns="http://www.w3.org/2000/svg"> { drawing } </svg></div> }
    
      {letters.length===0 && <svg viewBox={view} xmlns="http://www.w3.org/2000/svg">{alphabet} </svg> }
    </div>
  );
}

export default App;
