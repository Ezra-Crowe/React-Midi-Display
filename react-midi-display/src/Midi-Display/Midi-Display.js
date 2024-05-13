import React, { useEffect, useState, useRef } from "react";
import Midi from "midi-player-js";
import "./Midi-Display.css";

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] !== "undefined";
}

function buildNotes(notes, keyWidth, lowest, totalTicks) {
  if (!notes || notes.length === 0) {
    return null;
  }

  let blackKeyCount = 0;

  const isBlackKey = (noteNumber) => {
    return [1, 3, 6, 8, 10].includes(noteNumber % 12);
  };

  const getBlackKeysBeforeNote = (noteNumber, lowest) => {
    let blackKeysBeforeNote = 0;
    for (let i = lowest; i < noteNumber; i++) {
      if (isBlackKey(i)) {
        blackKeysBeforeNote++;
      }
    }
    return blackKeysBeforeNote;
  };

  return notes.map((note, index) => {
    const [noteName, duration, noteNumber, startTick] = note;
    const topPosition = (startTick / totalTicks) * 100 + "%"; // Calculate top position based on startTick and totalTicks
  
    let width = keyWidth;
    let left = (noteNumber - lowest - getBlackKeysBeforeNote(noteNumber, lowest)) * keyWidth;
    let backgroundColor = "#0066ff";
  
    if (isBlackKey(noteNumber)) {
      width = keyWidth / 2;
      left = (noteNumber - lowest - getBlackKeysBeforeNote(noteNumber, lowest)) * keyWidth - keyWidth / 4;
      backgroundColor = 'darkblue';
      blackKeyCount += 1;
    } else {
      blackKeyCount = 0;
    }
  
    const style = {
      backgroundColor,
      boxShadow: "inset 0 0 0 1px white",
      width: `${width}px`,
      height: `${(duration / totalTicks) * 100}%`, // Adjust height based on duration and totalTicks
      position: "absolute",
      left: `${left}px`,
      top:  topPosition, // Use calculated top position
    };
  
    return <div key={index} style={style} />;
  });
}
function Midi_Display({ midiFilePath }) {
  const [numNotes, setNumNotes] = useState([0, 0]);
  const [notes, setNotes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [totalTicks, setTotalTicks] = useState(0);
  const [keyWidth, setKeyWidth] = useState(25);
  const [keyHeight, setKeyHeight] = useState(100);
  const prevMidiFilePath = useRef("");
  const prevNumNotes = useRef([]);
  const prevTotalTicks = useRef(-1);
  const prevKeyWidth = useRef(-1);
  const prevKeyHeight = useRef(-1);
  const prevNotes = useRef([]);
  const [lowest, setLowest] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [midiFilePath, keyWidth, keyHeight])
  

  const fetchMidiFile = async () => {
    console.log("FETCHING MIDI FILE");
    const response = await fetch(midiFilePath);
    const arrayBuffer = await response.arrayBuffer();
    const player = new Midi.Player();
    player.loadArrayBuffer(arrayBuffer);
    let lowest = Infinity;
    let highest = -Infinity;
    let noteToNoteState = {};
    //Consists of three fields where the first is the noteName the second is its duration in ticks and the third is its notenumber
    let notes = [];
    let totalTicks = 0;
    const events = player.getEvents();
    events.forEach((event) => {
      if (isIterable(event)) {
        event.forEach((e) => {
          //Note off is not a needed check as the library only displays things as note on :'(
          //Keeping the check around though in case they fix the library
          if (e.name == "Note on" || e.name == "Note off") {
            if (e.tick > totalTicks) {
              totalTicks = e.tick;
            }
            if (noteToNoteState[e.noteNumber] == undefined) {
              noteToNoteState[e.noteNumber] = [e.noteName, true, e.tick];
            } else {
              if (noteToNoteState[e.noteNumber][1] == true) {
                noteToNoteState[e.noteNumber][1] = false;
                notes.push([
                  e.noteName,
                  e.tick - noteToNoteState[e.noteNumber][2],
                  e.noteNumber,
                  e.tick - (e.tick - noteToNoteState[e.noteNumber][2])
                ]);
              } else {
                noteToNoteState[e.noteNumber][1] = true;
                noteToNoteState[e.noteNumber][2] = e.tick;
              }
            }
            if (e.noteNumber < lowest) {
              lowest = e.noteNumber;
            }
            setLowest(lowest);
            if (e.noteNumber > highest) {
              highest = e.noteNumber;
            }
          }
        });
      }
    });

    let blackKeyNum = 0;

    for (let i = numNotes[0]; i <= numNotes[1]; i++) {
      //1 3 6 8 10 are all the black keys
      if (
        i % 12 == 1 ||
        i % 12 == 3 ||
        i % 12 == 6 ||
        i % 12 == 8 ||
        i % 12 == 10
      ) {
        blackKeyNum++; //
      }
    }
    // Calculate the new state
    const newNumNotes = [lowest, highest];
    const newKeyWidth =
      window.innerWidth / (newNumNotes[1] - newNumNotes[0] - blackKeyNum + 1);
    const newNotes = notes;
    const newKeyHeight = 3 * newKeyWidth;

    setTotalTicks(totalTicks);
    prevTotalTicks.current = totalTicks;
    //prevMidiFilePath.current = midiFilePath;

    // Only update the state if the new state is different from the old state
    if (newKeyWidth !== keyWidth) {
      await setKeyWidth(newKeyWidth);
      prevKeyWidth.current = keyWidth;
      // fetchMidiFile(midiFilePath);
    }
    if (newNumNotes !== numNotes) {
      await setNumNotes(newNumNotes);
      prevNumNotes.current = numNotes;
    }
    if (newNotes !== notes) {
      await setNotes(newNotes);
      prevNotes.current = notes;
    }
    if (newKeyHeight !== keyHeight) {
      await setKeyHeight(newKeyHeight);
      prevKeyHeight.current = keyHeight;
    }
    setNotes(newNotes);
    setIsLoaded(true);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    const handleResize = () => {
      fetchMidiFile();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
    
  }, []);
  

  useEffect(() => {
    if (
      midiFilePath !== prevMidiFilePath.current ||
      numNotes !== prevNumNotes.current ||
      totalTicks !== prevTotalTicks.current ||
      keyWidth !== prevKeyWidth.current ||
      keyHeight !== prevKeyHeight.current
    ) {
      fetchMidiFile();
    }


  }, [midiFilePath, keyWidth, keyHeight]);

  useEffect(() => {
    console.log("FILE PATH CHANGED");
    fetchMidiFile();
  }, [midiFilePath]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        overflowY: "scroll",
        overflowX: "scroll",
        whiteSpace: "nowrap",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
    <div style={{position: "relative", height: (1 * 0.3 * totalTicks) +"px", width: "100%", transform: "rotate(180deg) scaleX(-1)",zIndex: -1}}>
      {(() => {

        //fetchMidiFile();
        let divArray = [];
        let size = 1;
        divArray.push(
          <div
            key={-1}
            style={{
              position: "absolute",
              left: 0,
              display: "inline-block",
              width: "100%",
              height: size * 0.3 * totalTicks + "px",
              backgroundColor: "#15151e",
              zIndex: -1,
            }}
          >
            {buildNotes(notes, keyWidth, lowest, totalTicks)}
          </div>
          
        );
        return divArray;
      })()}
        
    </div>
    
    <div style={{position: "relative", height: keyHeight}}>
      {(() => {
        let divArray = [];
        let whiteNum = 0;
        let lastWhiteKeyPosition = 0;

        for (let i = numNotes[0]; i <= numNotes[1]; i++) {
          //1 3 6 8 10 are all the black keys
          if (
            i % 12 == 1 ||
            i % 12 == 3 ||
            i % 12 == 6 ||
            i % 12 == 8 ||
            i % 12 == 10
          ) {
            divArray.push(
              <div
                key={i}
                style={{
                  position: "absolute",
                  left:
                    lastWhiteKeyPosition + (keyWidth) - keyWidth / 4 + "px",
                  display: "inline-block",
                  width: keyWidth / 2 + "px",
                  height: keyHeight * (5 / 8) + "px",
                  backgroundColor: "black",
                  zIndex: 2,
                }}
              ></div>
            );
          } else {
            lastWhiteKeyPosition = keyWidth * whiteNum;
            whiteNum++;
            divArray.push(
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: lastWhiteKeyPosition + "px",
                  boxShadow: "inset 0 0 0 1px black",
                  display: "inline-block",
                  width: keyWidth + "px",
                  height: keyHeight + "px",
                  backgroundColor: "white",
                }}
              ></div>
            );
          }
        }
        return divArray;
        //<div key={index} style={{ border: "5px solid black", display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'blue'}}></div>
      })()}
      <div ref={bottomRef}/>
      </div>
    </div>
  );
}

export default Midi_Display;

<Midi_Display midiFilePath="/path/to/your/midi/file.mid" />;