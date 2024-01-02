import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "World",
  password: "Rksakg@20",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted(currentUserId) {
  const result = await db.query(`SELECT country_code FROM visited_countries WHERE user_id = ${currentUserId}`);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser(){

  const users = await db.query('SELECT * FROM users');

  const user = users.rows.find((user) => user.id == currentUserId);
  return user;
}

app.get("/", async (req, res) => {

  const users = await db.query('SELECT * FROM users');
  const countries = await checkVisisted(currentUserId);
  const user = await getCurrentUser();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users.rows,
    color: user.color,
  });

});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});


app.post("/user", async (req, res) => {
  
  if (req.body.add) {
    res.render('new.ejs');
  }

  else if (req.body.user) {
    currentUserId = parseInt(req.body.user)
    res.redirect('/');
  }

});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const newName = req.body.name;
  const newColor = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [newName, newColor]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect('/');

});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
