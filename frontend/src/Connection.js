import { useEffect, useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ConnectionScreen from './components/ConnectionScreen.js';


function Connection() {
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    let hostId = localStorage.getItem('host_id');

    console.log("Текущий hostId" + hostId);
    
    if (!hostId) {
      hostId = uuidv4();
      localStorage.setItem('host_id', hostId);
    }

    axios.post('http://192.168.1.66:8000/api/rooms/create/', { host: hostId })
      .then(response => {
        setRoomData(response.data);
      })
      .catch(error => {
        console.error("Ошибка создания комнаты", error);
      });
  }, []);  

  return (
    <div className="Connection">
      {roomData ? (
        <ConnectionScreen roomData={roomData} />
      ) : (
        <div>
          Создание комнаты...
        </div>
      )}
    </div>
  );
}

export default Connection;
