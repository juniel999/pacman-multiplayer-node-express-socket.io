const express = require("express");

const app = express();

app.use(express.static(__dirname + "/public"));

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

const server = app.listen(3000, () =>
	console.log("Server is running at port 3000")
);

const io = require("socket.io")(server);

//routes
app.get("/", (req, res) => {
	res.render("index");
});

//sockets
let online_users = {};

io.on("connection", (socket) => {
	socket.on("new_user", async (data) => {
		try {
			online_users[socket.id] = data;
			await socket.emit("create_pacman", { ...data, id: socket.id });
			socket.broadcast.emit("user_connected", data);
			io.emit("updated_list", online_users);
		} catch (error) {
			console.log(error);
		}
	});

	socket.on("update_pos", (data) => {
		online_users[data.id].pos.x = data.left;
		online_users[data.id].pos.y = data.top;
		online_users[data.id].ordinates.x = data.x;
		online_users[data.id].ordinates.y = data.y;
		socket.broadcast.emit("updated_list", online_users);
	});

	socket.on("send_chat", (data) => {
		socket.broadcast.emit("update_message", data);
	});

	socket.on("coin_captured", (data) => {
		socket.broadcast.emit("update_coins", data);
	});

	socket.on("winner", (data) => {
		io.emit("player_wins", data);
	});

	socket.on("disconnect", () => {
		socket.broadcast.emit("user_disconnected", online_users[socket.id]);
		delete online_users[socket.id];
	});
});
