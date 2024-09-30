async function loadSongs() {
  const response = await fetch("/songs");
  const songs = await response.json();

  const songList = document.getElementById("songList");
  songList.innerHTML = '';

  songs.forEach(song => {
    const path = `/songs/${song.name}`;
    const listItem = document.createElement("li");
    listItem.textContent = song.name;
    
    const audioElement = document.createElement("audio");
    audioElement.src = path;
    audioElement.controls = true;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Удалить";
    deleteButton.onclick = () => deleteSong(song.name);

    listItem.appendChild(audioElement);
    listItem.appendChild(deleteButton);

    songList.appendChild(listItem);
  });
}

async function deleteSong(songName) {
  const response = await fetch(`/delete/${songName}`, {
    method: "DELETE",
  });

  if (response.ok) {
    loadSongs();
  } else {
    alert("Ошибка при удалении песни");
  }
}

let isRegisterMode = true;

document.getElementById("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const url = isRegisterMode ? "/register" : "/login";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const message = await response.text();
  alert(message);
  
  if (response.ok && !isRegisterMode) {
    alert("Вход успешен! (сюда можно вставить редирект на другую страницу)")
  }
});

document.getElementById("toggleButton").addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  document.getElementById("authButton").textContent = isRegisterMode ? "Register" : "Login";
  document.getElementById("toggleButton").textContent = isRegisterMode ? "Switch to Login" : "Switch to Register";
});

document.addEventListener("DOMContentLoaded", loadSongs);