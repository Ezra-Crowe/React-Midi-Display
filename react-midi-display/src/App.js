import './App.css';
import Midi_Display from './Midi-Display/Midi-Display';

function App() {
  return (
    <div className="App">
      <Midi_Display midiFilePath={"/ghoul.mid"} />
    </div>
  );
}//

export default App;