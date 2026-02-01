import {useState} from 'react';


function Username() {
    const [name, setName] = useState("");


    return (
    <div id="username">
        <form>
            <input type="text" placeholder="Email or Phone #" value={name} onChange={(e) => setName(e.target.value)} />
        </form>
    </div>
    );
}


export default Username;