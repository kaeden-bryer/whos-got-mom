import {useState} from 'react';


function Password() {
    const [password, setName] = useState("");


    return (
    <div>
        <form>
            <input type="text" value={password} onChange={(e) => setName(e.target.value)} />
        </form>
    </div>
    );
}


export default Password;

