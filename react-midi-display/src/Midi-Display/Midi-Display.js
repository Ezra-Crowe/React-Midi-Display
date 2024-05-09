import React, { useEffect, useState, useRef } from "react";
import Midi from "midi-player-js";
import "./Midi-Display.css";

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  //console.log(obj + " is returning " + (typeof obj[Symbol.iterator] !== 'undefined') + " for " + typeof obj[Symbol.iterator]);
  return typeof obj[Symbol.iterator] !== "undefined";
}

function buildNotes(notes) {
  let prevNote = [0, "", 0];
  let divArray = [];
  divArray.push(
    <div
      style={{
        backgroundColor: "blue", // Example background color
        width: `${100}px`, // Example width based on note duration
        height: "20px", // Example fixed height
        position: "absolute",
        left: `${0}px`, // Example positioning based on note number
        top: "0",
        zIndex: 10,
      }}
    ></div>
  );
  for (let i = 0; i < notes.length; i++) {
    const [noteName, duration, noteNumber] = notes[i];
    // Customize visual representation of each note
    const style = {
      backgroundColor: "blue", // Example background color
      width: `${duration}px`, // Example width based on note duration
      height: "20px", // Example fixed height
      position: "absolute",
      left: `${noteNumber * 10}px`, // Example positioning based on note number
      top: "0", // Example fixed top position
    };
    console.log("build note div: " + divArray);
    divArray.push(<div key={i} style={style}></div>);
  }
  return divArray;
}
export { buildNotes };

function Midi_Display({ midiFilePath }) {
  const [numNotes, setNumNotes] = useState([0, 0]);
  const [notes, setNotes] = useState([]);
  const [totalTicks, setTotalTicks] = useState(0);
  const [keyWidth, setKeyWidth] = useState(25);
  const [keyHeight, setKeyHeight] = useState(100);
  const prevMidiFilePath = useRef("");
  const prevNumNotes = useRef([]);
  const prevTotalTicks = useRef(-1);
  const prevKeyWidth = useRef(-1);
  const prevKeyHeight = useRef(-1);
  const prevNotes = useRef([]);

  const fetchMidiFile = async () => {
    console.log(`Fetching MIDI file from ${midiFilePath}`);
    const response = await fetch(midiFilePath);
    const arrayBuffer = await response.arrayBuffer();
    const player = new Midi.Player();
    player.loadArrayBuffer(arrayBuffer);
    console.log("events ${}", player.getEvents());
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
              setTotalTicks(e.tick);
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
                ]);
              } else {
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
    console.log(`Total ticks: ${totalTicks}`);

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
    const newKeyWidth =
      window.innerWidth / (numNotes[1] - numNotes[0] - blackKeyNum + 1);
    const newNumNotes = [lowest, highest];
    const newNotes = notes;

    // Only update the state if the new state is different from the old state
    if (newKeyWidth !== keyWidth) {
      setKeyWidth(newKeyWidth);
    }
    if (newNumNotes !== numNotes) {
      setNumNotes(newNumNotes);
    }
    if (newNotes !== notes) {
      setNotes(newNotes);
    }
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

    prevMidiFilePath.current = midiFilePath;
    prevNumNotes.current = numNotes;
    prevTotalTicks.current = totalTicks;
    prevKeyWidth.current = keyWidth;
    prevKeyHeight.current = keyHeight;
    prevNotes.current = notes;
  }, [midiFilePath, keyWidth]);

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
    <div style={{position: "relative", height: (1 * 0.3 * totalTicks)+"px", width: "100%", zIndex: -1}}>
      {(() => {
        console.log("num notes: " + numNotes[0] + " " + numNotes[1]);
        console.log("noteWidth: " + keyWidth);

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
              backgroundColor: "grey",
              zIndex: -1,
            }}

          ></div>
        );
        return divArray;
      })()}
    {buildNotes(notes)}
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
                    lastWhiteKeyPosition + (keyWidth + 1) - keyWidth / 4 + "px",
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
            //console.log("lastWhiteKeyPosition after: " + lastWhiteKeyPosition);
            //console.log("total space: " + ((keyWidth + 1) * whiteNum));
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
        console.log(whiteNum);
        console.log("window size: " + window.innerWidth);
        return divArray;
        //<div key={index} style={{ border: "5px solid black", display: 'inline-block', width: '20px', height: '20px', backgroundColor: 'blue'}}></div>
      })()}
      </div>
    </div>
  );
}

export default Midi_Display;

<Midi_Display midiFilePath="/path/to/your/midi/file.mid" />;
