import './Link.css'
import {useState} from 'react';


function Password() {
    const [password, setName] = useState("");


    return (
    <div id="password">
        <form>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setName(e.target.value)} />
        </form>
    </div>
    );
}


export default Password;

