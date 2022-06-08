import React from 'react';
// import ReactDOM from 'react-dom';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import './App.css';
import Board from "./Board"
import Pieces from "./Pieces"
import { clear, hilite, movePiece } from './res';

let onHint = 0;
let lesson = {};
// const serverUrl = 'http://192.168.1.152:8000';
const serverUrl = 'http://71.246.199.75:6085';
const zoomed = false;
let tutor = '';

function App() { console.log('App');
  const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  // const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Nd53', 'Na3', 'Bc53', 'Kc44', 'Pd33', 'Pd21', 'Pc22', 'Pa11', 'Sd32', 'Sd2', 'Sc32', 'Ac43'], time:300}, black:{pieces:['Nf55', 'Bf54', 'Ka41', 'Pf31', 'Pf22', 'Pa21', 'Sf32', 'Sa2', 'Sa32', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  //const [match, update] = React.useState({id:0, name:'test', white:{pieces:['Kc44', 'Pc2','Sc32', 'Pc22','Pc3', 'Pc4'], time:300}, black:{pieces:['Ka41'], time:300}, log:[], type:{game:300, move:15}});
  const flip = false;
  let [view, zoom] = React.useState(zoomed?'14 0 72 200':'0, 0, 100, 200');
  let [mode, setMode] = React.useState('offline');
  let [dialog, setDialog] = React.useState({});
  let [user, loginUser] = React.useState({});
  let [idx, move] = React.useState(0);
  let [state, setBoard] = React.useState('main');
  let [drawing, scribble] = React.useState([]);

  
  function cmd(data) { // console.log('command', data);
    switch(data.order) {
      case 'dialog': // console.log('opening dialog');
        setDialog(data)
        setMode('dialog'); 
        break; 
      case 'tutorial':
        lesson = data.lesson;
        setMode('tutor');
        teach(0);
        break; 
      case 'profile': setMode('profile'); break;
      case 'zoom' : zoom(view==='0, 0, 100, 200'?'14 0 72 200':'0, 0, 100, 200'); break;
      case 'login' : loginUser(data.user); setMode('profile'); break;
      case 'logout' : loginUser({}); cmd({order:'dialog', title:'Thanks for Playing', text:['h2:::Hope to see you again soon.','h4:::Any social media attention would be appreciated.','h4:::Leaving comments is my best way to help improve Chexx.']}); break;
      case 'menu' : setBoard(data.choice); break;
      case 'saveMatch' : saveMatch(data.match); break;
      case 'loadMatch' : loadMatch(data.id); break;
      case 'listMatches' : listMatches(); break;
      case 'guess' : console.log('user guessed:',tutor, data.here, lesson); 
        const ansKey = lesson.step[idx].answer;
        if (ansKey) { // console.log('answer key ',ansKey);
          let check = ansKey.filter(ak=>ak[0].split(' ').includes((tutor?tutor+'~':'')+data.here));
          if (check.length===0) {
            tutor = '';
            check = ansKey.filter(ak=>ak[0].split(' ').includes(data.here));
          }
          const sketch = [];
          if (check.length>0) { // console.log('got an answer', check);
            const textAttr = check[0][2].split(',');
            if (check[0][3]) { // action taken
              switch(check[0][3]) {
                case '~' : tutor = data.here; hilite([data.here],"stroke","#00f"); break;
                case '-' : movePiece(match, null,tutor,data.here); // move piece 
                  tutor = '';
                  break;
                default: break;
              }
            } else tutor = '';
            sketch.push(<text id='critique' x={textAttr[0]} y={textAttr[1]} className='noMouse' fontFamily="Verdana" fontSize={textAttr[2]} fill={textAttr[3]} style={{filter: 'drop-shadow('+textAttr[4]+' 1px 1px 2px)'}}>{check[0][1]}</text>);
          } else {
            tutor = '';
            const textAttr = ansKey[0][2].split(',');
            sketch.push(<text id='critique' x={textAttr[0]} y={textAttr[1]} className='noMouse' fontFamily="Verdana" fontSize={textAttr[2]} fill={textAttr[3]} style={{filter: 'drop-shadow('+textAttr[4]+' 1px 1px 2px)'}}>{ansKey[0][1]}</text>);            
          }
          scribble(sketch);
        }
      break;
      default: break;
    }
  }
  function loadMatch(id) {
    fetch(serverUrl+'/match/load/'+id,{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
      .then(data => { 
        if (data.status) { 
          update(data.match); 
          resume(); 
        } else cmd({order:'dialog', title:'Error', text:['h2:::'+data.message]});
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
  function listMatches() {
    fetch(serverUrl+'/match/list',{
      mode: 'cors',
      method: "GET",
      headers: {"Content-Type": "application/json", "Authorization": user.token}
    }).then(response => response.json() )
      .then(data => {
        if (data.status) {
          user.savedMatches = data.matches;
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
      case 'New Game vs AI?': newGame(); break;
      case 'Log out?': chexxLogout(); break;
      case '': break;
      // case '': break;
      // case '': break;
      // case '': break;
      // case '': break;
      default: resume(); break;
    }
    
  }
  function no() {
    resume();
  }
  function ok() {
    resume();
  }
  function newGame() {
    update({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
    resume();
  }

  function resume() { setMode('offline'); }

  function createMatch() {
    console.log('Form');
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
  function showDialog(dialog) { console.log('dialog', dialog);
    return (
      <div className='Full Overlay'>
        <div className='Dialog' >
          <div className='topper'><h2>{dialog.title}</h2></div>
          {textOut(dialog.text)}
          { dialog.login && loginForm() }
          { dialog.register && registerForm() }
          {dialog.createMatch && <div className='group'>
            <table><tbody>
              <tr><td>Title:</td><td><input type="text" name="title" size="30" maxlength="120" value="Chexx Battle"/></td></tr>
              <tr><td>Time per move:</td><td><select name="days"><option value="2">2 days</option><option value="3" selected="">3 days</option><option value="4">4 days</option><option value="5">5 days</option><option value="7">7 days</option><option value="10">10 days</option><option value="14">14 days</option></select></td></tr>
              <tr><td>Play as (color):</td><td><select name="color"><option value="2" selected="">random color</option><option value="1">white</option><option value="0">black</option></select></td></tr>
            </tbody></table>
          </div> }
          <div className='bottomer'>
            <div className='group'>
              { dialog.createMatch && <button className='smButton' onClick={createMatch}>Post Game</button>}
              { dialog.yesno && <div className='group'><button className='smButton' onClick={yes}>Yes</button><button className='smButton' onClick={no}>No</button></div> }
              { dialog.ok && <button className='smButton' onClick={ok}>OK</button> }
              { dialog.login && <button className='smButton' onClick={chexxLogin}>Login</button> }
              { dialog.login && <button className='smButton' onClick={()=> cmd({order:'dialog', register:true, title:'Register', text:['h2:::Kindly fill out the following form to experience the rich experience of Chexx.']})}>Register</button> }
              { dialog.login && <button className='smButton' onClick={chexxLogin}>Email Password Link</button> }
              { dialog.register && <button className='smButton' onClick={chexxRegister}>Submit</button> }
              { !dialog.noClose && <button className='smButton' onClick={resume}>Close</button> }
            </div>
          </div>
        </div>
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
      .then(data => cmd(data.status?{order:'login',user:data.user}:{order:'dialog', title:'Not Authorized', text:['h2:::Please check you login credentials and try again.']}));
    } else {
      document.getElementById('chexxLogin').style.border='2px solid #f00';
    }
  }

  function chexxLogout() {
    fetch(serverUrl+'/user/logout',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json"},
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
  function teach(num) { // console.log('teach', lesson.step[num]);
    if (num > lesson.step.length-1) return;
    onHint = 0;
    tutor = '';
    const copy = {...match};
    const step = lesson.step[num];
    if (step.white) copy.white.pieces = step.white;
    if (step.black) copy.black.pieces = step.black;
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

  function profile() { console.log("profile",user);
  function tdr(txt) { return <td className='right'>{txt}</td>; }
  function tdl(txt) { return <td className='left'>{txt}</td>; }
    const table = [<table><tbody>
      <tr>{tdr('User Name:')}{tdl(user.userid)}{tdr('Email:')}{tdl(user.email)}</tr>
      <tr>{tdr('Rank:')}{tdl(user.rank)}{tdr('About:')}{tdl('xxxxxx')}</tr>
    </tbody></table>];
    return (
      <div className='Full Overlay'>
        <div className='Dialog' style={{width:'55vw'}}>
          <div className='topper'><h2>{'Welcome, '+user.fullName}</h2></div>
          
          {textOut(["h5:::This is your public profile..."])}
          {table}
          <div className='bottomer'>
            <div className='group'>
              <button className='smButton' onClick={resume}>Close</button>
              <button className='smButton' onClick={resume}>Edit</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function teacher(lines) { // console.log('teacher', idx,lesson);
    
    const step = lesson.step[idx];
    return (
      <div className='Full' style={{pointerEvents: 'none'}}>
        <div id='Tutor' style={{width:step.width+'vw', top:step.posY+'%', left:step.posX+'%', backgroundColor: step.background}}>
          {step.title && <div className='topper'><h2>{step.title}</h2></div>}
          {textOut(lesson.step[idx].text)}
          <div className='bottomer'>
            <div className='group'>
              { idx > 0 && <button className='smButton' onClick={()=>teach(idx>0?idx-1:0)}>Prev</button> }
              <button className='smButton' onClick={resume}>Close</button>
              <button className='smButton' onClick={()=>teach(0)}>Reset</button>
              { idx < lesson.step.length-1 && <button className='smButton' onClick={()=>teach(idx+1)}>Next</button> }
              { lesson.step[idx].hint && onHint < lesson.step[idx].hint.length && <button className='smButton' onClick={()=>hint()}>?</button>}
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div className="App Full">
      <Board color={['#555','#aaa','#111']} user={user} match={match} menu={state} update={update} view={view} command={cmd} serverUrl={serverUrl}/>
      { (mode === 'offline' || mode === 'tutor') &&  <Pieces white={match.white.pieces} black={match.black.pieces} light={flip?"#012":"#eeb"} dark={flip?"#eeb":"#012"} view={view} flip={flip}/>}
      { mode === 'dialog' && showDialog(dialog) }
      { mode === 'tutor' && teacher() }
      { mode === 'profile' && profile() }

      { drawing && <div className="Overlay Full"><svg viewBox={view} xmlns="http://www.w3.org/2000/svg"> { drawing } </svg></div> }
    </div>
  );
}

export default App;
