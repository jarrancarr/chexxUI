import {map} from './res';

function set(what, thing ,to) { // console.log('set',what,thing,to);
    let ele = document.getElementById(what);
    if (ele) ele.setAttribute(thing, to);
}

export default function Hex({x, y, color, action}) {
    const off = 'drop-shadow(rgba(210, 128, 210, 0.4) 0px 0px 2px)';
    const sk = 2.85;
    const t = "translate("+(x*sk*2+15.7)+","+((y+x%2)*sk*1.15+10.8)+") scale(1.7)";
    const id = map[x+"-"+(y+x%2)];
    const classes = "hex reg"+id[0]+(id.length>1?" ring"+id[1]:"");
    
    function hover(e) { 
        set(e.target.id, 'style','filter: drop-shadow(rgba(255, 0, 0, 0.5) 0px 0px 1px)'); 
        set('text-'+e.target.id, 'fontSize','1.7'); 
    }
    function leave(e) { 
        set(e.target.id, 'style', off);         
        set('text-'+e.target.id, 'fontSize','0'); 
    }
    function click(e) {
        set(e.target.id, 'style', 'filter: drop-shadow(rgba(0, 0, 255, 0.9) 0px 0px 1px)'); 
        action(e.target.id);
    }

    return (
        <g key={id} onMouseOver={hover} onMouseLeave={leave} onClick={click} transform={t} style={{ filter: off}}>
            <path className={classes} id={id} fill={color[(y+x%2)%3]} stroke='#000' strokeWidth={0.4} strokeOpacity={0.5} d="M -2 0 L -1 -1.7 H 1 L 2 0 L 1 1.7 H -1 Z"></path>
            <text className='noMouse coord' id={'text-'+id} x={-id.length/2} y={0.5} fontFamily="Verdana" fontSize="0" fill="#cc4">{id}</text>
        </g>
    );
}