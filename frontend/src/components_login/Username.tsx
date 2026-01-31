import {useState} from 'react';


function Username() {
    const [name, setName] = useState("");


    return (
    <div>
        <form>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </form>
    </div>
    );
}


export default Username;