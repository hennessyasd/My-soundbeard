const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { user } = require("./data/user");

const app = express();
const port = 3000;

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
const uploadedFiles = [];

// File for storing registered users
const usersFile = path.join(__dirname, "data", "users.json");

app.use(express.static(path.join(__dirname, "public")));
app.use("/songs", express.static(path.join(__dirname, "songs")));

// Use Express's built-in body-parser
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get("/", (_, res) => res.redirect("/"));

app.post("/upload", upload.single("fileData"), function (req, res, next) {
  let filedata = req.file;
  if (!filedata) {
    res.send("Ошибка при загрузке файла");
  } else {
    console.log(filedata);
    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
    };
    user.countSongs += 1;
    user.downloadSongs += 1;
    uploadedFiles.push(fileInfo);

    console.log("UPLOAD FILE ON SERVER IN DIRECTORY `SONGS`!");
    res.status(200).redirect("/");
  }
});

app.get("/songs", (req, res) => {
  const songsDir = path.join(__dirname, "songs");
  fs.readdir(songsDir, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500);
    } else {
      const songList = files.map((file) => ({ name: file }));
      res.json(songList);
    }
  });
});

app.delete("/delete/:songName", (req, res) => {
  const songName = req.params.songName;
  const filePath = path.join(__dirname, "songs", songName);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      console.log(`File: ${songName} has been deleted!`);
      res.send("Song deleted successfully");
    }
    user.downloadSongs -= 1;
  });
});

app.get("/download", (req, res) => {
  const content = `Total number of songs who was downloaded by user = ${user.downloadSongs}\n
  Total count of songs = ${user.countSongs}\n`;

  res.setHeader("Content-Disposition", "attachment; filename=download.txt");
  res.setHeader("Content-Type", "text/plain");
  res.send(content);
});

const ensureUsersFileExists = () => {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }
};


const userFile = path.join(__dirname, "data", "users.json");

app.post("/register", (req, res) => {
  ensureUsersFileExists();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  fs.readFile(usersFile, "utf8", (err, data) => {
    if (err) {
      console.error("Ошибка при чтении файла users.json:", err);
      return res.status(500).send("Internal Server Error");
    }

    let users = [];
    if (data) {
      users = JSON.parse(data);
    }

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      console.log("Пользователь уже существует:", username);
      return res.status(400).send("User already exists");
    }

    users.push({ username, password });

    
    fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
      if (err) {
        console.error(`Ошибка при записи в файл ${usersFile}:`, err);
        return res.status(500).send("Error saving user");
      }

      console.log("Пользователь успешно зарегистрирован и добавлен в файл:", username);
      return res.status(201).send("User registered successfully");
    });
  });
});

app.use((req, res, next) => {
  res.status(404).send("<h1>Error! What's wrong?</h1>");
});

app.listen(port, () => console.log(`Server started on port ${port}`));
