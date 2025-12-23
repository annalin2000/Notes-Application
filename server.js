const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;  

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dataFilePath = path.join(__dirname, "data.json");

const readData = () => {
  if (!fs.existsSync(dataFilePath)) {
    return [];
  }
  const data = fs.readFileSync(dataFilePath);
  if (!isJsonString(data)) {
    return [];
  }
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}


app.get("/note", (req, res) => {
  const notes = readData();
  res.status(200).json(notes);
});

app.get("/note/:id", (req, res) => {
  const { id } = req.params;
  const note = readData().find((n) => n.id === id);
  if (note) {
    res.status(200).json(note);
  } else {
    res.status(404).send("Note not found");
  }
});

app.post("/note", (req, res) => {
  const newNote = { id: uuidv4(), ...req.body, created_date: new Date() };
  const notes = readData();
  notes.push(newNote);
  writeData(notes);
  res.status(201).json({ message: "Note added successfully", data: newNote });
});

app.put("/note", (req, res) => {
  const updatedNote = { ...req.body, updated_date: new Date() };
  const notes = readData();
  const index = notes.findIndex(n => n.id === updatedNote.id);
  if (index !== -1) {
    notes[index] = updatedNote;
    writeData(notes);
    res.status(200).json(updatedNote);
  } else {
    res.status(404).send("Note not found");
  }
});

app.delete("/note/:id", (req, res) => {
  const { id } = req.params;
  const notes = readData();
  const newNotes = notes.filter(n => n.id !== id);
  writeData(newNotes);
  res.status(200).json({ message: "Note deleted successfully" });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
