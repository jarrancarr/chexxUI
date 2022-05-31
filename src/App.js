import React from 'react';
// import ReactDOM from 'react-dom';
import FacebookLogin from 'react-facebook-login';
import './App.css';
import Board from "./Board"
import Pieces from "./Pieces"
import { clear, hilite, movePiece } from './res';

let login = false;
let onHint = 0;
let yesno = false;
let lesson = {};
const serverUrl = 'http://localhost:8000';
const zoomed = false;
let tutor = '';

function App() { console.log('App');
  const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  // const [match, update] = React.useState({id:0, name:'offline', white:{pieces:['Nd53', 'Na3', 'Bc53', 'Kc44', 'Pd33', 'Pd21', 'Pc22', 'Pa11', 'Sd32', 'Sd2', 'Sc32', 'Ac43'], time:300}, black:{pieces:['Nf55', 'Bf54', 'Ka41', 'Pf31', 'Pf22', 'Pa21', 'Sf32', 'Sa2', 'Sa32', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
  //const [match, update] = React.useState({id:0, name:'test', white:{pieces:['Kc44', 'Pc2','Sc32', 'Pc22','Pc3', 'Pc4'], time:300}, black:{pieces:['Ka41'], time:300}, log:[], type:{game:300, move:15}});
  const flip = false;
  let [view, zoom] = React.useState(zoomed?'14 0 72 200':'0, 0, 100, 200');
  let [mode, setMode] = React.useState('offline');
  let [title, setTitle] = React.useState('Welcome');
  let [text, setText] = React.useState('Welcome to Chexx');
  let [user, login] = React.useState({});
  let [idx, move] = React.useState(0);
  let [state, setBoard] = React.useState('main');
  let [drawing, scribble] = React.useState([]);

  
  function cmd(data) { // console.log('command', data);
    login = false;
    yesno = false;
    switch(data.order) {
      case 'dialog': // console.log('opening dialog');
        login = data.login;
        yesno = data.yesno;
        if (data.title) setTitle(data.title);
        if (data.text) setText(data.text);
        setMode('dialog'); 
        break; 
      case 'tutorial':
        lesson = data.lesson;
        setMode('tutor');
        teach(0);
        break; 
      case 'zoom' : zoom(view==='0, 0, 100, 200'?'14 0 72 200':'0, 0, 100, 200'); break;
      case 'login' : login(data.user); break;
      case 'menu' : setBoard(data.choice); break;
      case 'guess' : console.log('user guessed:',tutor, data.here, lesson); 
        const ansKey = lesson.step[idx].answer;
        if (ansKey) { console.log('answer key ',ansKey);
          let check = ansKey.filter(ak=>ak[0].split(' ').includes((tutor?tutor+'~':'')+data.here));
          if (check.length===0) {
            tutor = '';
            check = ansKey.filter(ak=>ak[0].split(' ').includes(data.here));
          }
          const sketch = [];
          if (check.length>0) { console.log('got an answer', check);
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

  const responseFacebook = (response) => { // console.log(response);
    fetch(serverUrl+'/user',{
      mode: 'cors',
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({'thisGuy':response})
    }).then(response => response.json() )
    .then(data => cmd({order:'login',user:data}));
    setMode('profile');
  }
  function newGame() {
    update({id:0, name:'offline', white:{pieces:['Rd54', 'Rd5', 'Rc52', 'Nd53', 'Nd51', 'Nc33', 'Bc53', 'Bc55', 'Bd52', 'Qd41', 'Kc44', 'Id31', 'Ed4', 'Pd55', 'Pd44', 'Pd33', 'Pd21', 'Pc22', 'Pc31', 'Pc41', 'Pc51', 'Sd43', 'Sd32', 'Sd2', 'Sc32', 'Sc42', 'Ad42', 'Ad3', 'Ac43'], time:300}, black:{pieces:['Ra5', 'Rf52', 'Ra54', 'Nf53', 'Nf55', 'Na31', 'Ba53', 'Ba51', 'Bf54', 'Qf44', 'Ka41', 'If33', 'Ea4', 'Pf51', 'Pf41', 'Pf31', 'Pf22', 'Pa21', 'Pa33', 'Pa44', 'Pa55', 'Sf42', 'Sf32', 'Sa2', 'Sa32', 'Sa43', 'Af43', 'Aa3', 'Aa42'], time:300}, log:[], type:{game:300, move:15}});
    resume();
  }
  function resume() { setMode('offline'); }
 
  function dialog(title, text) { // console.log('dialog',title, text);
    return (
      <div className='Full'>
        <div className='Dialog'>
          <div className='header'><h1>{title}</h1></div>
          <h3>{text}</h3>
          {login && <div className='group'><FacebookLogin appId="1326440067839844" autoLoad={false} fields="name,email,picture" callback={responseFacebook}/></div>  }

          {yesno && <div className='group'><button className='button' onClick={newGame}>Yes</button><button className='button' onClick={resume}>No</button></div> }
          <button className='button' onClick={resume}>Close</button>
        </div>
      </div>
    );
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
  }

  function teacher() { // console.log('teacher', idx,lesson);
    function text() {
      const text=[];
      let index = 0;
      for (const s of lesson.step[idx].text) {
        text.push(<h3 key={'step'+index++}>{s}</h3>);
      }
      return text;
    }
    const step = lesson.step[idx];
    return (
      <div className='Full' style={{pointerEvents: 'none'}}> <h2>where am i</h2>
        <div id='Tutor' style={{width:step.width+'vw', top:step.posY+'%', left:step.posX+'%', backgroundColor: step.background}}>
          {step.title && <div className='topper'><h2>{step.title}</h2></div>}
          {text()}
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
      <Board color={['#555','#aaa','#111']} user={user} match={match} menu={state} update={update} view={view} command={cmd}/>
      { (mode === 'offline' || mode === 'tutor') &&  <Pieces white={match.white.pieces} black={match.black.pieces} light={flip?"#012":"#eeb"} dark={flip?"#eeb":"#012"} view={view} flip={flip}/>}
      { mode === 'dialog' && dialog(title, text) }
      { mode === 'tutor' && teacher() }

      { drawing && <div className="Overlay Full"><svg viewBox={view} xmlns="http://www.w3.org/2000/svg"> { drawing } </svg></div> }
    </div>
  );
}

export default App;
