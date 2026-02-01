
import {useState} from 'react';

//simple input field that saves input in password variable
function Password() {
    const [password, setName] = useState("");


    return (
    <div id="password">
        <form>
            <input type="text" placeholder="Password" value={password} onChange={(e) => setName(e.target.value)} />
        </form>
    </div>
    );
}


export default Password;

