import React from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import $ from 'jquery';
// import ReactDOM from 'react-dom';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import './App.css';
import Board from "./Board"
import Pieces from "./Pieces"
import { serverUrl, socketUrl, clear, hilite, movePiece, analyse } from './res';

let onHint = 0;
let lesson = {};
const zoomed = false;
let tutor = '';
let history = -1;

function App() { // console.log('App');
  const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  // const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Nd53', 'Na3', 'Bc53', 'Kc44', 'Pd33', 'Pd21', 'Pc22', 'Pa11', 'Sd32', 'Sd2', 'Sc32', 'Ac43'], time:300}, black:{pieces:['Nf55', 'Bf54', 'Ka41', 'Pf31', 'Pf22', 'Pa21', 'Sf32', 'Sa2', 'Sa32', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  //const [match, update] = React.useState({id:0, name:'test', white:{pieces:['Kc44', 'Pc2','Sc32', 'Pc22','Pc3', 'Pc4'], time:300}, black:{pieces:['Ka41'], time:300}, log:[], type:{game:300, move:15}});

  let [view, zoom] = React.useState(zoomed?'14 0 72 200':'0, -8, 100, 200');
  let [mode, setMode] = React.useState('offline');
  let [dialog, setDialog] = React.useState({});
  let [user, loginUser] = React.useState({});
  let [idx, move] = React.useState(0);
  let [state, setBoard] = React.useState('main');
  let [drawing, scribble] = React.useState([]);
  let [flip, turn] = React.useState(false);
  let [hints, onoffHints] = React.useState(false);
  const [messageHistory, setMessageHistory] = React.useState([]);

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];
  
  const handleClickSendMessage = React.useCallback(() => {
    console.log('handleClickSendMessage');
    return sendMessage(JSON.stringify({type:'ping', token:user.token, Epoc:666, message:'hello'}));
  }, [sendMessage, user.token]);

  const h = $(window).height();
  const w = $(window).width();
  const m = h<w?h:w;


  
  function cmd(data) { console.log('command', data);
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
      case 'flip': turn(!flip); handleClickSendMessage(); break;
      case 'profile': setMode('profile'); break;
      case 'zoom' : zoom(view==='0, 0, 100, 200'?'14 0 72 200':'0, 0, 100, 200'); break;
      case 'login' : loginUser(data.user); setMode('profile'); break;
      case 'logout' : loginUser({}); cmd({order:'dialog', title:'Thanks for Playing', text:['h2:::Hope to see you again soon.','h4:::Any social media attention would be appreciated.','h4:::Leaving comments is my best way to help improve Chexx.']}); break;
      case 'menu' : setBoard(data.choice); break;
      case 'users' : setBoard(data.choice); break;
      case 'cpu' : cpuMove(data.level); break;
      case 'rewind' : goBack(data.event); break;
      case 'resign' : resign(data.id); break;
      case 'setup' : newGame(); break;
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
          if (check.length===0) {
            tutor = '';
            check = ansKey.filter(ak=>ak[0].split(' ').includes(data.here));
          }
          const sketch = [];
          if (check.length>0) { // console.log('got an answer', check);
            const textAttr = check[0][2].split(',');
            if (check[0][3]) { // action taken
              //clear();
              for (const specs of check[0][3].split('||')) {
                const spec = specs.split('|');
                switch(spec[0]) {
                  case '~' : tutor = data.here; hilite([data.here],"stroke","#00f"); break;
                  case '-' : movePiece(match, null,[tutor,data.here]); tutor = ''; break; // move piece 
                  case 'hl' : hilite(spec[2].split(' '),'stroke',spec[1]); break;
                  default: break;
                }
              }
            } else tutor = '';
            let space = parseInt(textAttr[1]);
            if (check[0][1]) {
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
    const copyMatch = {id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}};
    for (const l in match.log) {
      if (l < event +1) {
        const mvs = match.log[l].trim('+').split(/[x~]/);
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
      setMode('offline');
      
    }
    update(copyMatch);
  }
  function cpuMove(level) {
    fetch(serverUrl+'/match/cpu/'+level,{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify(match)
    }).then(response => response.json() )
      .then(data => {
        if (data.move === 'Checkmate') console.log("That was checkmate..");
        else if (data.move === 'Stalemate') console.log("That was stalemate..");
        else {
          let copyMatch = {...match};
          const board = analyse(match); 
          movePiece(copyMatch, board, data.move.split('~'));
          update(copyMatch);
        }
      }
    );
  }
  function commitMove(move) {
    console.log('commit move',move,'to match id',match.ID);
    fetch(serverUrl+'/match/move/'+match.ID,{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify({move:move})
    }).then(response => response.json() )
      .then(data => { 
        if (data.status) { 
          listMatches();
          resume();
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
      });
  }
  function loadMatch(id) {
    clear();
    fetch(serverUrl+'/match/load/'+id,{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
      .then(data => { 
        if (data.status) { 
          data.match.log = data.match.log.filter(l=>l!=='');
          if (data.white) data.match.white.player = data.white;
          if (data.black) data.match.black.player = data.black;
          if ((data.match.white.ID !== user.ID && data.match.white.ID !== 0)
            || (data.match.black.ID !== user.ID && data.match.black.ID !== 0)) setMode("match");
          else setMode("offline");
          turn(data.match.black.player && data.match.black.player.ID === user.ID);
          update(data.match); 
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
      });
  }
  function previewMatch(id) { console.log('previewMatch',id);
    let open = {};
    fetch(serverUrl+'/match/load/'+id,{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
      .then(data => { 
        if (data.status) { 
          data.match.log = data.match.log.filter(l=>l!=='');
          open = data.match;
          let oid = open.white.userid;
          if (oid===0) oid = open.black.userid;
          fetch(serverUrl+'/user/'+oid,{
            mode: 'cors',
            method: "GET",
            headers: {"Content-Type": "application/json", "Authorization": user.token}
          }).then(response => response.json() )
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
    fetch(serverUrl+'/match/accept/'+dialog.openId,{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
      .then(data => { 
        if (data.status) {
          cmd({order:'listMatches'});  
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
      });
  }
  function deleteMatch() {
    fetch(serverUrl+'/match/delete/'+dialog.openId,{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
    .then(data => {
      if (data.status) {
        user.savedMatches = data.savedMatches;
        user.open = data.open
        user.myOpen = data.myOpen
        user.ready = data.ready
        user.waiting = data.waiting
        user.victory = data.victory
        user.defeat = data.defeat
        cmd({order:'menu', choice:'match'});
      } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
    .catch((error) => {
      // Handle the error
      console.log(error);
      cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]})
    });
  }
  function saveMatch(match) {
    fetch(serverUrl+'/match/save',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify(match)
    }).then(response => response.json() )
      .then(data => cmd(data.status?{order:'dialog', title:'Match Saved', text:[], ok:true, noClose:true}:{order:'dialog', title:'Error', text:['h2:::'+data.message]}));
  }
  function resign(match) {
    fetch(serverUrl+'/match/resign',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify(match)
    }).then(response => response.json() )
      .then(data => cmd(data.status?{order:'dialog', title:'Match Resigned', text:['h2:::'+data.message, 'h3:::'+data.rank], ok:true, noClose:true}:{order:'dialog', title:'Error', text:['h2:::'+data.message]}));
  }
  function listMatches() {
    fetch(serverUrl+'/match/list',{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
      .then(data => {
        if (data.status) {
          user.savedMatches = data.savedMatches;
          user.open = data.open
          user.myOpen = data.myOpen
          user.ready = data.ready
          user.waiting = data.waiting
          user.victory = data.victory
          user.defeat = data.defeat
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
      // case '': break;
      // case '': break;
      // case '': break;
      default: break;
    }
    resume();
  }
  function newGame() {
    update({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
    resume();
  }
  function resume() { setMode('offline'); }
  function openChallenge() {
    const title = document.getElementById('title').value;
    const dpm = document.getElementById('dpm').value;
    const color = document.getElementById('color').value;
    console.log('Form',title,dpm,color);
    fetch(serverUrl+'/match/challenge',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify({title:title, dpm:dpm, color:color})
    }).then(response => response.json() )
      .then(data => {
        if (data.status) {
          user.savedMatches = data.matches;
          listMatches();
          resume();
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]}); })
      .catch((error) => {
        // Handle the error
        console.log(error);
        cmd({order:'dialog',title:'Error', text:['h3:::Server error.', ''+error]})
      });
  } 
  function loginForm() {
    const form = [];
    form.push(<div className='subPanel'><FacebookLogin appId="1326440067839844" autoLoad={false} fields="name,email,picture" callback={responseFacebook}/></div>);
    form.push(<div className='subPanel'><GoogleLogin clientId="1326440067839844" buttonText="Login" onSuccess={responseGoogle} onFailure={responseGoogle} cookiePolicy={'single_host_origin'}/></div>);
    form.push(<div className='subPanel' id='chexxLogin'><table><tbody>
      <tr><td>Login Id:</td><td><input id='loginName' className='input' type="text" name="username" size="18" maxLength="40"/></td></tr>
      <tr><td>Password:</td><td><input id='loginPassword' className='input' type="password" name="password" size="18" maxLength="40"/></td></tr>
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
  function showDialog(dialog) { // console.log('dialog', dialog);
    return (
      <div className='Full Overlay'>
        <div className='Dialog' >
          <div className='topper'><h2>{dialog.title}</h2></div>
          { dialog.text && textOut(dialog.text)}
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
              { dialog.ok && <button className='smButton' onClick={ok}>OK</button> }
              { dialog.login && <button className='smButton' onClick={chexxLogin}>Login</button> }
              { dialog.login && <button className='smButton' onClick={()=> cmd({order:'dialog', register:true, title:'Register', text:['h2:::Kindly fill out the following form to experience the rich experience of Chexx.']})}>Register</button> }
              { dialog.login && <button className='smButton' onClick={chexxLogin}>Email Password Link</button> }
              { dialog.register && <button className='smButton' onClick={chexxRegister}>Submit</button> }
              { !dialog.noClose && <button className='smButton' onClick={resume}>Close</button> }
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
            </div></div> }
      </div>
    );
  }
  function chexxLogin() { // console.log('chexxLogin');
    const user = {userid:document.getElementById('loginName').value, password:document.getElementById('loginPassword').value};
    if (user.userid && user.password) {
      fetch(serverUrl+'/user/login',{
        mode: 'cors',
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(user)
      }).then(response => response.json() )
      .then(data => {
        cmd(data.status?{order:'login',user:data.user}:{order:'dialog', title:'Not Authorized', text:['h2:::Please check you login credentials and try again.']});
        sendMessage(JSON.stringify({type:'login', token:data.user.token})); 
      });
    } else {
      document.getElementById('chexxLogin').style.border='2px solid #f00';
    }
  }
  function chexxLogout() {
    fetch(serverUrl+'/user/logout',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify({token:user.token})
    }).then(response => response.json() )
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
        fetch(serverUrl+'/user/register',{
          mode: 'cors',
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify(user)
        }).then(response => response.json() )
        .then(data => cmd(data.status?{order:'login',user:data.user}:{order:'dialog', title:'Error', text:['h2:::'+data.message], ok:true})); //cmd({order:'login',user:data}));
      }
  }
  function teach(num) { console.log('teach', lesson.step[num]);
    if (num > lesson.step.length-1) return;
    onHint = 0;
    tutor = '';
    const copy = {...match};
    const step = lesson.step[num];
    if (step.white) copy.white.pieces = [...step.white];
    if (step.black) copy.black.pieces = [...step.black];
    if (step.log) copy.log = step.log;
    move(num)
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
        default: break;
      }
    }
    scribble(sketch);
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
  function profile() { // console.log("profile",user);
    const table = [<table><tbody>
      <tr><td colSpan={2}><img src={serverUrl+'/pub/smiley.png'} alt="Smiley face" width="80" height="120" style={{border:'5px solid black'}}/></td></tr>
      <tr>{tdr('h3:::User Name:')}{tdl('h2:::'+user.userid)}{tdr('h3:::Email:')}{tdl('h2:::'+user.email)}</tr>
      <tr>{tdr('h3:::Rank:')}{tdl('h2:::'+user.rank)}{tdr('h3:::Account:')}{tdl('h2:::silver')}</tr>
      <tr>{tdr('h3:::History:')}{tdl('-------')}{tdr('h3:::About:')}{tdl('xxxxxx')}</tr>
      <tr></tr>
      <tr>{tdr('h3:::Show Hints')}<td><input type="checkbox" id="showHints" className='left' name="showHints" checked={hints} onChange={()=>{onoffHints(!hints)}}/></td>{tdr('----')}{tdl('------')}</tr>
      <tr></tr>
      <tr></tr>
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
  function storeProfile() {
    user.property.hints = hints?'true':'false';
    fetch(serverUrl+'/user/save',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json", "Authorization": user.token},
      body: JSON.stringify(user)
    }).then(response => response.json() )
      .then(data => cmd(data.status?{order:'dialog', title:'Profile Saved', text:[], ok:true, noClose:true}:{order:'dialog', title:'Error', text:['h2:::'+data.message]}));
  }
  function teacher(lines) { // console.log('teacher', idx,lesson);
    
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
          <div className='bottomer'>
            <div className='group'>
              { idx > 0 && <button className='smButton' onClick={()=>teach(idx>0?idx-1:0)}>Prev</button> }
              <button className='smButton' onClick={resume}>Close</button>
              <button className='smButton' onClick={()=>teach(idx)}>Reset</button>
              { idx < lesson.step.length-1 && <button className='smButton' onClick={()=>teach(idx+1)}>Next</button> }
              { lesson.step[idx].hint && onHint < lesson.step[idx].hint.length && <button className='smButton' onClick={()=>hint()}>?</button>}
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  React.useEffect(() => { //  console.log('App useEffect:',state, mode, user);

    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
      const message = JSON.parse(lastMessage.data);
      console.log("WEBSOCKET:::"+message.type);
      switch(message.type) {
        case 'notify': console.log('match',message.match); 
        hilite(['wait-'+message.match],'fill','#00ff00b0', false);
        hilite(['txt-wait-'+message.match],'fill','#ffaaffb0', false);
          // const update = $('#wait-'+message.match);
          // if (update) update.style.fill='#00ff00ff';
          break;
        default: break;
      }
      //$('#wait-rtyu:49').css({ fill:'#00ff00ff'});
    }
    if (user) {
      if (user.property) {
        if (user.property.hints === 'true') {
          let sketch = [];
          switch(state+':'+mode) { // M -35,0 A 35,35 0 0 0 0,35 35,35 0 0 0 35,0 35,35 0 0 0 0,-35 35,35 0 0 0 -35,0 Z // M 40,0 A 40,40 0 0 1 0,40 40,40 0 0 1 -40,0 40,40 0 0 1 0,-40 40,40 0 0 1 40,0 Z
            case 'match:offline': sketch.push(<defs><path id="hintPath1" transform={'translate(50,50) rotate(220,0,0)'} d="M -42,0 A 42,42 0 0 0 0,42 42,42 0 0 0 42,0 42,42 0 0 0 0,-42 42,42 0 0 0 -42,0 Z"></path></defs>); 
              sketch.push(<defs><path id="hintPath2" transform={'translate(50,50) rotate(215,0,0)'} d="M 38,0 A 38,38 0 0 1 0,38 38,38 0 0 1 -38,0 38,38 0 0 1 0,-38 38,38 0 0 1 38,0 Z"></path></defs>); 
              sketch.push(<text className='noMouse' fontFamily='Verdana' fontSize={7} fill='#ff9'><textPath href="#hintPath1">Current Matches</textPath></text>);
              sketch.push(<text className='noMouse' fontFamily='Verdana' fontSize={7} fill='#ff9'><textPath href="#hintPath2">Saved Games</textPath></text>);
              for (let i=0;i<12;i+=1)  
                sketch.push(<g class='noMouse' transform={'translate('+(40+30*Math.sin(i*3.1416/6))+', '+(50-30*Math.cos(i*3.1416/6))+')'}>
                  <text id={'hint'+i} className='noMouse hint' fontFamily="Verdana" fontSize={5} fill='#ff9'></text></g>);
              break;
            default: break;
          }
          scribble(sketch);
        }
        onoffHints(user.property.hints === 'true')
      }
    }
  }, [state, mode, user, lastMessage, setMessageHistory])

  return (
    <div className="App Full">
      <Board color={['#555','#aaa','#111']} user={user} match={match} menu={state} update={update} view={view} command={cmd} flip={flip} mode={mode} history={history}/>
      { (mode === 'history' || mode === 'offline' || mode === 'tutor' || mode === 'match') &&  <Pieces white={match.white.pieces} black={match.black.pieces} light={flip?"#012":"#eeb"} dark={flip?"#eeb":"#012"} view={view} flip={flip}/>}
      { mode === 'dialog' && showDialog(dialog) }
      { mode === 'tutor' && teacher() }
      { mode === 'profile' && profile() }
      { mode === 'welcome' && welcome() }

      { drawing && <div className="Overlay Full"><svg viewBox={view} xmlns="http://www.w3.org/2000/svg"> { drawing } </svg></div> }
      
      <span>The WebSocket is currently {connectionStatus}</span>
      {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
      <ul>
        {messageHistory.map((message, idx) => (
          <span key={idx}>{message ? message.data : null}</span>
        ))}
      </ul>
    </div>
  );
}

export default App;
