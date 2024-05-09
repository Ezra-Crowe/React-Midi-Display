import React, { useEffect, useState } from 'react';
import Midi from 'midi-player-js';


function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;
    }
    //console.log(obj + " is returning " + (typeof obj[Symbol.iterator] !== 'undefined') + " for " + typeof obj[Symbol.iterator]);
    return (typeof obj[Symbol.iterator]) !== 'undefined';
  }

function buildNotes(notes) {
    let prevNote = [0, "", 0];
    let divArray = [];
    for (let i = 0; i < notes.length; i++) {
        const [noteName, duration, noteNumber] = notes[i];
        // Customize visual representation of each note
        const style = {
            backgroundColor: 'blue', // Example background color
            width: `${duration}px`, // Example width based on note duration
            height: '20px', // Example fixed height
            position: 'absolute',
            left: `${noteNumber * 10}px`, // Example positioning based on note number
            top: '0', // Example fixed top position
        };
        divArray.push(<div key={i} style={style}></div>);
    }
    return <div>{divArray}</div>;
}
export { buildNotes };

function Midi_Display({ midiFilePath }) {
    const [numNotes, setNumNotes] = useState([0,0]);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        const fetchMidiFile = async () => {
            console.log(`Fetching MIDI file from ${midiFilePath}`);
            const response = await fetch(midiFilePath);
            const arrayBuffer = await response.arrayBuffer();
            const player = new Midi.Player();
            player.loadArrayBuffer(arrayBuffer);
            console.log('events ${}', player.getEvents());
            let lowest = Infinity;
            let highest = -Infinity;
            let noteToNoteState = {};
            //Consists of three fields where the first is the noteName the second is its duration in ticks and the third is its notenumber
            let notes = [];
            const events = player.getEvents();
            events.forEach(event => {
                if (isIterable(event))
                {
                    event.forEach(e => {
                        //Note off is not a needed check as the library only displays things as note on :'(
                        //Keeping the check around though in case they fix the library
                        if (e.name == 'Note on' || e.name == 'Note off') {
                            if (noteToNoteState[e.noteNumber] == undefined) {
                                noteToNoteState[e.noteNumber] = [e.noteName, true, e.tick]
                            }else
                            {
                                if (noteToNoteState[e.noteNumber][1] == true)
                                {
                                    noteToNoteState[e.noteNumber][1] = false;
                                    notes.push([e.noteName, e.tick - noteToNoteState[e.noteNumber][2], e.noteNumber]);
                                }else
                                {
                                    noteToNoteState[e.noteNumber][1] = true;
                                    noteToNoteState[e.noteNumber][2] = e.tick;
                                }
                            }
                            if (e.noteNumber < lowest) {
                                lowest = e.noteNumber;
                            }
                            if (e.noteNumber > highest) {
                                highest = e.noteNumber;
                            }
                        }
                    });
                }
            });
            console.log(notes);
            console.log(`Lowest note: ${lowest}, Highest note: ${highest}`);
            console.log(`Loaded ${highest - lowest} numNotes from MIDI file`);
            setNumNotes([lowest, highest]);
            setNotes(notes);
        };
    
        fetchMidiFile();
    }, [midiFilePath]);

    

    return (
        <div data-testid="midi-display-content" style={{ overflowY: 'scroll', overflowX: 'scroll', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
            
            { (() => {
                let divArray = [];
                let width = 25;
                let height = 100;
                let whiteNum = 0;
                let lastWhiteKeyPosition = 0;
                for (let i = numNotes[0]; i <= numNotes[1]; i++)
                {
                    //1 3 6 8 10 are all the black keys
                    if (i % 12 == 1 || i % 12 == 3 || i % 12 == 6 || i % 12 == 8 || i % 12 == 10)
                    {
                        divArray.push(<div key={i} style={{position: 'absolute', left: (lastWhiteKeyPosition + (width + 1) - (width / 4))+ 'px', display: 'inline-block', width: (width / 2)+'px', height: (height * (5/8))+'px', backgroundColor: 'black', zIndex: 2}}></div>);
                    }else{
                        lastWhiteKeyPosition = (width + 1) * whiteNum;
                        whiteNum++;
                        divArray.push(<div key={i} style={{position: 'absolute', left: lastWhiteKeyPosition, border: "1px solid black", display: 'inline-block', width: width+'px', height: height+'px', backgroundColor: 'white'}}></div>);
                    }
                }
                return divArray;
                //<div key={index} style={{ border: "5px solid black", display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'blue'}}></div>
            })()}
        </div>
    );
}

export default Midi_Display;

<Midi_Display midiFilePath="/path/to/your/midi/file.mid" />
