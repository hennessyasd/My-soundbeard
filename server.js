require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { User, Song } = require('./models');
const sequelize = require('./db');
const i18n = require('i18n');
const { user } = require("./data/user");

const port = process.env.PORT || 5000;
const app = express();

i18n.configure({
  locales: ['en', 'ru'], 
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en', 
  queryParameter: 'lang', 
  autoReload: true, 
  syncFiles: true 
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/songs", express.static(path.join(__dirname, "songs")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(i18n.init);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "songs"));
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send(res.__("username_password_required"));
  }

  try {
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).send(res.__("user_exists"));
    }

    await User.create({ username, password });
    res.status(201).send(res.__("register_success"));
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).send(res.__("internal_server_error"));
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send(res.__("username_password_required"));
  }

  try {
    const user = await User.findOne({ where: { username, password } });
    if (!user) {
      return res.status(400).send(res.__("invalid_credentials"));
    }

    res.status(200).send(res.__("login_success"));
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).send(res.__("internal_server_error"));
  }
});

app.get("/download", (req, res) => {
  const content = `Total number of songs who was downloaded by user = ${user.downloadSongs}\n
  Total count of songs = ${user.countSongs}\n`;

  res.setHeader("Content-Disposition", "download.txt");
  res.setHeader("Content-Type", "text/plain");
  res.send(content);
});

app.post("/upload", upload.single("fileData"), async (req, res) => {
  const filedata = req.file;
  if (!filedata) {
    res.send("Error uploading file");
  } else {
    try {
      await Song.create({ name: filedata.originalname, file_path: filedata.path });
      user.countSongs+=1;
      user.downloadSongs+=1;
      res.status(200).redirect("/");
    } catch (err) {
      console.error("Error saving song:", err);
      res.status(500).send("Internal Server Error");
    }
  }
});

app.get("/songs", async (req, res) => {
  try {
    const songs = await Song.findAll();
    res.json(songs);
  } catch (err) {
    console.error("Error retrieving songs:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.delete("/delete/:songName", async (req, res) => {
  const songName = req.params.songName;

  try {
    const song = await Song.findOne({ where: { name: songName } });
    if (!song) {
      return res.status(404).send("Song not found");
    }

    await song.destroy();
    fs.unlink(path.join(__dirname, "songs", songName), (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return res.status(500).send("Internal Server Error");
      }
      user.downloadSongs-=1;
      res.send("Song deleted successfully");
    });
  } catch (err) {
    console.error("Error deleting song:", err);
    res.status(500).send("Internal Server Error");
  }
});

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (e) {
    console.log(e);
  }
};

start();
