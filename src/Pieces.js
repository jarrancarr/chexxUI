import Piece from "./Piece";
import {revMap} from './res';

function place(w, b, l, d, f) { //console.log('place',w, b, l, d);
    const set = [];
    for (let wp of w) {
        const xy = revMap[wp.substring(1)].split('-');
        set.push(<Piece key={'w'+wp} type={'w'+wp[0]} x={parseInt(xy[0])} y={f?24-parseInt(xy[1]):parseInt(xy[1])} c={f?d:l} s={f?l:d} id='w'/>);
    }
    for (let bp of b) {
        const xy = revMap[bp.substring(1)].split('-');
        set.push(<Piece key={'b'+bp} type={'b'+bp[0]} x={parseInt(xy[0])} y={f?24-parseInt(xy[1]):parseInt(xy[1])} c={f?l:d} s={f?d:l} id='b'/>);
    }
    return set;
}

export default function Pieces({white, black, light, dark, view, flip}) { // console.log('Pieces',white, black);
    return (
        <div className="Overlay Full">
            <svg viewBox={view} xmlns="http://www.w3.org/2000/svg">
                {place(white, black, light, dark, flip)}
            </svg>
        </div>);
}