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

document.addEventListener("DOMContentLoaded", loadSongs);

async function registration(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch('/register', {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert("Регистрация успешна!");
    document.getElementById("registrationForm").reset();
  } else {
    const errorMessage = await response.text();
    alert(`Ошибка: ${errorMessage}`);
  }
}

document.getElementById("registrationForm").addEventListener("submit", registration);