import worlds from "./worlds.js";

class Pacman {
	constructor(name, ordinates, initialPosition) {
		this.name = name;
		this.ordinates = ordinates;
		this.pos = initialPosition;
		this.score = 0;
	}
}

//sockets
let id;
const socket = io();
let pacman;

const name = prompt("Enter username: ");
$("#chatbox").append(`<p>You joined the chat.</p>`);
$("#name").html(`${name}`);

socket.emit("new_user", {
	name,
	score: 0,
	ordinates: { x: 1, y: 1 },
	pos: { x: 123, y: 552 },
});

socket.on("create_pacman", (data) => {
	console.log(data);
	pacman = new Pacman(data.name, data.ordinates, data.pos);
	id = data.id;
	console.log(id);
});

socket.on("updated_list", (data) => {
	document.querySelector(".pacmans").innerHTML = "";

	const keys = Object.keys(data);
	keys.forEach((key) => {
		if (key != id) {
			display_other_users({
				name: data[key].name,
				ordinates: data[key].ordinates,
				pos: data[key].pos,
				id: key,
			});
		}
	});
});

socket.on("player_wins", (data) => {
	$("#gameover").append(`<h2>${data.name} wins!</h2>`);
	$("#gameover").css(`display`, "block");
	$("#again").css(`display`, "block");
});

socket.on("user_connected", (data) => {
	$("#chatbox").append(`<p>${data.name} joined the chat.</p>`);
});

socket.on("user_disconnected", (data) => {
	$("#chatbox").append(`<p>${data.name} disconnected.</p>`);
	$(`#${data.name}`).remove();
});

//TODO
//sending the message in the chatbox
$("form").submit(() => {
	const chat = $("#chat").val();
	$("#chatbox").append(`<p>You: ${chat}</p>`);
	$("#chat").val("");
	socket.emit("send_chat", { name, chat });

	return false;
});

$("#yes").click(() => {
	location.reload();
});

socket.on("update_message", (data) => {
	$("#chatbox").append(`<p>${data.name}: ${data.chat}</p>`);
});

//display all connected clients
function display_other_users(user) {
	let new_pacman = document.createElement("div");

	new_pacman.classList.add("pacman");
	new_pacman.setAttribute("id", user.name);
	new_pacman.style.cssText = `
	top: ${user.pos.x}px;
	left: ${user.pos.y}px;
	`;

	document.querySelector(".pacmans").append(new_pacman);
}

//display world
function displayWorld(world) {
	let output = "";
	for (let row = 0; row < world.length; row++) {
		output += "\n<div class='row'>\n";
		for (let col = 0; col < world[row].length; col++) {
			if (world[row][col] == 2) {
				output += "<div class='brick'></div>";
			} else if (world[row][col] == 1) {
				output += "<div class='coin'></div>";
			} else if (world[row][col] == 0) {
				output += "<div class='empty'></div>";
			} else if (world[row][col] == 3) {
				output += "<div class='dcherry'></div>";
			}
		}
		output += "</div>";
	}

	document.getElementById("world").innerHTML = output;
}

//start the game
function startGame(world) {
	displayWorld(world);
	document.onkeydown = function (e) {
		if (
			e.keyCode == 40 &&
			world[pacman.ordinates.x + 1][pacman.ordinates.y] != 2
		) {
			//BOTTOM
			document.getElementById("pacman").style.top = pacman.pos.x + 30 + "px";
			pacman.pos.x += 30;
			pacman.ordinates.x += 1;

			socket.emit("update_pos", {
				id,
				top: pacman.pos.y,
				left: pacman.pos.x,
				x: pacman.ordinates.x,
				y: pacman.ordinates.y,
			});
		} else if (
			e.keyCode == 38 &&
			world[pacman.ordinates.x - 1][pacman.ordinates.y] != 2
		) {
			//TOP
			document.getElementById("pacman").style.top = pacman.pos.x - 30 + "px";
			pacman.pos.x -= 30;
			pacman.ordinates.x -= 1;
			socket.emit("update_pos", {
				id,
				top: pacman.pos.y,
				left: pacman.pos.x,
				x: pacman.ordinates.x,
				y: pacman.ordinates.y,
			});
		} else if (
			e.keyCode == 39 &&
			world[pacman.ordinates.x][pacman.ordinates.y + 1] != 2
		) {
			//RIGHT
			document.getElementById("pacman").style.left = pacman.pos.y + 30 + "px";
			pacman.pos.y += 30;
			pacman.ordinates.y += 1;

			socket.emit("update_pos", {
				id,
				top: pacman.pos.y,
				left: pacman.pos.x,
				x: pacman.ordinates.x,
				y: pacman.ordinates.y,
			});
		} else if (
			e.keyCode == 37 &&
			world[pacman.ordinates.x][pacman.ordinates.y - 1] != 2
		) {
			//LEFT
			document.getElementById("pacman").style.left = pacman.pos.y - 30 + "px";
			pacman.pos.y -= 30;
			pacman.ordinates.y -= 1;
			socket.emit("update_pos", {
				id,
				top: pacman.pos.y,
				left: pacman.pos.x,
				x: pacman.ordinates.x,
				y: pacman.ordinates.y,
			});
		}

		// if collision happens in coins & cherries
		if (world[pacman.ordinates.x][pacman.ordinates.y] == 1) {
			world[pacman.ordinates.x][pacman.ordinates.y] = 0;
			pacman.score += 10;
			document.getElementById("points").innerHTML = pacman.score;
			socket.emit("coin_captured", world);

			if (gameCompleteChecker(world)) {
				socket.emit("winner", { ...pacman });
			}

			// if (pacman.score == 110) {
			// 	socket.emit("winner", { ...pacman });
			// }
			displayWorld(curr_world);
		}
	};
}

//checks if all coins/cherrys are all collected
function gameCompleteChecker(world) {
	let count = 0;
	for (let row = 0; row < world.length; row++) {
		for (let col = 0; col < world[row].length; col++) {
			if (world[row][col] == 1) {
				count++;
			}
		}
	}
	if (!count) return 1;
}

let curr_world = worlds[0];
socket.on("update_coins", (data) => {
	curr_world = data;
	startGame(curr_world);
});
startGame(curr_world);
